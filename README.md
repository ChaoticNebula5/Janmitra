# Janmitra - Voice Companion for Rural India

<div align="center">
  <img 
    src="https://github.com/user-attachments/assets/89aa5832-8fbf-48c1-b145-efc4db6d70fa"
    width="600"
    height="879"
    alt="Janmitra – Voice Companion for Rural India"
  />
</div>

[![LiveKit](https://img.shields.io/badge/Powered%20by-LiveKit-002CF2)](https://livekit.io)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Toll-free voice companion that makes every rural citizen financially smart & infra-connected

Janmitra is a dialect-aware voice AI that connects rural Indian citizens to government services, bridging the information gap that affects 330 million people.

## The Problem

Rural India faces a critical information asymmetry crisis:
- **68%** of rural adults cannot name one government credit scheme ([RBI 2024](https://rbi.org.in))
- **<9%** use internet in their local language ([IAMAI 2023](https://iamai.in))
- Average **3.2 physical visits** & **₹260 spent** per failed loan application
- **27 days** average delay in complaint redressal

Middlemen exploit this gap, language barriers isolate citizens, and outdated IVR systems fail to serve local dialects.

## The Solution

Janmitra is a **missed-call away, dialect-aware voice bot** that:

- **Answers only in local tongues** (Hindi, Awadhi, Bundeli, Telugu, and more)
- **Pulls verified information** from government APIs and databases
- **Warm-transfers** callers to the exact officer when human escalation is needed
- **Works offline-capable** for areas with poor connectivity

## Technical Architecture

```
User Speech → LiveKit Frontend (React) → LiveKit Server → Sarvam AI Agent
                                      ↓                           ↓
                               WebRTC Connection          Dialect Detection
                                      ↓                           ↓
                               Search Tools → Government APIs   RAG System
                                      ↓                           ↓
                               Verified Information       Contextual Responses
```

### Core Components

- **Frontend**: Next.js React app with LiveKit Components for WebRTC voice interface
- **Backend**: LiveKit Agents Node.js server with Sarvam AI model
- **AI Pipeline**: End-to-end audio processing with automatic dialect detection
- **Tools**: Web search for government information, RAG for verified knowledge
- **Future**: Exotel telephony integration for toll-free access

### Key Features

- 🔊 **Automatic dialect detection** and response in local languages
- 📞 **Voice-first interface** optimized for low-literacy users
- 🔍 **Verified government data** from official sources
- 👥 **Officer directory** with direct contact information
- 📱 **Progressive enhancement** from web to telephony
- 🌐 **Offline-capable** responses for poor connectivity

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- LiveKit Cloud account ([sign up](https://cloud.livekit.io))
- Sarvam AI API Key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd janmitra
   ```

2. **Install dependencies**
   ```bash
   # Frontend
   cd frontend && pnpm install

   # Backend
   cd ../backend && pnpm install
   ```

3. **Set up environment variables**

   **Frontend (.env.local)**
   ```env
   LIVEKIT_API_KEY=your_livekit_api_key
   LIVEKIT_API_SECRET=your_livekit_api_secret
   LIVEKIT_URL=https://your-livekit-server-url
   ```

   **Backend (.env.local)**
   ```env
   LIVEKIT_URL=https://your-livekit-server-url
   LIVEKIT_API_KEY=your_livekit_api_key
   LIVEKIT_API_SECRET=your_livekit_api_secret
   SARVAM_AI_API_KEY=your_sarvam_ai__api_key
   ```

4. **Download AI models** (backend)
   ```bash
   cd backend
   pnpm run download-files
   ```

5. **Start the services**
   ```bash
   # Terminal 1: Backend
   cd backend && pnpm run dev

   # Terminal 2: Frontend
   cd frontend && pnpm dev
   ```

6. **Open your browser**
   Visit [http://localhost:3000](http://localhost:3000)

## Development

### Project Structure

```
janmitra/
├── frontend/                # Next.js React app
│   ├── app/                 # Next.js app router
│   ├── components/          # React components
│   └── lib/                 # Utilities
├── backend/                 # LiveKit Agents server
│   ├── src/                 # TypeScript source
│   └── dist/                # Compiled output
└── docs/                    # Documentation
```

### Available Scripts

**Frontend:**
- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm lint` - Run ESLint
- `pnpm format` - Format code with Prettier

**Backend:**
- `pnpm run dev` - Start development server
- `pnpm run build` - Build TypeScript
- `pnpm run typecheck` - Type checking
- `pnpm run lint` - Run ESLint
- `pnpm test` - Run tests

### Code Style

- **TypeScript** for type safety
- **ESLint + Prettier** for code formatting
- **Prettier plugin** for import sorting
- Follow existing patterns in the codebase

## Demo Scenarios

Janmitra should handle these conversations naturally:

**PM Kisan Scheme Query:**
```
User: "मेरे खेत में कितने एकड़ हैं, क्या मुझे पीएम किसान योजना का पैसा मिलेगा?"
Agent: "हाँ, अगर आपके पास 2 हेक्टेयर तक जमीन है तो आप PM Kisan योजना के लिए योग्य हैं..."
```

**Loan Eligibility:**
```
User: "मैं ST/SC category का हूँ, कौन सी government loan schemes हैं?"
Agent: "आपके लिए विशेष schemes हैं जैसे PM SVANidhi, Stand-Up India..."
```

**Officer Transfer:**
```
User: "मेरी pension नहीं मिली, किससे contact करूँ?"
Agent: "आपके district का pension officer का number है +91-XXXXXXXXXX..."
```

## Deployment

### LiveKit Cloud

1. **Deploy backend to LiveKit Cloud**
   ```bash
   lk app deploy
   ```

2. **Update frontend environment** with production URLs

3. **Configure domain** and SSL certificates

### Docker Deployment

```bash
# Build backend image
cd backend && docker build -t janmitra-backend .

# Run with environment variables
docker run -p 3001:3001 \
  -e LIVEKIT_URL=$LIVEKIT_URL \
  -e GOOGLE_AI_API_KEY=$GOOGLE_AI_API_KEY \
  janmitra-backend
```

## Future Roadmap

- **Phase 1**: Exotel telephony integration for toll-free access
- **Phase 2**: Direct government API integration
- **Phase 3**: Officer directory with real-time availability
- **Phase 4**: Multi-modal support (SMS, WhatsApp)
- **Phase 5**: Offline PWA capabilities

## Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Development Guidelines

- Follow the existing code style
- Add tests for new features
- Update documentation
- Ensure all tests pass

## License

- **Code**: MIT License
- **Content**: CC-BY-4.0 License

## Acknowledgments

Built with [LiveKit Agents](https://livekit.io/agents) and powered by [Sarvam AI](https://www.sarvam.ai/). Inspired by the need to bridge India's rural-urban digital divide.

---

**Contact**: For questions or partnerships, reach out to the development team.
