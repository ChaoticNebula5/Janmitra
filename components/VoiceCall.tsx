'use client';

import React, { useRef, useState, useEffect } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, MicOff, PhoneOff, Signal, Wifi, Battery, Phone 
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/* -------------------------------------------------------------------------- */
/* Utility & Constants                                                        */
/* -------------------------------------------------------------------------- */
const MODEL_NAME = 'gemini-2.5-flash-native-audio-preview-12-2025';
const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const AudioUtils = {
  encode(bytes: Uint8Array) {
    return btoa(String.fromCharCode(...bytes));
  },
  decode(base64: string) {
    return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  },
  async decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number) {
    const pcm = new Int16Array(data.buffer);
    const buffer = ctx.createBuffer(1, pcm.length, sampleRate);
    const channel = buffer.getChannelData(0);
    for (let i = 0; i < pcm.length; i++) channel[i] = pcm[i] / 32768;
    return buffer;
  },
};

/* -------------------------------------------------------------------------- */
/* Main Component                                                             */
/* -------------------------------------------------------------------------- */
export default function VoiceCall() {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY!;

  // -- Logic States --
  const [active, setActive] = useState(false);
  const [muted, setMuted] = useState(false);
  const [status, setStatus] = useState<'IDLE' | 'LISTENING' | 'THINKING' | 'SPEAKING'>('IDLE');
  
  // -- UI States --
  const [callDuration, setCallDuration] = useState(0);

  // -- Refs --
  const sessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const inputCtx = useRef<AudioContext | null>(null);
  const outputCtx = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStart = useRef(0);
  const activeSources = useRef<Set<AudioBufferSourceNode>>(new Set());
  const mutedRef = useRef(false);

  // -- Timer Logic --
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (active) {
      interval = setInterval(() => setCallDuration((p) => p + 1), 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(interval);
  }, [active]);

  // -- Mute State Sync --
  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  /* ---------------------------- Logic: Stop ---------------------------- */
  const stop = () => {
    setActive(false);
    setMuted(false);
    setStatus('IDLE');

    sessionRef.current?.close();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    processorRef.current?.disconnect();

    activeSources.current.forEach((s) => s.stop());
    activeSources.current.clear();
    nextStart.current = 0;
  };

  /* ---------------------------- Logic: Start ---------------------------- */
  const start = async () => {
    if (!apiKey) {
      alert('Missing NEXT_PUBLIC_GEMINI_API_KEY');
      return;
    }

    const ai = new GoogleGenAI({ apiKey });

    inputCtx.current = new AudioContext({ sampleRate: INPUT_SAMPLE_RATE });
    outputCtx.current = new AudioContext({ sampleRate: OUTPUT_SAMPLE_RATE });

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;

    const session = await ai.live.connect({
      model: MODEL_NAME,
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
        },
        systemInstruction: "You are Janmitra, a helpful, polite, simple-language voice companion for rural Indians. Always respond in the user's detected language/dialect (Hindi, Awadhi, Bundeli, Telugu, Tamil, Odia, Bhojpuri, Haryanvi etc.).  Use easy words, speak slowly, explain schemes clearly.  Only give verified government info. If unsure, say you'll check or transfer to officer. Focus on: PM Kisan, loans for SC/ST, pensions, complaints, etc."
      },
      callbacks: {
        onopen: () => {
          setActive(true);
          setStatus('LISTENING');

          const source = inputCtx.current!.createMediaStreamSource(stream);
          const processor = inputCtx.current!.createScriptProcessor(4096, 1, 1);
          processorRef.current = processor;

          processor.onaudioprocess = (e) => {
            if (mutedRef.current) return;
            const input = e.inputBuffer.getChannelData(0);
            const pcm = new Int16Array(input.length);
            for (let i = 0; i < input.length; i++) {
              pcm[i] = input[i] * 32768;
            }
            session.sendRealtimeInput({
              media: {
                data: AudioUtils.encode(new Uint8Array(pcm.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              },
            });
          };

          source.connect(processor);
          processor.connect(inputCtx.current!.destination);
        },
        onmessage: async (msg: LiveServerMessage) => {
          const { serverContent } = msg;

          // 1. Thinking: Trigger when we receive input transcription (User is talking/server processing)
          if (serverContent?.inputTranscription) {
            setStatus('THINKING');
          }

          // 2. Speaking: Trigger when we receive AUDIO data (Reliable)
          // We check for inlineData instead of outputTranscription because responseModalities is AUDIO only.
          const audio = serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          
          if (audio) {
            setStatus('SPEAKING'); // <--- Fixed: Trigger SPEAKING on audio arrival
            
            if (outputCtx.current) {
              const ctx = outputCtx.current;
              nextStart.current = Math.max(nextStart.current, ctx.currentTime);
              const buffer = await AudioUtils.decodeAudioData(
                AudioUtils.decode(audio), ctx, OUTPUT_SAMPLE_RATE
              );
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(ctx.destination);
              source.start(nextStart.current);
              nextStart.current += buffer.duration;
              activeSources.current.add(source);
              source.onended = () => activeSources.current.delete(source);
            }
          }

          // 3. Listening: Trigger when the turn is officially complete
          if (serverContent?.turnComplete) {
            setStatus('LISTENING');
          }

          if (serverContent?.interrupted) {
            activeSources.current.forEach((s) => s.stop());
            activeSources.current.clear();
            nextStart.current = 0;
            setStatus('LISTENING'); // Reset status on interruption
          }
        },
        onclose: stop,
        onerror: stop,
      },
    });
    sessionRef.current = session;
  };

  /* ------------------------------------------------------------------ */
  /* UI RENDER                                                          */
  /* ------------------------------------------------------------------ */
  return (
    <div className="flex items-center justify-center p-8 min-h-screen bg-transparent">
      
      {/* Phone Chassis */}
      <div className="relative w-[320px] h-[650px] bg-black rounded-[55px] shadow-2xl border-[8px] border-[#333] ring-[2px] ring-gray-600 overflow-hidden select-none">
        
        {/* Buttons (Decorative) */}
        <div className="absolute top-28 -left-[10px] w-[2px] h-10 bg-gray-600 rounded-l-md" />
        <div className="absolute top-44 -left-[10px] w-[2px] h-10 bg-gray-600 rounded-l-md" />
        <div className="absolute top-36 -right-[10px] w-[2px] h-16 bg-gray-600 rounded-r-md" />

        {/* Screen */}
        <div className="relative w-full h-full bg-gray-950 flex flex-col overflow-hidden rounded-[45px]">
          
          {/* Status Bar */}
          <div className="absolute top-0 w-full h-14 z-50 flex justify-between items-start px-8 pt-4">
            <span className="text-xs font-bold text-white">9:41</span>
            <div className="flex gap-1.5 text-white">
              <Signal size={12} fill="currentColor" />
              <Wifi size={12} />
              <Battery size={12} fill="currentColor" />
            </div>
          </div>

          {/* Dynamic Island */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-8 bg-black rounded-full z-50 flex items-center justify-center pointer-events-none">
             <div className="w-16 h-4 bg-[#1a1a1a] rounded-full flex items-center justify-end px-1">
                <div className="w-2 h-2 rounded-full bg-[#0a0f1c] border border-[#222]" />
             </div>
          </div>

          {/* Screen Content */}
          <div className="flex-1 relative flex flex-col">
            <AnimatePresence mode="wait">
              
              {/* IDLE STATE */}
              {!active && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, filter: 'blur(10px)', scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0 flex flex-col items-center justify-between py-20 px-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-800 via-gray-950 to-black"
                >
                  <div className="flex flex-col items-center mt-12">
                     <h1 className="text-6xl font-thin text-white/80 tracking-tighter">09:41</h1>
                     <p className="text-white/50 font-medium mt-1">Ready to Help</p>
                  </div>

                  <button
                    onClick={start}
                    className="group relative w-full bg-white/10 backdrop-blur-lg border border-white/10 p-4 rounded-3xl flex items-center gap-4 hover:bg-white/20 transition-all active:scale-95 cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Phone size={24} className="text-black fill-current" />
                    </div>
                    <div className="text-left">
                      <p className="text-white font-bold">Janmitra AI</p>
                      <p className="text-green-400 text-xs">Tap to call</p>
                    </div>
                  </button>
                </motion.div>
              )}

              {/* ACTIVE CALL STATE */}
              {active && (
                <motion.div
                  key="active-call"
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="absolute inset-0 bg-[#0F1115] flex flex-col items-center pt-24 pb-12 px-6"
                >
                  
                  {/* Contact Info */}
                  <div className="flex flex-col items-center gap-4 mb-auto">
                    <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-cyan-900 to-blue-900 border-4 border-[#1a1a1a] flex items-center justify-center shadow-2xl relative">
                        {/* Speaking Ripple */}
                        {status === 'SPEAKING' && (
                          <div className="absolute inset-0 rounded-full border border-cyan-500/50 animate-ping" />
                        )}
                        <span className="text-4xl">🤖</span>
                    </div>
                    
                    <div className="text-center">
                      <h2 className="text-3xl font-bold text-white tracking-tight">Janmitra</h2>
                      <div className="flex flex-col items-center mt-2 h-10">
                        {status === 'SPEAKING' ? (
                          <div className="flex gap-1 items-center h-full">
                            <AudioBar />
                            <AudioBar />
                            <AudioBar />
                            <AudioBar />
                          </div>
                        ) : (
                          <p className="text-white/50 text-sm font-medium animate-pulse">
                            {status === 'LISTENING' ? 'Listening...' : 
                             status === 'THINKING' ? 'Thinking...' : formatTime(callDuration)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Controls Grid */}
                  <div className="w-full max-w-[280px] grid grid-cols-2 gap-4 gap-y-6">
                    
                    {/* Mute Button */}
                    <ControlBtn 
                      icon={muted ? <MicOff /> : <Mic />} 
                      label="Mute" 
                      active={muted}
                      onClick={() => setMuted(!muted)} 
                    />
                    
                    {/* END CALL */}
                    <button 
                      onClick={stop}
                      className="col-span-2 mt-4 bg-red-500 hover:bg-red-600 text-white rounded-full py-5 flex items-center justify-center shadow-lg active:scale-95 transition-all cursor-pointer"
                    >
                      <PhoneOff size={32} fill="currentColor" />
                    </button>
                  </div>

                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Home Indicator */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/20 rounded-full z-50" />
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Sub-components                                                             */
/* -------------------------------------------------------------------------- */

function ControlBtn({ icon, label, onClick, active }: { icon: React.ReactNode, label: string, onClick?: () => void, active?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <button 
        onClick={onClick}
        className={cn(
          "w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-all active:scale-90 cursor-pointer",
          active 
            ? "bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.4)]" 
            : "bg-white/10 text-white hover:bg-white/20 backdrop-blur-md"
        )}
      >
        {icon}
      </button>
      <span className="text-white/50 text-xs font-medium">{label}</span>
    </div>
  );
}

function AudioBar() {
  return (
    <motion.div
      className="w-1 bg-cyan-400 rounded-full"
      animate={{
        height: [10, 25, 10, 30, 15],
      }}
      transition={{
        duration: 0.5,
        repeat: Infinity,
        repeatType: "mirror",
        ease: "linear",
        delay: Math.random() * 0.5,
      }}
    />
  );
}