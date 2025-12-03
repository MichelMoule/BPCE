export const playOpenAITTS = async (text: string, voiceId: string = 'cole'): Promise<void> => {
  // Use environment variable for API key
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error("OpenAI API Key is missing");
    alert("Veuillez configurer la clé API OpenAI (OPENAI_API_KEY) pour entendre la voix.");
    return;
  }

  // Map our internal voiceIds to OpenAI voices
  // 'nova' is good for female, 'cole' (or 'alloy'/'echo') for male
  // The user requested 'cole' specifically for some, but we use 'nova' for female chars in constants.ts
  const openaiVoice = voiceId === 'nova' ? 'nova' : 'alloy'; // 'cole' is not a standard OpenAI TTS voice name, mapped to 'alloy' or 'fable' usually. 'onyx' is deep male. Let's use 'onyx' for male. 
  // Wait, the prompt specifically asked for "OPENAI Cole". 
  // OpenAI TTS voices are: alloy, echo, fable, onyx, nova, shimmer. 
  // "Cole" is not a standard OpenAI TTS voice. The user might mean a custom voice or "Cove" (deprecated?). 
  // I will map 'cole' to 'onyx' (male) and 'nova' to 'nova' (female).
  
  const targetVoice = voiceId === 'nova' ? 'nova' : 'onyx';

  try {
    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "tts-1",
        input: text,
        voice: targetVoice,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("OpenAI TTS Error:", err);
      throw new Error(`Failed to generate speech: ${err}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start(0);

  } catch (error) {
    console.error("Error playing OpenAI TTS:", error);
  }
};
