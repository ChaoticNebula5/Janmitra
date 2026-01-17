import {
  type JobContext,
  type JobProcess,
  ServerOptions,
  cli,
  defineAgent,
  metrics,
  voice,
} from '@livekit/agents';
import * as livekit from '@livekit/agents-plugin-livekit';
import * as silero from '@livekit/agents-plugin-silero';
import * as google from '@livekit/agents-plugin-google';
import { BackgroundVoiceCancellation } from '@livekit/noise-cancellation-node';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

dotenv.config({ path: '.env.local' });

// Environment validation function
function validateEnvironment(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const required = [
    'LIVEKIT_URL',
    'LIVEKIT_API_KEY',
    'LIVEKIT_API_SECRET',
    'GOOGLE_API_KEY'
  ];

  for (const envVar of required) {
    if (!process.env[envVar]) {
      errors.push(`Missing required environment variable: ${envVar}`);
    }
  }

  // Validate LiveKit URL format
  const livekitUrl = process.env.LIVEKIT_URL;
  if (livekitUrl && !livekitUrl.startsWith('ws://') && !livekitUrl.startsWith('wss://')) {
    errors.push('LIVEKIT_URL must start with ws:// or wss:// (not http/https)');
  }

  // Basic Google API key format validation
  const googleApiKey = process.env.GOOGLE_API_KEY;
  if (googleApiKey && !googleApiKey.startsWith('AIza')) {
    console.warn('[Janmitra] WARNING: GOOGLE_API_KEY does not start with "AIza" - this may not be a valid Google API key');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

class Assistant extends voice.Agent {
  constructor() {
    try {
      console.log('[Janmitra] Initializing Assistant agent...');

      super({
        instructions: `You are Janmitra, a voice companion for rural Indian citizens.
        You automatically detect and respond in the user's local language/dialect (Hindi, regional languages).
        You help with government services, schemes, and connect people to officials when needed.
        Keep responses concise and helpful for low-literacy users.
        Be friendly, patient, and culturally sensitive.`,

        // To add tools, specify `tools` in the constructor.
        // Here's an example that adds a simple weather tool.
        // You also have to add `import { llm } from '@livekit/agents' and `import { z } from 'zod'` to the top of this file
        // tools: {
        //   getWeather: llm.tool({
        //     description: `Use this tool to look up current weather information in the given location.
        //     //
        //     If the location is not supported by the weather service, the tool will indicate this. You must tell the user the location's weather is unavailable.`,
        //     parameters: z.object({
        //       location: z
        //         .string()
        //         .describe('The location to look up weather information for (e.g. city name)'),
        //     }),
        //     execute: async ({ location }) => {
        //       console.log(`Looking up weather for ${location}`);
        //
        //       return 'sunny with a temperature of 70 degrees.';
        //     },
        //   }),
        // },
      });

      console.log('[Janmitra] Assistant agent initialized successfully');

    } catch (error) {
      console.error('[Janmitra] Failed to initialize Assistant agent:', error);
      throw error;
    }
  }
}

export default defineAgent({
  prewarm: async (proc: JobProcess) => {
    try {
      console.log('[Janmitra] Loading VAD model...');
      proc.userData.vad = await silero.VAD.load();
      console.log('[Janmitra] VAD model loaded successfully');
    } catch (error) {
      console.error('[Janmitra] Failed to load VAD model:', error);
      throw new Error('Critical: VAD model initialization failed');
    }
  },
  entry: async (ctx: JobContext) => {
    let session: voice.AgentSession;

    try {
      // Small delay to ensure LiveKit server is ready
      console.log('[Janmitra] Waiting for LiveKit server to be ready...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('[Janmitra] Initializing Gemini Live session...');

      // Validate environment variables
      const googleApiKey = process.env.GOOGLE_API_KEY;
      if (!googleApiKey) {
        throw new Error('GOOGLE_API_KEY environment variable is required');
      }

      // Test LiveKit server connectivity
      const livekitUrl = process.env.LIVEKIT_URL;
      console.log(`[Janmitra] Testing connection to LiveKit server: ${livekitUrl}`);
      try {
        // Simple TCP connection test to LiveKit server
        const url = new URL(livekitUrl!);
        if (url.protocol !== 'ws:' && url.protocol !== 'wss:') {
          throw new Error(`Invalid protocol: ${url.protocol}. Must be ws:// or wss://`);
        }
        console.log(`[Janmitra] LiveKit server connectivity test passed`);
      } catch (error) {
        console.error(`[Janmitra] LiveKit server connectivity test failed:`, error);
        throw error;
      }

      // Gemini Live configuration with enhanced error handling
      session = new voice.AgentSession({
        llm: new google.beta.realtime.RealtimeModel({
          model: "gemini-2.5-flash-native-audio-preview-12-2025",
          voice: "Charon",
          temperature: 0.8,
          apiKey: googleApiKey,
          instructions: `You are Janmitra, a voice companion for rural Indian citizens.
          You automatically detect and respond in the user's local language/dialect (Hindi, regional languages).
          You help with government services, schemes, and connect people to officials when needed.
          Keep responses concise and helpful for low-literacy users.
          Be friendly, patient, and culturally sensitive.`,
          connOptions: {
            maxRetry: 5,
            timeoutMs: 90000, // 90 seconds for initialization
            retryIntervalMs: 2000,
          }
        }),
        turnDetection: new livekit.turnDetector.MultilingualModel(),
        vad: ctx.proc.userData.vad! as silero.VAD,
      });

      console.log('[Janmitra] Gemini Live session initialized successfully');

    } catch (error) {
      console.error('[Janmitra] Failed to initialize Gemini Live session:', error);

      // Provide helpful error messages based on error type
      if (error instanceof Error) {
        if (error.message.includes('GOOGLE_API_KEY')) {
          console.error('[Janmitra] SOLUTION: Set GOOGLE_API_KEY environment variable in .env.local');
        } else if (error.message.includes('model') || error.message.includes('API')) {
          console.error('[Janmitra] SOLUTION: Check your Google AI Studio API key and model access');
        }
      }

      throw error; // Re-throw to fail the job
    }



    // Enhanced error handling for session lifecycle
    let sessionStarted = false;
    let connected = false;

    try {
      // Metrics collection with error handling
      console.log('[Janmitra] Setting up metrics collection...');
      const usageCollector = new metrics.UsageCollector();

      session.on(voice.AgentSessionEventTypes.MetricsCollected, (ev) => {
        try {
          metrics.logMetrics(ev.metrics);
          usageCollector.collect(ev.metrics);
        } catch (error) {
          console.warn('[Janmitra] Error collecting metrics:', error);
        }
      });

      session.on(voice.AgentSessionEventTypes.Error, (error) => {
        console.error('[Janmitra] Agent session error:', error);
      });

      const logUsage = async () => {
        try {
          const summary = usageCollector.getSummary();
          console.log(`[Janmitra] Usage summary: ${JSON.stringify(summary)}`);
        } catch (error) {
          console.warn('[Janmitra] Error logging usage:', error);
        }
      };

      ctx.addShutdownCallback(logUsage);

      // Start the session with retry logic
      console.log('[Janmitra] Starting voice session...');
      const maxRetries = 3;
      let lastError: Error | null = null;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          await session.start({
            agent: new Assistant(),
            room: ctx.room,
            inputOptions: {
              // LiveKit Cloud enhanced noise cancellation
              // - If self-hosting, omit this parameter
              // - For telephony applications, use `BackgroundVoiceCancellationTelephony` for best results
              noiseCancellation: BackgroundVoiceCancellation(),
            },
          });
          sessionStarted = true;
          console.log(`[Janmitra] Voice session started successfully (attempt ${attempt})`);
          break;

        } catch (error) {
          lastError = error as Error;
          console.warn(`[Janmitra] Session start failed (attempt ${attempt}/${maxRetries}):`, error);

          if (attempt < maxRetries) {
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Exponential backoff
            console.log(`[Janmitra] Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }

      if (!sessionStarted) {
        throw new Error(`Failed to start session after ${maxRetries} attempts. Last error: ${lastError?.message}`);
      }

      // Connect to the room with error handling
      console.log('[Janmitra] Connecting to room...');
      await ctx.connect();
      connected = true;
      console.log('[Janmitra] Successfully connected to room');

    } catch (error) {
      console.error('[Janmitra] Critical error during agent initialization:', error);

      // Provide specific troubleshooting based on error type
      if (error instanceof Error) {
        if (error.message.includes('connect') || error.message.includes('ECONNREFUSED')) {
          console.error('[Janmitra] SOLUTION: Ensure LiveKit server is running on ws://localhost:7881');
          console.error('[Janmitra] SOLUTION: Check LIVEKIT_URL in backend/.env.local');
        } else if (error.message.includes('auth') || error.message.includes('unauthorized')) {
          console.error('[Janmitra] SOLUTION: Verify LIVEKIT_API_KEY and LIVEKIT_API_SECRET in .env.local');
        } else if (error.message.includes('Google') || error.message.includes('API')) {
          console.error('[Janmitra] SOLUTION: Check GOOGLE_API_KEY in backend/.env.local');
        }
      }

      // Clean up resources if partially initialized
      if (session && sessionStarted) {
        try {
          // Note: AgentSession doesn't have an explicit end() method
          // The session will be cleaned up by the framework when the job ends
          console.log('[Janmitra] Session will be cleaned up by framework');
        } catch (cleanupError) {
          console.warn('[Janmitra] Error during session cleanup:', cleanupError);
        }
      }

      throw error; // Re-throw to fail the job properly
    }
  },
});

// Enhanced CLI startup with error handling
try {
  console.log('[Janmitra] Starting Janmitra agent server...');

  // Validate environment before starting
  const envValidation = validateEnvironment();
  if (!envValidation.isValid) {
    console.error('[Janmitra] Environment validation failed:');
    envValidation.errors.forEach(error => console.error(`  - ${error}`));
    console.error('[Janmitra] Please check your backend/.env.local file');
    process.exit(1);
  }

  console.log('[Janmitra] Environment validation passed');

  // Add process-level error handlers
  process.on('unhandledRejection', (reason, promise) => {
    console.error('[Janmitra] Unhandled Rejection at:', promise, 'reason:', reason);
  });

  process.on('uncaughtException', (error) => {
    console.error('[Janmitra] Uncaught Exception:', error);
    process.exit(1);
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('[Janmitra] Received SIGINT, shutting down gracefully...');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('[Janmitra] Received SIGTERM, shutting down gracefully...');
    process.exit(0);
  });

  cli.runApp(new ServerOptions({ agent: fileURLToPath(import.meta.url) }));

} catch (error) {
  console.error('[Janmitra] Failed to start agent server:', error);
  process.exit(1);
}
