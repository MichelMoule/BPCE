
import React, { useState, useEffect, useRef } from 'react';
import { Message, Scenario, Sender } from '../types';
import { initializeSimulation, sendMessageToGemini, generateFeedback } from '../services/geminiService';
import { LiveSessionManager } from '../services/geminiLiveService';
import { playOpenAITTS } from '../services/openaiService';
import { Send, User, StopCircle, RefreshCw, Loader2, Phone, PhoneOff, Radio, Volume2, AlertTriangle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { IA_FA_AVATAR } from '../constants';

interface ChatSessionProps {
  scenario: Scenario;
  onExit: () => void;
}

export const ChatSession: React.FC<ChatSessionProps> = ({ scenario, onExit }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFeedbackMode, setIsFeedbackMode] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  
  // Audio / Live States
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [visualizerLevel, setVisualizerLevel] = useState(0);
  const liveSessionRef = useRef<LiveSessionManager | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Simulation on Mount (for text mode)
  useEffect(() => {
    const start = async () => {
      setIsLoading(true);
      try {
        await initializeSimulation(scenario.systemPrompt);
        // Send a clear instruction that triggers a client greeting/waiting message
        const initialText = await sendMessageToGemini("Le conseiller bancaire entre dans le bureau. Accueillez-le brièvement et attendez qu'il prenne la parole (maximum 1 phrase naturelle).");

        const initMsg = {
          id: 'init-1',
          text: initialText,
          sender: Sender.Bot,
          timestamp: new Date()
        };
        setMessages([initMsg]);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    start();
  }, [scenario]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, feedback]);

  // --- LIVE MODE HANDLERS ---
  const toggleLiveMode = async () => {
    if (isLiveMode) {
      // STOP LIVE
      liveSessionRef.current?.disconnect();
      setIsLiveMode(false);
      setVisualizerLevel(0);
    } else {
      // START LIVE
      setIsLiveMode(true);
      
      liveSessionRef.current = new LiveSessionManager({
        onAudioData: (level) => {
          setVisualizerLevel(level);
        },
        onTranscript: (text, isUser) => {
          // Push transcript to main message history so feedback works
          if (text && text.trim()) {
              console.log(`Transcript received - ${isUser ? 'User' : 'Bot'}: ${text}`);
              setMessages(prev => [...prev, {
                id: `${Date.now()}-${Math.random()}`,
                text: text,
                sender: isUser ? Sender.User : Sender.Bot,
                timestamp: new Date()
              }]);
          }
        },
        onClose: () => {
          setIsLiveMode(false);
        }
      });

      try {
        // Use exact system prompt to ensure script adherence (Julie)
        // We append a minimal instruction to ensure it knows audio is active, without overriding the script.
        const voicePrompt = `${scenario.systemPrompt} 
        
        [NOTE TECHNIQUE: Conversation Audio Active]`;
        
        await liveSessionRef.current.connect(voicePrompt);
      } catch (e) {
        console.error("Connection failed", e);
        setIsLiveMode(false);
        alert("Impossible de connecter l'agent vocal. Vérifiez votre micro.");
      }
    }
  };

  // --- TEXT MODE HANDLERS ---
  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || isLoading || isFeedbackMode) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: Sender.User,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const responseText = await sendMessageToGemini(inputText);
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        sender: Sender.Bot,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndSimulation = async () => {
    const wasLiveMode = isLiveMode;

    if (isLiveMode) {
        liveSessionRef.current?.disconnect();
        setIsLiveMode(false);
    }

    // For live mode, always show feedback (even if no text transcripts)
    // For text mode, only show if there are messages
    if (messages.length < 2 && !wasLiveMode) {
      onExit();
      return;
    }

    setIsFeedbackMode(true);
    setIsLoading(true);
    try {
      if (wasLiveMode && messages.length < 2) {
        // Voice-only session without transcripts
        const voiceFeedback = `## 📊 Synthèse Globale
Session vocale terminée avec ${scenario.title}.

## 🎤 Mode Vocal
Vous avez utilisé le mode vocal pour cette simulation. L'analyse détaillée n'est pas disponible car les transcriptions ne sont actuellement pas enregistrées pour des raisons de stabilité de connexion.

## 💡 Conseils Généraux pour la Double Relation
- **Écoute active** : Reformulez les besoins du client pour montrer votre compréhension
- **Détection des besoins** : Identifiez les besoins personnels derrière les demandes professionnelles
- **Argumentation** : Utilisez des arguments concrets liés à la situation du client
- **Flexibilité** : Mettez en avant la disponibilité et la souplesse des solutions

## 🏆 Note : -/5
_(Analyse complète disponible en mode texte)_

💡 **Astuce** : Utilisez le mode texte pour obtenir un rapport détaillé avec notation basée sur votre conversation réelle.`;
        setFeedback(voiceFeedback);
      } else if (messages.length < 2) {
        // Session too short
        const shortFeedback = `## 📊 Synthèse Globale
Session trop courte pour générer un rapport d'analyse.

## 💡 Conseil
Poursuivez la conversation plus longtemps pour obtenir un rapport détaillé de votre performance.`;
        setFeedback(shortFeedback);
      } else {
        // Generate full feedback from text conversation
        const analysis = await generateFeedback(messages);
        setFeedback(analysis);
      }
    } catch (error) {
      console.error("Feedback generation error:", error);
      setFeedback("Erreur d'analyse. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  // Play audio using OpenAI Cole
  const handlePlayAudio = (text: string) => {
    playOpenAITTS(text, scenario.voiceId);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-50 relative">
      {/* Top Bar */}
      <div className="bg-white px-6 py-4 border-b border-gray-200 flex justify-between items-center shadow-sm z-10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200">
            <img src={scenario.avatarUrl} alt={scenario.title} className="w-full h-full object-cover" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{scenario.title}</h3>
            <p className="text-xs text-gray-500">{scenario.profession} - {scenario.difficulty}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
           {!isLiveMode && !isFeedbackMode && (
             <button 
               onClick={toggleLiveMode}
               className="flex items-center gap-2 px-3 py-2 bg-bpce-purple/10 text-bpce-purple rounded-full hover:bg-bpce-purple/20 transition-colors text-sm font-semibold mr-2 border border-bpce-purple/30"
               title="Passer en mode vocal Live"
             >
               <Phone size={18} />
               <span className="hidden sm:inline">Mode Vocal</span>
             </button>
           )}

          {!isFeedbackMode ? (
            <button 
              onClick={handleEndSimulation}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium border border-red-200"
            >
              <StopCircle size={16} />
              Terminer
            </button>
          ) : (
            <button 
              onClick={onExit}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              <RefreshCw size={16} />
              Quitter
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative flex flex-col">
        
        {/* LIVE MODE OVERLAY */}
        {isLiveMode && (
           <div className="absolute inset-0 z-10 bg-gradient-to-br from-gray-900 via-bpce-purple to-gray-900 flex flex-col items-center justify-center text-white">
              <div className="absolute top-8 right-8">
                 <button onClick={toggleLiveMode} className="p-3 bg-red-500 rounded-full hover:bg-red-600 shadow-lg text-white">
                    <PhoneOff size={24} />
                 </button>
              </div>

              <div className="relative mb-12">
                 {/* Pulsing Rings */}
                 <div className="absolute inset-0 rounded-full bg-white opacity-20 animate-ping" style={{ animationDuration: '2s' }}></div>
                 <div className="absolute inset-[-20px] rounded-full bg-white opacity-10 animate-pulse" style={{ animationDuration: '1.5s' }}></div>
                 
                 <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/50 shadow-2xl relative z-10">
                   <img src={scenario.avatarUrl} alt="Client" className="w-full h-full object-cover" />
                 </div>
                 <div className="absolute bottom-0 right-0 bg-green-500 w-8 h-8 rounded-full border-4 border-gray-900 flex items-center justify-center z-20">
                    <Radio size={14} className="text-white" />
                 </div>
              </div>

              <h2 className="text-2xl font-bold mb-2">{scenario.title}</h2>
              <p className="text-white/60 mb-8 font-pixel text-xs uppercase tracking-widest">En ligne...</p>

              {/* Visualizer */}
              <div className="flex items-center justify-center gap-1 h-12">
                 {[...Array(5)].map((_, i) => (
                    <div 
                      key={i} 
                      className="w-3 bg-white rounded-full transition-all duration-75"
                      style={{ 
                        height: `${Math.max(10, Math.min(100, visualizerLevel * 100 * (Math.random() + 0.5)))}%`,
                        opacity: 0.8 
                      }}
                    ></div>
                 ))}
              </div>
              
              <p className="mt-8 text-sm text-white/50 animate-pulse">Parlez naturellement, je vous écoute.</p>
              
              <div className="absolute bottom-6 flex items-center gap-2 px-4 py-2 bg-black/30 rounded-lg text-xs text-white/70">
                 <AlertTriangle size={12} />
                 <span>Rapport simplifié disponible après la session vocale.</span>
              </div>
           </div>
        )}

        {/* STANDARD CHAT LIST */}
        <div className={`flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 ${isFeedbackMode ? 'opacity-30 pointer-events-none' : ''} ${isLiveMode ? 'hidden' : ''}`}>
           {messages.length === 0 && isLoading && (
             <div className="flex justify-center items-center h-full">
               <Loader2 className="w-8 h-8 text-bpce-purple animate-spin" />
               <span className="ml-2 text-gray-500">Le client arrive...</span>
             </div>
           )}
           
           {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === Sender.User ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex max-w-[80%] gap-3 ${msg.sender === Sender.User ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center border ${msg.sender === Sender.User ? 'bg-bpce-purple border-bpce-purple' : 'bg-white border-gray-200'}`}>
                  {msg.sender === Sender.User ? (
                     <User className="w-4 h-4 text-white" />
                  ) : (
                     <img src={scenario.avatarUrl} alt="Client" className="w-full h-full rounded-full object-cover" />
                  )}
                </div>
                
                <div className={`relative p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${
                  msg.sender === Sender.User 
                    ? 'bg-bpce-purple text-white rounded-tr-none' 
                    : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none group'
                }`}>
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                  
                  {/* Speaker Button for Bot messages */}
                  {msg.sender === Sender.Bot && (
                    <button 
                      onClick={() => handlePlayAudio(msg.text)}
                      className="absolute -right-8 top-2 p-1.5 text-gray-300 hover:text-bpce-purple rounded-full hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100"
                      title="Écouter (Voix OpenAI Cole)"
                    >
                      <Volume2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* FEEDBACK OVERLAY */}
        {isFeedbackMode && (
          <div className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-gray-900/10 backdrop-blur-sm overflow-y-auto">
             <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden border-2 border-bpce-purple animate-in fade-in zoom-in duration-300 my-auto flex flex-col max-h-[90vh]">
                <div className="bg-bpce-purple px-6 py-6 flex items-center gap-4 shrink-0">
                   <div className="bg-white p-1 rounded-full shadow-lg">
                     <img src={IA_FA_AVATAR} alt="Ia.FA" className="w-14 h-14 rounded-full" />
                   </div>
                   <div>
                     <h3 className="text-white font-pixel text-xl tracking-wide">RAPPORT DE MISSION</h3>
                     <p className="text-bpce-light text-sm opacity-90">Analyse détaillée de votre performance</p>
                   </div>
                </div>
                
                <div className="p-8 overflow-y-auto flex-1 bg-gray-50 text-gray-800">
                   {isLoading ? (
                     <div className="flex flex-col items-center justify-center py-12 space-y-4">
                       <Loader2 className="w-12 h-12 text-bpce-purple animate-spin" />
                       <p className="text-gray-500 font-medium animate-pulse">Ia.FA analyse vos données...</p>
                     </div>
                   ) : (
                     <div className="prose prose-purple max-w-none prose-headings:font-bold prose-headings:text-bpce-purple prose-p:text-gray-800 prose-li:text-gray-800 prose-strong:text-gray-900">
                        <ReactMarkdown>{feedback || ''}</ReactMarkdown>
                     </div>
                   )}
                </div>

                <div className="bg-white px-6 py-4 border-t border-gray-200 flex justify-between items-center shrink-0">
                   <p className="text-xs text-gray-400 italic">Ce rapport est généré par IA.</p>
                   <button 
                     onClick={onExit}
                     className="px-6 py-2 bg-bpce-purple text-white rounded-lg hover:bg-bpce-dark transition-colors font-medium shadow-md hover:shadow-lg transform active:scale-95 duration-200"
                   >
                     Retour à l'accueil
                   </button>
                </div>
             </div>
          </div>
        )}
      </div>

      {/* INPUT AREA (Only visible in Text Mode) */}
      {!isFeedbackMode && !isLiveMode && (
        <div className="bg-white p-4 border-t border-gray-200">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSendMessage} className="relative flex items-end gap-2 bg-gray-50 p-2 rounded-xl border border-gray-300 focus-within:ring-2 focus-within:ring-bpce-purple focus-within:border-transparent transition-all shadow-sm">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Écrivez votre réponse..."
                className="w-full bg-transparent border-none focus:ring-0 text-gray-900 placeholder-gray-500 resize-none max-h-32 py-3"
                rows={1}
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isLoading}
                className="p-3 rounded-lg bg-bpce-purple text-white hover:bg-bpce-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
