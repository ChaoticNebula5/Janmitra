# Janmitra Bot

A voice-enabled chatbot server built with Pipecat, providing real-time conversational AI through browser and mobile clients using Google's Gemini Live API for unified end-to-end voice processing.

## Repository Overview

This server implements a Pipecat-based voice chatbot that enables natural language conversations through audio/video interfaces. It connects to Daily.co rooms for real-time communication and features an animated robot avatar that responds to user speech.

### Key Features
- **Real-time voice conversations** via Daily.co WebRTC
- **Unified AI implementation**: Gemini Live (end-to-end multimodal)
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

## Bot Implementation

### Janmitra Bot (`janmitra_bot.py`)

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
uv run janmitra_bot.py --transport daily
```

## End-to-End Voice Implementation

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
GOOGLE_API_KEY=your_google_api_key_here

# Optional
DAILY_API_URL=https://api.daily.co/v1
DAILY_SAMPLE_ROOM_URL=your_fixed_room_url
```

### 2. Dependencies Installation

```bash
uv sync
```

### 3. Running the Bot

**Janmitra Bot**:
```bash
uv run janmitra_bot.py --transport daily
```

**WebRTC Mode** (for development):
```bash
uv run janmitra_bot.py --transport webrtc
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

#### TalkingAnimation Processor
Manages visual state transitions based on `BotStartedSpeakingFrame` and `BotStoppedSpeakingFrame`:

- **Quiet State**: Static frame when listening
- **Talking State**: Animated sequence when speaking

### Context Management
- **LLMContext**: Message history and system instructions
- **LLMContextAggregatorPair**: User/assistant context aggregation
- Automatic conversation state management

### RTVI Integration
Real-Time Voice Interface events for client synchronization and control.

## Deployment

### Docker Deployment

1. **Build Image**:
    ```dockerfile
    COPY ./janmitra_bot.py bot.py
    ```

2. **Build and Push**:
    ```bash
    docker build -t your_dockerhub_username/janmitra-bot:0.1 .
    docker push your_dockerhub_username/janmitra-bot:0.1
    ```

### Pipecat Cloud Deployment

Update `pcc-deploy.toml`:
```toml
agent_name = "janmitra-bot"
image = "your_dockerhub_username/janmitra-bot:0.1"
secret_set = "janmitra-bot-secrets"
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
- Ensure Google AI API is enabled in Google Cloud Console

### Audio/Video Issues
- Check transport configuration (audio_in_enabled, video_out_enabled)
- Verify Daily.co room permissions
- Test with WebRTC mode for debugging

### Performance Issues
- Monitor pipeline metrics (enable_metrics=True)
- Check VAD sensitivity settings

### Gemini-Specific Issues
- Verify model name: `gemini-2.5-flash-native-audio-preview-12-2025`
- Check voice ID validity
- Ensure modalities set to AUDIO for voice responses
- Test with lower VAD sensitivity if false activations occur

## Development Notes

### Code Structure
- `janmitra_bot.py`: Main Gemini Live implementation
- `pyproject.toml`: Dependencies (Pipecat with extras)
- `Dockerfile`: Containerization
- `pcc-deploy.toml`: Cloud deployment config

### Extending the System
- Add new voices by modifying `voice_id` parameter
- Implement custom animation logic
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
**Package Manager**: uv</content>
<parameter name="filePath">README.md