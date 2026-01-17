# Simple Chatbot Server

A comprehensive voice-enabled chatbot server built with Pipecat, providing real-time conversational AI through browser and mobile clients. This repository demonstrates two distinct approaches to voice AI implementation: traditional multi-service orchestration (OpenAI) and unified end-to-end voice processing (Gemini Live).

## Repository Overview

This server implements a Pipecat-based voice chatbot that enables natural language conversations through audio/video interfaces. It connects to Daily.co rooms for real-time communication and features an animated robot avatar that responds to user speech.

### Key Features
- **Real-time voice conversations** via Daily.co WebRTC
- **Two AI implementations**: OpenAI (modular services) and Gemini Live (unified multimodal)
- **Animated robot avatar** with state-based visual feedback
- **Modular pipeline architecture** using Pipecat framework
- **Cross-platform support** (browser, mobile)
- **Docker deployment** ready

## Architecture

The system follows Pipecat's frame-based pipeline architecture:

```
Transport Input → RTVI → User Aggregator → LLM Service → Animation → Transport Output → Assistant Aggregator
```

### Core Components
- **Transport Layer**: DailyTransport or SmallWebRTCTransport for audio/video streaming
- **Voice Activity Detection**: Silero VAD for speech detection
- **Turn Management**: LocalSmartTurnAnalyzerV3 for conversation flow control
- **Animation System**: TalkingAnimation processor with 25-frame robot sprites
- **Context Management**: LLMContext with message history and tool support

## Bot Implementations

### OpenAI Bot (`bot-openai.py`)

**Architecture**: Modular service composition requiring separate STT, LLM, and TTS components.

**Services Used**:
- **Speech-to-Text**: Deepgram STT service
- **Language Model**: OpenAI GPT-4o
- **Text-to-Speech**: ElevenLabs TTS (voice: "pNInz6obpgDQGcFmaJgB")

**Pipeline Flow**:
```
Transport → RTVI → STT → User Aggregator → LLM → TTS → Animation → Transport → Assistant Aggregator
```

**Requirements**:
- `OPENAI_API_KEY`
- `DEEPGRAM_API_KEY`
- `ELEVENLABS_API_KEY`
- `DAILY_API_KEY`

**Run Command**:
```bash
uv run bot-openai.py --transport daily
```

### Gemini Live Bot (`bot-gemini.py`)

**Architecture**: Unified end-to-end voice AI using Google's Gemini Live API.

**Services Used**:
- **Multimodal LLM**: GeminiLiveLLMService (handles STT + LLM + TTS natively)
- **Model**: `gemini-2.5-flash-native-audio-preview-12-2025`
- **Voice**: "Charon" (options: Aoede, Charon, Fenrir, Kore, Puck)

**Pipeline Flow**:
```
Transport → RTVI → User Aggregator → Gemini Live → Animation → Transport → Assistant Aggregator
```

**Key Advantages**:
- **Single API Integration**: No orchestration of separate services
- **True End-to-End Voice**: Native audio input/output processing
- **Lower Latency**: Direct streaming without service handoffs
- **Multimodal Support**: Text, audio, and potentially video capabilities

**Requirements**:
- `GOOGLE_API_KEY`
- `DAILY_API_KEY`

**Run Command**:
```bash
uv run bot-gemini.py --transport daily
```

## End-to-End Voice Implementation (Gemini Focus)

### Gemini Live API Integration

The `GeminiLiveLLMService` provides comprehensive voice AI capabilities through a single service:

#### Voice Processing Flow
1. **Audio Input**: Raw PCM audio from transport layer
2. **Real-time STT**: Automatic speech-to-text within Gemini Live
3. **LLM Processing**: Contextual conversation with system instructions
4. **Streaming TTS**: Real-time audio synthesis with selected voice
5. **Audio Output**: Direct streaming to transport layer

#### Key Configuration (from `InputParams`)
- **Modalities**: `GeminiModalities.AUDIO` (default) for voice responses
- **Language**: `Language.EN_US` for conversation language
- **Voice ID**: "Charon" for TTS voice selection
- **VAD Parameters**: Built-in voice activity detection controls
- **System Instructions**: Contextual prompts for bot behavior

#### Advanced Features
- **Tool Usage**: Function calling capabilities
- **Context Compression**: Automatic conversation history management
- **Thinking Mode**: Enhanced reasoning for complex queries
- **Affective Dialog**: Emotional intelligence in responses
- **Proactivity**: Smart response timing and interruption handling

### Comparison: OpenAI vs Gemini Voice Implementation

| Aspect | OpenAI Bot | Gemini Live Bot |
|--------|------------|-----------------|
| **STT Service** | Deepgram (separate) | Gemini Live (native) |
| **LLM Service** | GPT-4o (separate) | Gemini Live (native) |
| **TTS Service** | ElevenLabs (separate) | Gemini Live (native) |
| **API Keys Needed** | 4 (Daily, OpenAI, Deepgram, ElevenLabs) | 2 (Daily, Google) |
| **Latency** | Higher (service orchestration) | Lower (unified processing) |
| **Setup Complexity** | Higher (multiple services) | Lower (single service) |
| **Audio Quality** | Configurable per service | Gemini-controlled |
| **Multimodal Support** | Limited | Full (text, audio, video) |

## Setup and Configuration

### 1. Environment Setup

Create environment file:
```bash
cp env.example .env
```

Configure API keys in `.env`:
```ini
# Core Requirements
DAILY_API_KEY=your_daily_api_key_here
GOOGLE_API_KEY=your_google_api_key_here  # For Gemini bot

# Additional for OpenAI bot
OPENAI_API_KEY=your_openai_api_key_here
DEEPGRAM_API_KEY=your_deepgram_api_key_here
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

# Optional
DAILY_API_URL=https://api.daily.co/v1
DAILY_SAMPLE_ROOM_URL=your_fixed_room_url
```

### 2. Dependencies Installation

```bash
cd server
uv sync
```

### 3. Running the Bots

**Gemini Bot (Recommended)**:
```bash
uv run bot-gemini.py --transport daily
```

**OpenAI Bot**:
```bash
uv run bot-openai.py --transport daily
```

**WebRTC Mode** (for development):
```bash
uv run bot-gemini.py --transport webrtc
```

## Pipeline Components Deep Dive

### Transport Layer
- **DailyTransport**: Production WebRTC via Daily.co rooms
- **SmallWebRTCTransport**: Development direct WebRTC connections
- Configures audio/video codecs, resolution, and VAD parameters

### Voice Activity Detection (VAD)
```python
vad_analyzer=SileroVADAnalyzer(params=VADParams(stop_secs=0.2))
```
- Detects speech start/end for turn management
- Prevents false starts and manages conversation flow

### Turn Management
```python
user_turn_strategies=UserTurnStrategies(
    stop=[TurnAnalyzerUserTurnStopStrategy(turn_analyzer=LocalSmartTurnAnalyzerV3())]
)
```
- Smart turn detection using local ML models
- Handles interruptions and natural conversation pacing

### Animation System

#### TalkingAnimation Processor (`bot-gemini.py:85-116`)
Manages visual state transitions based on `BotStartedSpeakingFrame` and `BotStoppedSpeakingFrame`:

- **Quiet State**: Static frame (robot01.png) when listening
- **Talking State**: Animated sequence (robot01.png through robot25.png) when speaking

#### Sprite Loading (`bot-gemini.py:64-78`)
Loads 25 sequential robot animation frames and creates smooth loop by reversing sequence.

### Context Management
- **LLMContext**: Message history and system instructions
- **LLMContextAggregatorPair**: User/assistant context aggregation
- Automatic conversation state management

### RTVI Integration
Real-Time Voice Interface events for client synchronization and control.

## Animation System Details

### Asset Structure
- 25 PNG frames: `robot01.png` through `robot25.png`
- Stored in `/assets/` directory
- Each frame: 1024x576 resolution

### Animation Logic
1. Load all frames into `OutputImageRawFrame` objects
2. Create forward + reversed sequence for smooth looping
3. Switch between static (`quiet_frame`) and animated (`talking_frame`) states
4. Frame switching triggered by speaking status events

### Performance Considerations
- Frames loaded at startup to avoid I/O during conversation
- Efficient sprite animation using pre-computed sequences
- Minimal processing overhead during state transitions

## Deployment

### Docker Deployment

1. **Build Image** (update Dockerfile for desired bot):
   ```dockerfile
   # For Gemini bot
   COPY ./bot-gemini.py bot.py
   # For OpenAI bot
   # COPY ./bot-openai.py bot.py
   ```

2. **Build and Push**:
   ```bash
   docker build -t your_dockerhub_username/simple-chatbot:0.1 .
   docker push your_dockerhub_username/simple-chatbot:0.1
   ```

### Pipecat Cloud Deployment

Update `pcc-deploy.toml`:
```toml
agent_name = "simple-chatbot"
image = "your_dockerhub_username/simple-chatbot:0.1"
secret_set = "simple-chatbot-secrets"
agent_profile = "agent-1x"

[scaling]
min_agents = 1
```

Deploy via Pipecat Cloud CLI.

## API Reference

### GeminiLiveLLMService Key Methods

- `set_audio_input_paused(paused: bool)`: Control audio input streaming
- `set_video_input_paused(paused: bool)`: Control video input streaming
- `set_model_modalities(modalities: GeminiModalities)`: Switch between TEXT/AUDIO responses
- `set_language(language: Language)`: Change conversation language
- `set_context(context: OpenAILLMContext)`: Initialize conversation history

### Configuration Classes

- `InputParams`: Generation parameters (temperature, max_tokens, modalities, etc.)
- `GeminiVADParams`: Voice activity detection settings
- `ContextWindowCompressionParams`: Memory management for long conversations

## Troubleshooting

### SSL Certificate Issues
**Error**: `ClientConnectorCertificateError: certificate verify failed`

**Solution**: Install system SSL certificates
- **macOS**: `/Applications/Python 3.12/Install Certificates.command`
- **Linux**: Update `ca-certificates` package
- **Windows**: Usually handled by Python installer

### API Key Issues
- Verify API keys in `.env` file
- Check API key permissions and quotas
- For Gemini: Ensure Google AI API is enabled in Google Cloud Console

### Audio/Video Issues
- Check transport configuration (audio_in_enabled, video_out_enabled)
- Verify Daily.co room permissions
- Test with WebRTC mode for debugging

### Performance Issues
- Monitor pipeline metrics (enable_metrics=True)
- Check VAD sensitivity settings
- Optimize animation frame loading

### Gemini-Specific Issues
- Verify model name: `gemini-2.5-flash-native-audio-preview-12-2025`
- Check voice ID validity
- Ensure modalities set to AUDIO for voice responses
- Test with lower VAD sensitivity if false activations occur

## Development Notes

### Code Structure
- `bot-gemini.py`: Main Gemini Live implementation
- `bot-openai.py`: OpenAI modular implementation
- `assets/`: Animation frames
- `pyproject.toml`: Dependencies (Pipecat with extras)
- `Dockerfile`: Containerization
- `pcc-deploy.toml`: Cloud deployment config

### Extending the System
- Add new voices by modifying `voice_id` parameter
- Implement custom animation logic in `TalkingAnimation` class
- Add tools/functions via `tools` parameter in GeminiLiveLLMService
- Customize system instructions for different personalities

### Testing
- Use WebRTC transport for local testing without Daily.co
- Monitor RTVI events for debugging conversation flow
- Enable metrics to track performance and usage

---

**Built with**: Pipecat AI Framework  
**Voice AI**: Google Gemini Live API  
**Real-time Transport**: Daily.co WebRTC  
**Language**: Python 3.10+  
**Package Manager**: uv
