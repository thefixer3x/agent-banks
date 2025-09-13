
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Upload, Play, Pause, Square, Volume2 } from 'lucide-react';
import { useAudioRecording } from '@/hooks/useAudioRecording';
import { transcribeAudio } from '@/services/speechToText';
import { toast } from '@/hooks/use-toast';

interface AudioControlsProps {
  onTranscription: (text: string) => void;
  isLoading?: boolean;
  className?: string;
}

const AudioControls: React.FC<AudioControlsProps> = ({ 
  onTranscription, 
  isLoading = false,
  className = "" 
}) => {
  const { state, startRecording, stopRecording, resetRecording } = useAudioRecording();
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleRecordToggle = async () => {
    if (state.isRecording) {
      stopRecording();
    } else {
      await startRecording();
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('audio/')) {
        handleTranscribe(file);
      } else {
        toast({
          title: "Invalid File",
          description: "Please select an audio file",
          variant: "destructive",
        });
      }
    }
  };

  const handleTranscribe = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      const result = await transcribeAudio(audioBlob);
      onTranscription(result.text);
      
      toast({
        title: "Transcription Complete",
        description: `Transcribed ${result.text.length} characters`,
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

  const handlePlayback = () => {
    if (!state.audioBlob) return;
    
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }

    const url = URL.createObjectURL(state.audioBlob);
    setAudioUrl(url);
    const audio = new Audio(url);
    
    audio.onended = () => {
      setIsPlaying(false);
      URL.revokeObjectURL(url);
    };
    
    audio.play();
    setIsPlaying(true);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Recording Button */}
      <Button
        size="icon"
        variant={state.isRecording ? "destructive" : "outline"}
        onClick={handleRecordToggle}
        disabled={isLoading || isTranscribing}
        className="relative"
      >
        {state.isRecording ? (
          <MicOff className="h-4 w-4" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
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

      {/* Playback Controls */}
      {state.audioBlob && (
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={handlePlayback}
            className="h-8 w-8"
          >
            {isPlaying ? (
              <Pause className="h-3 w-3" />
            ) : (
              <Play className="h-3 w-3" />
            )}
          </Button>
          
          <Button
            size="icon"
            variant="ghost"
            onClick={() => handleTranscribe(state.audioBlob!)}
            disabled={isTranscribing}
            className="h-8 w-8"
          >
            <Volume2 className="h-3 w-3" />
          </Button>
          
          <Button
            size="icon"
            variant="ghost"
            onClick={resetRecording}
            className="h-8 w-8"
          >
            <Square className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Upload Button */}
      <div className="relative">
        <input
          type="file"
          accept="audio/*"
          onChange={handleFileUpload}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isLoading || isTranscribing}
        />
        <Button
          size="icon"
          variant="outline"
          disabled={isLoading || isTranscribing}
        >
          <Upload className="h-4 w-4" />
        </Button>
      </div>

      {isTranscribing && (
        <Badge variant="outline" className="text-xs animate-pulse">
          Transcribing...
        </Badge>
      )}
    </div>
  );
};

export default AudioControls;
