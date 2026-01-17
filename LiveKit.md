# Janmitra - LiveKit Agents Voice AI Application

## Project Overview

This is a **LiveKit Agents starter project** - a full-stack voice AI application. The project consists of:

- **Frontend**: A Next.js React application providing the user interface
- **Backend**: A Node.js TypeScript agent using LiveKit Agents framework
- **Communication**: Real-time voice/video/chat via LiveKit's WebRTC infrastructure

## Backend Architecture (Node.js/TypeScript)

**Location**: `backend/` directory  
**Main File**: `backend/src/agent.ts`

### Key Components:

1. **Voice AI Pipeline**:
   - **STT**: AssemblyAI universal streaming for speech-to-text
   - **LLM**: OpenAI GPT-4.1-mini for conversation logic
   - **TTS**: Cartesia Sonic-3 for text-to-speech synthesis
   - **Voice**: Pre-configured voice ID for consistent agent voice

2. **Agent Personality**:
   - Helpful voice AI assistant with concise, friendly responses
   - Configurable instructions in the `Assistant` class
   - Support for custom tools (weather tool example commented in code)

3. **Real-time Features**:
   - **Turn Detection**: LiveKit's multilingual model for speaker detection
   - **VAD**: Silero Voice Activity Detection for speech segmentation
   - **Noise Cancellation**: LiveKit Cloud background voice cancellation
   - **Preemptive Generation**: LLM can start responding while user is still speaking

4. **Metrics & Monitoring**:
   - Usage collection and logging
   - Performance metrics tracking

### Configuration:
- Environment variables: `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`
- Models and voices configurable in the `AgentSession` setup
- Optional realtime model support (OpenAI Realtime API alternative)

## Frontend Architecture (Next.js/React)

**Location**: `frontend/` directory  
**Main Entry**: `frontend/app/(app)/page.tsx`

### Key Components:

1. **UI Framework**:
   - Next.js 15 with App Router
   - React 19 with TypeScript
   - Tailwind CSS for styling
   - Motion library for animations

2. **LiveKit Integration**:
   - `@livekit/components-react` for UI components
   - `livekit-client` for WebRTC communication
   - `livekit-server-sdk` for token generation

3. **Core Views**:
   - **Welcome View**: Initial screen with start button
   - **Session View**: Active call interface with video tiles and controls
   - **Chat Transcript**: Message history with fade effects

4. **Features**:
   - Voice interaction with agent
   - Video streaming (camera/screen share)
   - Text chat input
   - Audio visualization and controls
   - Theme switching (light/dark)
   - Configurable branding and UI text

### Connection Flow:

1. **Token Generation**: Frontend calls `/api/connection-details` to get LiveKit tokens
2. **Room Creation**: Unique room names generated for each session
3. **Agent Dispatch**: Optional agent name configuration for specific agent routing
4. **WebRTC Connection**: Frontend and backend join the same LiveKit room

## Data Flow

```
User Interaction → Frontend UI → LiveKit Room → Backend Agent → AI Pipeline → Response → User
     ↓              ↓              ↓              ↓              ↓              ↓
   Voice/Text    Token API     WebRTC         STT→LLM→TTS    Synthesis     Audio/Text
```

## Configuration & Customization

- **Frontend**: `app-config.ts` controls branding, features, and UI text
- **Backend**: Agent instructions and model configurations in `agent.ts`
- **Environment**: Separate `.env.local` files for frontend and backend credentials

## Development Setup

- **Frontend**: `pnpm dev` (port 3000)
- **Backend**: `pnpm run dev` (requires model downloads first)
- **Dependencies**: pnpm for package management in both parts

## Deployment

This is a production-ready starter that can be deployed to LiveKit Cloud or self-hosted environments, with comprehensive documentation and examples for extending functionality.