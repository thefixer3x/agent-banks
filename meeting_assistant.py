#!/usr/bin/env python3
"""
Meeting Assistant Module
Handles meeting notes, action points, and voice fallbacks
"""

import asyncio
import json
import speech_recognition as sr
from elevenlabs import generate, save, set_api_key
import tempfile
import pygame
import os
import pyttsx3  # Desktop TTS fallback
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
import uuid
from datetime import datetime
import re


@dataclass
class MeetingNote:
    id: str
    timestamp: datetime
    speaker: Optional[str]
    content: str
    is_action_item: bool = False
    priority: str = "medium"
    assigned_to: Optional[str] = None
    due_date: Optional[datetime] = None


@dataclass
class Meeting:
    id: str
    title: str
    start_time: datetime
    end_time: Optional[datetime]
    participants: List[str]
    notes: List[MeetingNote] = field(default_factory=list)
    action_items: List[MeetingNote] = field(default_factory=list)
    recording_active: bool = False


class VoiceFallbackManager:
    """Manages voice fallbacks when primary TTS/STT fails"""
    
    def __init__(self):
        self.elevenlabs_available = self._check_elevenlabs()
        self.openai_tts_available = self._check_openai_tts()
        self.desktop_tts = self._init_desktop_tts()
        self.current_tts_mode = self._select_best_tts()
        
    def _check_elevenlabs(self) -> bool:
        """Check if ElevenLabs is available"""
        try:
            api_key = os.getenv('ELEVENLABS_API_KEY')
            return bool(api_key)
        except:
            return False
    
    def _check_openai_tts(self) -> bool:
        """Check if OpenAI TTS is available"""
        try:
            import openai
            api_key = os.getenv('OPENAI_API_KEY')
            return bool(api_key)
        except:
            return False
    
    def _init_desktop_tts(self) -> Optional[pyttsx3.Engine]:
        """Initialize desktop TTS engine"""
        try:
            engine = pyttsx3.init()
            # Configure voice settings for better quality
            voices = engine.getProperty('voices')
            if voices:
                # Try to find a better voice
                for voice in voices:
                    if 'zira' in voice.name.lower() or 'hazel' in voice.name.lower():
                        engine.setProperty('voice', voice.id)
                        break
            
            engine.setProperty('rate', 180)  # Slightly slower for clarity
            engine.setProperty('volume', 0.8)
            return engine
        except:
            return None
    
    def _select_best_tts(self) -> str:
        """Select best available TTS option"""
        if self.elevenlabs_available:
            return "elevenlabs"
        elif self.openai_tts_available:
            return "openai"
        elif self.desktop_tts:
            return "desktop"
        else:
            return "text_only"
    
    async def speak(self, text: str, fallback_to_text: bool = True) -> bool:
        """Speak with automatic fallbacks"""
        try:
            if self.current_tts_mode == "elevenlabs":
                return await self._speak_elevenlabs(text)
            elif self.current_tts_mode == "openai":
                return await self._speak_openai(text)
            elif self.current_tts_mode == "desktop":
                return self._speak_desktop(text)
            else:
                if fallback_to_text:
                    print(f"🤖 Assistant: {text}")
                    return True
                return False
        except Exception as e:
            print(f"TTS Error: {e}")
            # Fallback cascade
            if self.current_tts_mode != "desktop" and self.desktop_tts:
                print("📢 Falling back to desktop TTS...")
                return self._speak_desktop(text)
            elif fallback_to_text:
                print(f"📝 Text fallback: {text}")
                return True
            return False
    
    async def _speak_elevenlabs(self, text: str) -> bool:
        """ElevenLabs TTS"""
        try:
            audio = generate(text=text, voice="Josh")
            with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as temp_file:
                temp_file.write(audio)
                temp_file_path = temp_file.name
            
            pygame.mixer.music.load(temp_file_path)
            pygame.mixer.music.play()
            while pygame.mixer.music.get_busy():
                pygame.time.wait(100)
            os.unlink(temp_file_path)
            return True
        except Exception as e:
            print(f"ElevenLabs failed: {e}")
            return False
    
    async def _speak_openai(self, text: str) -> bool:
        """OpenAI TTS"""
        try:
            import openai
            client = openai.OpenAI()
            response = client.audio.speech.create(
                model="tts-1",
                voice="alloy",
                input=text
            )
            
            with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as temp_file:
                temp_file.write(response.content)
                temp_file_path = temp_file.name
            
            pygame.mixer.music.load(temp_file_path)
            pygame.mixer.music.play()
            while pygame.mixer.music.get_busy():
                pygame.time.wait(100)
            os.unlink(temp_file_path)
            return True
        except Exception as e:
            print(f"OpenAI TTS failed: {e}")
            return False
    
    def _speak_desktop(self, text: str) -> bool:
        """Desktop TTS fallback (sounds terrible but works)"""
        try:
            if self.desktop_tts:
                print("🔊 Using desktop speakers (low quality)...")
                self.desktop_tts.say(text)
                self.desktop_tts.runAndWait()
                return True
            return False
        except Exception as e:
            print(f"Desktop TTS failed: {e}")
            return False


class MeetingAssistant:
    """Enhanced meeting assistant with notes and action points"""
    
    def __init__(self):
        self.voice_manager = VoiceFallbackManager()
        self.recognizer = sr.Recognizer()
        self.microphone = sr.Microphone()
        
        self.active_meeting: Optional[Meeting] = None
        self.meetings_history: Dict[str, Meeting] = {}
        self.continuous_recording = False
        
        print("📝 Meeting Assistant ready!")
        self._show_tts_status()
    
    def _show_tts_status(self):
        """Show current TTS capabilities"""
        print(f"🔊 TTS Mode: {self.voice_manager.current_tts_mode}")
        if self.voice_manager.current_tts_mode == "desktop":
            print("⚠️  Using desktop speakers - audio quality will be low")
    
    async def speak(self, text: str):
        """Speak with fallbacks"""
        await self.voice_manager.speak(text)
    
    def listen(self, timeout: int = 10) -> Optional[str]:
        """Listen with voice fallback to typing"""
        try:
            print("🎙️ Listening... (or press Enter to type)")
            with self.microphone as source:
                self.recognizer.adjust_for_ambient_noise(source, duration=0.5)
                audio = self.recognizer.listen(source, timeout=timeout, phrase_time_limit=8)
            
            text = self.recognizer.recognize_google(audio)
            print(f"👂 Voice: '{text}'")
            return text
        except sr.WaitTimeoutError:
            print("⌨️  No voice detected. Type your input:")
            return input("Type: ")
        except sr.UnknownValueError:
            print("❌ Could not understand. Type your input:")
            return input("Type: ")
        except Exception as e:
            print(f"🔄 Voice failed ({e}). Type your input:")
            return input("Type: ")
    
    async def start_meeting(self, title: str, participants: List[str] = None) -> str:
        """Start a new meeting session"""
        meeting_id = str(uuid.uuid4())
        
        self.active_meeting = Meeting(
            id=meeting_id,
            title=title,
            start_time=datetime.now(),
            end_time=None,
            participants=participants or ["User"],
            recording_active=True
        )
        
        self.meetings_history[meeting_id] = self.active_meeting
        
        response = f"Meeting '{title}' started. I'm taking notes and will identify action items."
        await self.speak(response)
        
        # Start continuous recording
        asyncio.create_task(self.continuous_note_taking())
        
        return response
    
    async def continuous_note_taking(self):
        """Continuously record meeting notes"""
        self.continuous_recording = True
        await self.speak("Continuous note-taking active. Say 'stop recording' to pause.")
        
        while self.continuous_recording and self.active_meeting:
            try:
                # Listen for speech
                note_content = self.listen(timeout=30)
                if not note_content:
                    continue
                
                # Check for stop commands
                if "stop recording" in note_content.lower():
                    self.continuous_recording = False
                    await self.speak("Note recording paused.")
                    break
                
                # Create note
                note = MeetingNote(
                    id=str(uuid.uuid4()),
                    timestamp=datetime.now(),
                    speaker=self._identify_speaker(note_content),
                    content=note_content,
                    is_action_item=self._is_action_item(note_content)
                )
                
                self.active_meeting.notes.append(note)
                
                # If it's an action item, add to action items
                if note.is_action_item:
                    self.active_meeting.action_items.append(note)
                    await self.speak("Action item noted.")
                
                print(f"📝 Note: {note_content}")
                
            except Exception as e:
                print(f"Recording error: {e}")
                continue
    
    def _identify_speaker(self, content: str) -> str:
        """Identify speaker from content (basic implementation)"""
        # Would use voice recognition or speaker patterns
        return "Speaker"
    
    def _is_action_item(self, content: str) -> bool:
        """Identify if content is an action item"""
        action_keywords = [
            "action", "todo", "task", "follow up", "will do", 
            "responsible", "assign", "deadline", "by friday",
            "need to", "should", "must", "requirement"
        ]
        
        content_lower = content.lower()
        return any(keyword in content_lower for keyword in action_keywords)
    
    async def end_meeting(self) -> str:
        """End meeting and generate summary"""
        if not self.active_meeting:
            return "No active meeting to end."
        
        self.active_meeting.end_time = datetime.now()
        self.continuous_recording = False
        
        # Generate meeting summary
        summary = await self.generate_meeting_summary()
        
        await self.speak("Meeting ended. Generating summary and action items.")
        
        return summary
    
    async def generate_meeting_summary(self) -> str:
        """Generate comprehensive meeting summary"""
        if not self.active_meeting:
            return "No meeting data available."
        
        meeting = self.active_meeting
        
        # Calculate meeting duration
        duration = meeting.end_time - meeting.start_time if meeting.end_time else "Ongoing"
        
        summary = f"""
📝 MEETING SUMMARY
==================
Title: {meeting.title}
Duration: {duration}
Participants: {', '.join(meeting.participants)}
Total Notes: {len(meeting.notes)}
Action Items: {len(meeting.action_items)}

🎯 ACTION ITEMS:
"""
        
        for i, action in enumerate(meeting.action_items, 1):
            summary += f"{i}. {action.content}\n"
            if action.assigned_to:
                summary += f"   Assigned: {action.assigned_to}\n"
            if action.due_date:
                summary += f"   Due: {action.due_date}\n"
            summary += "\n"
        
        summary += "\n📋 ALL NOTES:\n"
        for note in meeting.notes:
            timestamp = note.timestamp.strftime("%H:%M")
            summary += f"[{timestamp}] {note.speaker}: {note.content}\n"
        
        print(summary)
        await self.speak(f"Meeting summary generated with {len(meeting.action_items)} action items.")
        
        return summary
    
    async def add_manual_note(self, content: str) -> str:
        """Manually add a note to current meeting"""
        if not self.active_meeting:
            return "No active meeting. Start a meeting first."
        
        note = MeetingNote(
            id=str(uuid.uuid4()),
            timestamp=datetime.now(),
            speaker="Manual Entry",
            content=content,
            is_action_item=self._is_action_item(content)
        )
        
        self.active_meeting.notes.append(note)
        
        if note.is_action_item:
            self.active_meeting.action_items.append(note)
            response = "Manual action item added."
        else:
            response = "Manual note added."
        
        await self.speak(response)
        return response
    
    async def get_action_items_summary(self) -> str:
        """Get summary of all action items"""
        if not self.active_meeting:
            return "No active meeting."
        
        action_items = self.active_meeting.action_items
        
        if not action_items:
            response = "No action items identified yet."
        else:
            response = f"Found {len(action_items)} action items:\n"
            for i, item in enumerate(action_items, 1):
                response += f"{i}. {item.content}\n"
        
        await self.speak(response)
        return response
    
    async def save_meeting_notes(self, filename: Optional[str] = None) -> str:
        """Save meeting notes to file"""
        if not self.active_meeting:
            return "No meeting to save."
        
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M")
            filename = f"meeting_notes_{timestamp}.txt"
        
        summary = await self.generate_meeting_summary()
        
        try:
            with open(filename, 'w') as f:
                f.write(summary)
            
            response = f"Meeting notes saved to {filename}"
            await self.speak(response)
            return response
        except Exception as e:
            error_msg = f"Failed to save notes: {str(e)}"
            await self.speak(error_msg)
            return error_msg
    
    async def run_meeting_mode(self):
        """Interactive meeting mode"""
        await self.speak("Meeting Assistant ready! Commands: 'start meeting', 'add note', 'end meeting', 'action items', 'save notes'")
        
        while True:
            try:
                command = self.listen()
                if not command:
                    continue
                
                command_lower = command.lower()
                
                if "start meeting" in command_lower:
                    title = input("Meeting title: ")
                    await self.start_meeting(title)
                
                elif "add note" in command_lower:
                    note_content = input("Note content: ")
                    await self.add_manual_note(note_content)
                
                elif "end meeting" in command_lower:
                    await self.end_meeting()
                
                elif "action items" in command_lower:
                    await self.get_action_items_summary()
                
                elif "save notes" in command_lower:
                    await self.save_meeting_notes()
                
                elif "quit" in command_lower or "exit" in command_lower:
                    if self.active_meeting:
                        await self.end_meeting()
                    await self.speak("Meeting Assistant shutting down.")
                    break
                
                else:
                    # Treat as a note if meeting is active
                    if self.active_meeting:
                        await self.add_manual_note(command)
                    else:
                        await self.speak("Please start a meeting first or use a valid command.")
                        
            except KeyboardInterrupt:
                if self.active_meeting:
                    await self.end_meeting()
                await self.speak("Meeting Assistant shutting down.")
                break


async def main():
    """Run the Meeting Assistant"""
    assistant = MeetingAssistant()
    await assistant.run_meeting_mode()


if __name__ == "__main__":
    asyncio.run(main())