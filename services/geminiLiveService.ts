
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { float32ToInt16, arrayBufferToBase64, base64ToUint8Array, pcmToAudioBuffer } from "../utils/audioUtils";

export interface LiveSessionCallbacks {
  onAudioData: (visualizerLevel: number) => void;
  onTranscript: (text: string, isUser: boolean) => void;
  onClose: () => void;
}

export class LiveSessionManager {
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private nextStartTime = 0;
  private session: any = null;
  private callbacks: LiveSessionCallbacks;
  private isConnected = false;
  
  // Accumulate text for the current turn
  private currentInputTranscription = "";
  private currentOutputTranscription = "";

  constructor(callbacks: LiveSessionCallbacks) {
    this.callbacks = callbacks;
  }

  async connect(systemInstruction: string) {
    if (this.isConnected) return;

    // Check for API Key explicitly
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.error("API_KEY is missing in process.env");
      alert("Erreur: Clé API Google manquante. Le mode vocal ne peut pas démarrer.");
      this.callbacks.onClose();
      return;
    }

    try {
        // Initialize AI client here to ensure we get the latest API_KEY
        const ai = new GoogleGenAI({ apiKey: apiKey });
    
        this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        
        // Setup Microphone
        this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Connect to Gemini Live
        // Note: Transcriptions may cause connection issues with some API versions
        const sessionPromise = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-09-2025',
          config: {
            responseModalities: [Modality.AUDIO],
            systemInstruction: systemInstruction,
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
            },
          },
          callbacks: {
            onopen: () => {
              console.log("Gemini Live Connected");
              this.isConnected = true;
              this.startAudioInputStream(sessionPromise);
            },
            onmessage: (message: LiveServerMessage) => {
              this.handleServerMessage(message);
            },
            onclose: () => {
              console.log("Gemini Live Closed");
              this.disconnect();
            },
            onerror: (error) => {
              console.error("Gemini Live WebSocket Error:", error);
            }
          }
        });
    
        this.session = sessionPromise;
    } catch (error) {
        console.error("Failed to establish Gemini Live connection:", error);
        alert("Erreur de connexion au service vocal (Network Error). Vérifiez votre connexion internet ou la clé API.");
        this.disconnect();
    }
  }

  private startAudioInputStream(sessionPromise: Promise<any>) {
    if (!this.inputAudioContext || !this.mediaStream) return;

    try {
        this.source = this.inputAudioContext.createMediaStreamSource(this.mediaStream);
        this.processor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);
    
        this.processor.onaudioprocess = (e) => {
          if (!this.isConnected) return; // Stop processing if disconnected
          
          const inputData = e.inputBuffer.getChannelData(0);
          
          // Calculate volume level for visualizer
          let sum = 0;
          for (let i = 0; i < inputData.length; i++) {
            sum += inputData[i] * inputData[i];
          }
          const rms = Math.sqrt(sum / inputData.length);
          this.callbacks.onAudioData(rms * 5); // Scale up a bit
    
          // Send to API
          const pcmData = float32ToInt16(inputData);
          const base64Data = arrayBufferToBase64(pcmData.buffer);
          
          sessionPromise.then(session => {
            session.sendRealtimeInput({
              media: {
                mimeType: "audio/pcm;rate=16000",
                data: base64Data
              }
            });
          }).catch(err => {
              console.error("Error sending audio frame:", err);
          });
        };
    
        this.source.connect(this.processor);
        this.processor.connect(this.inputAudioContext.destination);
    } catch (e) {
        console.error("Error starting audio input stream:", e);
    }
  }

  private async handleServerMessage(message: LiveServerMessage) {
    const content = message.serverContent;
    if (!content) return;

    // 1. Handle Audio Output (Play sound)
    const audioData = content.modelTurn?.parts?.[0]?.inlineData?.data;
    if (audioData && this.outputAudioContext) {
      const pcmBytes = base64ToUint8Array(audioData);
      const audioBuffer = pcmToAudioBuffer(pcmBytes, this.outputAudioContext);

      // Calculate visualizer level for output
      const raw = audioBuffer.getChannelData(0);
      let sum = 0;
      for(let i=0; i<raw.length; i+=10) sum += Math.abs(raw[i]);
      this.callbacks.onAudioData((sum / (raw.length/10)) * 5);

      this.playAudioBuffer(audioBuffer);
    }

    // Note: Transcriptions removed to ensure stable connection
    // If transcriptions are needed in the future, they can be re-enabled
    // by adding inputAudioTranscription and outputAudioTranscription to the config
  }

  private playAudioBuffer(buffer: AudioBuffer) {
    if (!this.outputAudioContext) return;

    const source = this.outputAudioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.outputAudioContext.destination);

    const currentTime = this.outputAudioContext.currentTime;
    // Schedule just after previous chunk
    if (this.nextStartTime < currentTime) {
      this.nextStartTime = currentTime;
    }
    
    source.start(this.nextStartTime);
    this.nextStartTime += buffer.duration;
  }

  disconnect() {
    this.isConnected = false;
    
    if (this.source) {
      try { this.source.disconnect(); } catch(e) {}
      this.source = null;
    }
    if (this.processor) {
        try { this.processor.disconnect(); } catch(e) {}
        this.processor = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    if (this.inputAudioContext) {
      this.inputAudioContext.close();
      this.inputAudioContext = null;
    }
    if (this.outputAudioContext) {
      this.outputAudioContext.close();
      this.outputAudioContext = null;
    }
    
    this.callbacks.onClose();
  }
}
