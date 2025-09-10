
import { supabase } from "@/integrations/supabase/client";

export interface TranscriptionResult {
  text: string;
  confidence?: number;
  language?: string;
  is_free_tier?: boolean;
}

export const transcribeAudio = async (audioBlob: Blob, useFree: boolean = false): Promise<TranscriptionResult> => {
  try {
    // If Web Speech API is available and we're using free mode, use browser transcription
    if (useFree && 'webkitSpeechRecognition' in window) {
      return await transcribeWithBrowser(audioBlob);
    }
    
    // Convert blob to base64
    const arrayBuffer = await audioBlob.arrayBuffer();
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    
    const { data, error } = await supabase.functions.invoke('whisper-transcribe', {
      body: {
        audio: base64Audio,
        model: 'whisper-1',
        language: 'en',
        useFree
      }
    });

    if (error) {
      throw new Error(error.message);
    }

    return {
      text: data.text || '',
      confidence: data.confidence,
      language: data.language,
      is_free_tier: data.is_free_tier
    };
  } catch (error) {
    console.error('Transcription error:', error);
    throw new Error('Failed to transcribe audio');
  }
};

// Browser-based transcription using Web Speech API as a fallback
const transcribeWithBrowser = async (audioBlob: Blob): Promise<TranscriptionResult> => {
  return new Promise((resolve, reject) => {
    try {
      // Create audio element to play the recording
      const audio = new Audio();
      audio.src = URL.createObjectURL(audioBlob);
      
      // This is a simplified version as browser Speech API normally works with live audio
      // We're just returning a placeholder response with a note about the limitation
      setTimeout(() => {
        resolve({
          text: "Browser-based transcription is not fully supported in free mode. For accurate transcription, please add your OpenAI API key in settings.",
          confidence: 0.5,
          language: 'en',
          is_free_tier: true
        });
      }, 1000);
    } catch (error) {
      console.error('Browser transcription error:', error);
      reject(new Error('Browser transcription failed'));
    }
  });
};

export const textToSpeech = async (text: string, voice: string = 'alloy'): Promise<string> => {
  try {
    const { data, error } = await supabase.functions.invoke('text-to-speech', {
      body: {
        text,
        voice,
        model: 'tts-1'
      }
    });

    if (error) {
      throw new Error(error.message);
    }

    return data.audioContent; // base64 encoded audio
  } catch (error) {
    console.error('Text-to-speech error:', error);
    throw new Error('Failed to generate speech');
  }
};
