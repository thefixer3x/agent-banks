
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { audio, model = 'whisper-1', language = 'en', useFree = false } = await req.json();
    
    if (!audio) {
      throw new Error('No audio data provided');
    }

    // Use free mode if explicitly requested or if OpenAI API key is not available
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    const useFreeTier = useFree || !OPENAI_API_KEY;
    
    if (useFreeTier) {
      // Return a helpful message for free tier users
      return new Response(
        JSON.stringify({ 
          text: "Speech transcription in Ghost Basic mode is limited. To access full speech-to-text capabilities, please add your OpenAI API key in settings.",
          language: language,
          duration: 0,
          is_free_tier: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    // Convert base64 to binary
    const binaryString = atob(audio);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Create form data
    const formData = new FormData();
    const blob = new Blob([bytes], { type: 'audio/webm' });
    formData.append('file', blob, 'audio.webm');
    formData.append('model', model);
    if (language) {
      formData.append('language', language);
    }

    // Send to OpenAI Whisper API
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const result = await response.json();

    return new Response(
      JSON.stringify({ 
        text: result.text,
        language: result.language,
        duration: result.duration
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Transcription error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
