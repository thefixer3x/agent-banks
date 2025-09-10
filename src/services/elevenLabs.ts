
import { supabase } from "@/integrations/supabase/client";

export interface TTSOptions {
  voice_id?: string;
  model_id?: string;
  stability?: number;
  similarity_boost?: number;
}

export interface STTOptions {
  language?: string;
  model?: string;
}

// Available ElevenLabs voices
export const ELEVENLABS_VOICES = {
  aria: '9BWtsMINqrJLrRacOk9x',
  roger: 'CwhRBWXzGAHq8TQ4Fs17',
  sarah: 'EXAVITQu4vr4xnSDxMaL',
  laura: 'FGY2WhTYpPnrIDTdsKH5',
  charlie: 'IKne3meq5aSn9XLyUdCD',
  george: 'JBFqnCBsd6RMkjVDRZzb',
  callum: 'N2lVS1w4EtoT3dr4eOWO',
  river: 'SAz9YHcvj6GT2YYXdXww',
  liam: 'TX3LPaxmHKxFdv7VOQHJ',
  charlotte: 'XB0fDUnXU5powFXDhCwa'
} as const;

export const textToSpeech = async (text: string, options: TTSOptions = {}): Promise<string> => {
  try {
    const { data, error } = await supabase.functions.invoke('elevenlabs-tts', {
      body: {
        text,
        voice_id: options.voice_id || ELEVENLABS_VOICES.aria,
        model_id: options.model_id || 'eleven_multilingual_v2',
        stability: options.stability || 0.5,
        similarity_boost: options.similarity_boost || 0.75
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

export const speechToText = async (audioBlob: Blob, options: STTOptions = {}): Promise<string> => {
  try {
    // Convert blob to base64
    const arrayBuffer = await audioBlob.arrayBuffer();
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    
    const { data, error } = await supabase.functions.invoke('elevenlabs-stt', {
      body: {
        audio: base64Audio,
        language: options.language || 'en',
        model: options.model || 'whisper-1'
      }
    });

    if (error) {
      throw new Error(error.message);
    }

    return data.text;
  } catch (error) {
    console.error('Speech-to-text error:', error);
    throw new Error('Failed to transcribe audio');
  }
};
