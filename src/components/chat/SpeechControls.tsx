
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { useAudioRecording } from '@/hooks/useAudioRecording';
import { speechToText } from '@/services/elevenLabs';
import { toast } from '@/hooks/use-toast';

interface SpeechControlsProps {
  onTranscription: (text: string) => void;
  isSpeechEnabled: boolean;
  onToggleSpeech: () => void;
  isLoading?: boolean;
}

const SpeechControls: React.FC<SpeechControlsProps> = ({ 
  onTranscription, 
  isSpeechEnabled,
  onToggleSpeech,
  isLoading = false
}) => {
  const { state, startRecording, stopRecording, resetRecording } = useAudioRecording();
  const [isTranscribing, setIsTranscribing] = useState(false);

  const handleRecordToggle = async () => {
    if (state.isRecording) {
      await stopRecording();
      // Check if we have an audio blob after stopping
      if (state.audioBlob) {
        await handleTranscribe(state.audioBlob);
      }
    } else {
      try {
        await startRecording();
      } catch (error) {
        console.error('Failed to start recording:', error);
        toast({
          title: "Recording Failed",
          description: "Could not start recording. Please check microphone permissions.",
          variant: "destructive",
        });
      }
    }
  };

  const handleTranscribe = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      const text = await speechToText(audioBlob);
      onTranscription(text);
      resetRecording();
      
      toast({
        title: "Transcription Complete",
        description: `Transcribed: "${text.slice(0, 50)}${text.length > 50 ? '...' : ''}"`,
      });
    } catch (error) {
      console.error('Transcription failed:', error);
      toast({
        title: "Transcription Failed",
        description: "Could not transcribe audio. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2 p-2 border border-orange-500/20 rounded-lg bg-gray-900/50">
      {/* Speech Output Toggle */}
      <Button
        size="sm"
        variant={isSpeechEnabled ? "default" : "outline"}
        onClick={onToggleSpeech}
        className="flex items-center gap-2"
      >
        {isSpeechEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        <span className="text-xs">TTS</span>
      </Button>

      {/* Recording Button */}
      <Button
        size="sm"
        variant={state.isRecording ? "destructive" : "outline"}
        onClick={handleRecordToggle}
        disabled={isLoading || isTranscribing}
        className="relative flex items-center gap-2"
      >
        {state.isRecording ? (
          <MicOff className="h-4 w-4" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
        <span className="text-xs">STT</span>
        {state.isRecording && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
        )}
      </Button>

      {/* Duration Display */}
      {state.duration > 0 && (
        <Badge variant="secondary" className="text-xs">
          {formatDuration(state.duration)}
        </Badge>
      )}

      {/* Status Indicators */}
      {isTranscribing && (
        <Badge variant="outline" className="text-xs animate-pulse">
          Transcribing...
        </Badge>
      )}

      {isSpeechEnabled && (
        <Badge variant="outline" className="text-xs text-orange-400">
          🎤 Speech Active
        </Badge>
      )}
    </div>
  );
};

export default SpeechControls;
