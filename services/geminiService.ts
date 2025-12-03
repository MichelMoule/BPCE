
import { GoogleGenAI, ChatSession } from "@google/genai";
import { Message, Sender } from "../types";
import { IA_FA_FEEDBACK_PROMPT } from "../constants";

// We store the session but ensure we can recreate it if needed
let chatSession: ChatSession | null = null;
let currentSystemPrompt: string = "";

export const initializeSimulation = async (systemPrompt: string): Promise<void> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("API Key missing");

    const ai = new GoogleGenAI({ apiKey: apiKey });
    currentSystemPrompt = systemPrompt;
    chatSession = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      },
    });
  } catch (error) {
    console.error("Failed to initialize Gemini chat", error);
    throw error;
  }
};

export const sendMessageToGemini = async (message: string): Promise<string> => {
  if (!chatSession) {
    // Attempt re-initialization if session is lost but we have prompt
    if (currentSystemPrompt) {
        await initializeSimulation(currentSystemPrompt);
    } else {
        throw new Error("Chat session not initialized");
    }
  }

  try {
    const result = await chatSession!.sendMessage({
      message: message
    });
    return result.text;
  } catch (error: any) {
    console.error("Error sending message to Gemini", error);
    
    // Check for specific XHR/Rpc errors
    if (error.message && (error.message.includes("Rpc failed") || error.message.includes("xhr error"))) {
         // Retry once with new session
         console.log("Retrying connection...");
         await initializeSimulation(currentSystemPrompt);
         try {
            const resultRetry = await chatSession!.sendMessage({ message: message });
            return resultRetry.text;
         } catch(e) {
             return "Désolé, une erreur réseau persistante empêche la réponse. (RPC/XHR)";
         }
    }

    return "Désolé, une erreur de connexion s'est produite. (Simulation Error)";
  }
};

export const generateFeedback = async (conversationHistory: Message[]): Promise<string> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) return "Erreur: Clé API manquante pour le rapport.";

    const ai = new GoogleGenAI({ apiKey: apiKey });
    
    // If conversation is empty (e.g. vocal mode with no transcript), provide generic feedback
    if (!conversationHistory || conversationHistory.length <= 1) {
        return `
## ⚠️ Rapport Indisponible

La conversation était principalement vocale et aucune transcription n'a été enregistrée pour ce mode.

Pour obtenir un rapport détaillé :
* Utilisez le **Mode Texte** pour votre entraînement.
* Assurez-vous d'avoir échangé au moins quelques messages.
        `;
    }

    // Format history for the analysis
    const transcript = conversationHistory
      .map(m => `${m.sender === Sender.User ? 'CONSEILLER' : 'CLIENT'}: ${m.text}`)
      .join('\n');

    const prompt = `${IA_FA_FEEDBACK_PROMPT}\n\nVoici la transcription de l'entretien :\n${transcript}`;

    const feedbackResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash', 
      contents: prompt,
    });

    return feedbackResponse.text;
  } catch (error) {
    console.error("Error generating feedback", error);
    return "Erreur lors de la génération du feedback. (Vérifiez votre connexion ou clé API)";
  }
};
