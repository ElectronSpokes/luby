import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Phone, 
  X, 
  Send, 
  Mic, 
  MicOff, 
  PhoneOff,
  Loader2,
  Volume2,
  VolumeX,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";
import { api } from '../lib/api';
import { ChatMessage } from '../types';
import { cn } from '../lib/utils';

interface AIAssistantProps {
  onClose: () => void;
  userStats: any;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ onClose, userStats }) => {
  const [mode, setMode] = useState<'chat' | 'call'>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [transcription, setTranscription] = useState('');
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sessionRef = useRef<any>(null);
  const audioQueueRef = useRef<Float32Array[]>([]);
  const isPlayingRef = useRef(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, transcription]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      role: 'user',
      content: inputText,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      const { apiKey } = await api.getLiveToken();
      const ai = new GoogleGenAI({ apiKey });
      const chat = ai.chats.create({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: `You are Luby, a cute and fluffy health mascot for the Vitality Wellness app. 
          You are supportive, encouraging, and knowledgeable about health.
          User stats today: ${JSON.stringify(userStats)}.
          Keep responses concise and friendly.`
        }
      });

      const response = await chat.sendMessage({ message: inputText });
      
      const assistantMsg: ChatMessage = {
        id: Math.random().toString(36).substr(2, 9),
        role: 'assistant',
        content: response.text || "I'm here to help!",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setIsTyping(false);
    }
  };

  const startCall = async () => {
    setIsCalling(true);
    setTranscription('Connecting to Luby...');
    
    try {
      const { apiKey } = await api.getLiveToken();
      const ai = new GoogleGenAI({ apiKey });
      
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      
      const sessionPromise = ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-09-2025",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } },
          },
          systemInstruction: "You are Luby, a cute and fluffy health mascot. You are talking to the user in real-time. Be encouraging and helpful.",
        },
        callbacks: {
          onopen: () => {
            setTranscription('Luby is listening...');
            startMic(sessionPromise);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.modelTurn?.parts[0]?.inlineData?.data) {
              const base64Audio = message.serverContent.modelTurn.parts[0].inlineData.data;
              playAudio(base64Audio);
            }
            if (message.serverContent?.interrupted) {
              audioQueueRef.current = [];
              isPlayingRef.current = false;
            }
          },
          onclose: () => endCall(),
          onerror: (err) => {
            console.error("Live API error:", err);
            endCall();
          }
        }
      });
      
      sessionRef.current = await sessionPromise;
    } catch (error) {
      console.error("Call error:", error);
      endCall();
    }
  };

  const startMic = async (sessionPromise: Promise<any>) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const source = audioContextRef.current!.createMediaStreamSource(stream);
      const processor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (isMuted) return;
        const inputData = e.inputBuffer.getChannelData(0);
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
        }
        const base64Data = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));
        
        sessionPromise.then(session => {
          session.sendRealtimeInput({
            media: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
          });
        });
      };

      source.connect(processor);
      processor.connect(audioContextRef.current!.destination);
    } catch (error) {
      console.error("Mic error:", error);
    }
  };

  const playAudio = (base64Data: string) => {
    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const pcmData = new Int16Array(bytes.buffer);
    const floatData = new Float32Array(pcmData.length);
    for (let i = 0; i < pcmData.length; i++) {
      floatData[i] = pcmData[i] / 0x7FFF;
    }
    
    audioQueueRef.current.push(floatData);
    if (!isPlayingRef.current) {
      processAudioQueue();
    }
  };

  const processAudioQueue = async () => {
    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      return;
    }

    isPlayingRef.current = true;
    const data = audioQueueRef.current.shift()!;
    const buffer = audioContextRef.current!.createBuffer(1, data.length, 16000);
    buffer.getChannelData(0).set(data);
    
    const source = audioContextRef.current!.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current!.destination);
    source.onended = () => processAudioQueue();
    source.start();
  };

  const endCall = () => {
    setIsCalling(false);
    setTranscription('');
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    if (sessionRef.current) {
      sessionRef.current.close();
    }
    audioQueueRef.current = [];
    isPlayingRef.current = false;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
    >
      <div className="bg-white w-full max-w-lg h-[80vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center overflow-hidden">
              <img 
                src="https://picsum.photos/seed/mascot/200/200" 
                alt="Luby" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h3 className="font-bold text-lg">Luby Assistant</h3>
              <p className="text-xs text-emerald-400 font-medium">
                {isCalling ? 'On a call...' : 'Always here for you'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setMode(mode === 'chat' ? 'call' : 'chat')}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors"
            >
              {mode === 'chat' ? <Phone className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
            </button>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col bg-slate-50">
          {mode === 'chat' ? (
            <>
              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 space-y-4"
              >
                {messages.length === 0 && (
                  <div className="text-center py-10 space-y-4">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                      <Sparkles className="w-10 h-10 text-emerald-600" />
                    </div>
                    <h4 className="font-bold text-slate-800">Hi! I'm Luby</h4>
                    <p className="text-sm text-slate-500 max-w-[200px] mx-auto">
                      Ask me anything about your health, recipes, or just say hi!
                    </p>
                  </div>
                )}
                {messages.map((msg) => (
                  <div 
                    key={msg.id}
                    className={cn(
                      "flex",
                      msg.role === 'user' ? "justify-end" : "justify-start"
                    )}
                  >
                    <div className={cn(
                      "max-w-[80%] p-4 rounded-2xl text-sm",
                      msg.role === 'user' 
                        ? "bg-emerald-600 text-white rounded-tr-none" 
                        : "bg-white text-slate-800 shadow-sm rounded-tl-none"
                    )}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white p-4 rounded-2xl shadow-sm rounded-tl-none flex gap-1">
                      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
                      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
                      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
                    </div>
                  </div>
                )}
              </div>
              <div className="p-6 bg-white border-t border-slate-100">
                <div className="flex gap-2">
                  <input 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                  <button 
                    onClick={handleSendMessage}
                    disabled={!inputText.trim() || isTyping}
                    className="p-4 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center space-y-10">
              <div className="relative">
                <motion.div 
                  animate={isCalling ? { 
                    scale: [1, 1.1, 1],
                    opacity: [0.5, 0.8, 0.5]
                  } : {}}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute inset-0 bg-emerald-500 rounded-full blur-2xl"
                />
                <div className="relative w-40 h-40 bg-white rounded-full shadow-xl flex items-center justify-center overflow-hidden border-4 border-emerald-500">
                  <img 
                    src="https://picsum.photos/seed/mascot/400/400" 
                    alt="Luby" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-slate-800">
                  {isCalling ? 'Luby is listening...' : 'Call Luby'}
                </h3>
                <p className="text-slate-500 text-sm max-w-xs mx-auto">
                  {isCalling 
                    ? transcription || 'Speak now, I\'m here to help!' 
                    : 'Talk to Luby in real-time for instant health advice and motivation.'}
                </p>
              </div>

              <div className="flex items-center gap-6">
                {isCalling ? (
                  <>
                    <button 
                      onClick={() => setIsMuted(!isMuted)}
                      className={cn(
                        "p-5 rounded-full transition-all shadow-lg",
                        isMuted ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-600"
                      )}
                    >
                      {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                    </button>
                    <button 
                      onClick={endCall}
                      className="p-6 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-all scale-110"
                    >
                      <PhoneOff className="w-8 h-8" />
                    </button>
                    <button 
                      className="p-5 bg-slate-100 text-slate-600 rounded-full shadow-lg"
                    >
                      <Volume2 className="w-6 h-6" />
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={startCall}
                    className="px-10 py-5 bg-emerald-600 text-white rounded-full font-bold shadow-lg hover:bg-emerald-700 transition-all flex items-center gap-3 scale-110"
                  >
                    <Phone className="w-6 h-6" /> Start Call
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
