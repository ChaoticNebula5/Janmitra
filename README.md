# Janmitra

**Web voice companion that helps rural Indians access government schemes, financial info, and local support — in their own dialect, over a web browser.**

A real-time voice AI bot accessible via web browser. Users open the web client, speak in local languages/dialects (Hindi, Awadhi, Bundeli, Telugu, etc.), and receive factual answers to questions about government schemes, loans, Aadhaar, grievances, and more. When needed, the bot can suggest contacting government officers.

## Core Features

- **Web Access**: Browser-based entry point for rural users with internet access
- **Multi-Dialect Support**: Speaks and understands in local languages/dialects (initially 1-2, expandable)
- **Factual Answers**: Always cites sources; answers from verified government data (PM-Kisan, RBI, DBT Bharat, CPGRAMS)
- **Warm Transfer**: Tool-triggered suggestions to contact officers for complex cases
- **Low-Cost Operation**: Optimized for WebRTC, Gemini API, and local hosting

## Target Users

- Rural citizens (300M+ in India) with low digital literacy but internet access
- Pain points: Middlemen exploitation, long queues, language barriers in existing systems

## Tech Stack

- **WebRTC**: SmallWebRTCTransport (peer-to-peer WebRTC for real-time bidirectional audio)
- **Framework**: Pipecat (orchestrates pipeline, handles audio frames, VAD, interruptions, tool execution)
- **LLM/Voice AI**: Google Gemini Live API (end-to-end speech-to-speech)
  - Model: `gemini-2.5-flash-native-audio-preview-12-2025` (or latest native-audio variant)
  - Config: AUDIO modality, chosen TTS voice, language/dialect tuned via system prompt
- **Tool Calling**: Hardcoded tools in Pipecat → passed to Gemini Live
  - RAG lookup (FAQs, schemes, PDFs)
  - API fetch (live data from government sources)
  - Directory search + transfer suggestion
- **Deployment**: Local server or web hosting running Pipecat server
  - Receives WebRTC connection → runs Pipecat pipeline → streams to/from Gemini Live

## Key Constraints & Guardrails

- **Dialect Enforcement**: Speaks only in local language/dialect (system prompt)
- **Factual Only**: No medical advice, astrology, politics; always cite sources verbally
- **Safety Blocks**: Off-topic intents filtered out
- **PII Redaction**: Logs scrubbed of personal data
- **Cost Optimization**: Minimal API calls, efficient prompts

## Current MVP Scope

- **Languages**: 1-2 dialects initially (e.g., Hindi + Bundeli)
- **Intents**: Scheme info, loan/pension status, Aadhaar help, grievance filing, directory lookup
- **Data Sources**: 200+ static FAQs + live API pulls
- **Transfer Logic**: Tool suggests contacting officer

## Architecture

```
Web Browser → WebRTC → Pipecat Pipeline → Gemini Live → Tool Execution (RAG/API/Transfer) → Response
```

### Components

- **SmallWebRTC Integration**: Peer-to-peer WebRTC for audio streaming
- **Pipecat Pipeline**: Handles VAD, turn detection, context aggregation, tool calls
- **Gemini Live Service**: Unified STT + LLM + TTS with tool support
- **Tools**:
  - RAG: Vector search on government docs/FAQs
  - APIs: Fetch live data (e.g., scheme eligibility)
  - Transfer: Lookup officer directory, suggest contact

## Setup and Deployment

### Prerequisites

- Python 3.10+
- Google Gemini API key

### 1. Environment Setup

Clone and configure:

```bash
git clone <repo-url>
cd janmitra
cp env.example .env
```

Edit `.env`:

```ini
GOOGLE_API_KEY=your_gemini_api_key
# Add other secrets as needed
```

### 2. Install Dependencies

```bash
uv sync
```

### 3. Run the Bot

```bash
uv run janmitra_bot.py --transport webrtc
```

The server starts SmallWebRTC and listens for WebRTC connections.

### 4. Open Web Client

Open `web_client.html` in a web browser to start voice chat.

### 5. Deployment

**Local**:

Run the bot locally and open the web client.

**Web Hosting**:

Deploy to a server, ensure WebRTC ports are open.

**Docker**:

```bash
docker build -t janmitra-bot .
docker run -p 8080:8080 --env-file .env janmitra-bot
```

## Development

### Adding Tools

Tools are registered in `janmitra_bot.py`. Example:

```python
tools = [
    {
        "name": "lookup_scheme",
        "description": "Search government schemes database",
        "parameters": {...}
    },
    {
        "name": "transfer_call",
        "description": "Transfer to officer",
        "parameters": {...}
    }
]
```

### Language/Dialect Tuning

Update system prompt in `janmitra_bot.py`:

```python
system_instruction = "You are a helpful assistant for rural Indians. Speak only in Hindi/Bundeli. Cite sources. If needed, use transfer tool."
```

### Testing

- Use local WebRTC client (web_client.html)
- Monitor logs for PII redaction

## Future Directions

- Expand to more languages/dialects
- Outbound reminders via WhatsApp
- Analytics dashboard for officials
- Visual WhatsApp companion

## Contributing

- Follow Pipecat best practices
- Ensure all responses are factual and sourced
- Test with web client

## License

[Add license if applicable]

---

Built for rural India with Pipecat and Google Gemini Live.</content>
<parameter name="filePath">/home/saury/Projects/Janmitra/yayitworks/README.md