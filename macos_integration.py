#!/usr/bin/env python3
"""
macOS Native Integration for Agent-Banks
Integrates with Calendar, Reminders, and other native apps
"""

import subprocess
import json
from datetime import datetime, timedelta
from typing import List, Dict, Optional


class MacOSTaskIntegration:
    """Integrate Agent-Banks with macOS native task apps"""
    
    def __init__(self):
        self.has_permissions = self.check_permissions()
    
    def check_permissions(self) -> Dict[str, bool]:
        """Check which permissions we have"""
        permissions = {
            "calendar": self._check_calendar_access(),
            "reminders": self._check_reminders_access(),
            "contacts": self._check_contacts_access()
        }
        return permissions
    
    def _check_calendar_access(self) -> bool:
        """Check if we have calendar access"""
        try:
            # Try to list calendars
            script = '''
            tell application "Calendar"
                return count of calendars
            end tell
            '''
            result = self._run_applescript(script)
            return result is not None
        except:
            return False
    
    def _check_reminders_access(self) -> bool:
        """Check if we have reminders access"""
        try:
            script = '''
            tell application "Reminders"
                return count of lists
            end tell
            '''
            result = self._run_applescript(script)
            return result is not None
        except:
            return False
    
    def _check_contacts_access(self) -> bool:
        """Check if we have contacts access"""
        try:
            script = '''
            tell application "Contacts"
                return count of people
            end tell
            '''
            result = self._run_applescript(script)
            return result is not None
        except:
            return False
    
    def _run_applescript(self, script: str) -> Optional[str]:
        """Run AppleScript and return result"""
        try:
            result = subprocess.run(
                ['osascript', '-e', script],
                capture_output=True,
                text=True,
                check=True
            )
            return result.stdout.strip()
        except subprocess.CalledProcessError:
            return None
    
    # Calendar Integration
    def create_calendar_event(self, title: str, date: datetime, 
                            duration_minutes: int = 60, 
                            notes: str = "") -> bool:
        """Create a calendar event"""
        if not self.has_permissions.get("calendar", False):
            return False
            
        end_date = date + timedelta(minutes=duration_minutes)
        
        script = f'''
        tell application "Calendar"
            tell calendar "Home"
                make new event with properties {{summary:"{title}", start date:date "{date.strftime('%m/%d/%Y %I:%M %p')}", end date:date "{end_date.strftime('%m/%d/%Y %I:%M %p')}", description:"{notes}"}}
            end tell
        end tell
        '''
        
        return self._run_applescript(script) is not None
    
    def get_today_events(self) -> List[Dict]:
        """Get today's calendar events"""
        if not self.has_permissions.get("calendar", False):
            return []
            
        script = '''
        tell application "Calendar"
            set todayStart to current date
            set hours of todayStart to 0
            set minutes of todayStart to 0
            set seconds of todayStart to 0
            
            set todayEnd to todayStart + 1 * days
            
            set todayEvents to {}
            
            repeat with cal in calendars
                set calEvents to (every event of cal whose start date >= todayStart and start date < todayEnd)
                repeat with evt in calEvents
                    set end of todayEvents to (summary of evt as string) & "|" & (start date of evt as string)
                end repeat
            end repeat
            
            return todayEvents
        end tell
        '''
        
        result = self._run_applescript(script)
        if not result:
            return []
            
        events = []
        for event_str in result.split(", "):
            if "|" in event_str:
                title, date_str = event_str.split("|", 1)
                events.append({"title": title, "date": date_str})
        
        return events
    
    # Reminders Integration
    def create_reminder(self, title: str, due_date: Optional[datetime] = None,
                       list_name: str = "Reminders", notes: str = "") -> bool:
        """Create a reminder"""
        if not self.has_permissions.get("reminders", False):
            return False
            
        if due_date:
            due_str = f'due date:date "{due_date.strftime("%m/%d/%Y %I:%M %p")}",'
        else:
            due_str = ""
            
        script = f'''
        tell application "Reminders"
            tell list "{list_name}"
                make new reminder with properties {{name:"{title}", {due_str} body:"{notes}"}}
            end tell
        end tell
        '''
        
        return self._run_applescript(script) is not None
    
    def get_pending_reminders(self) -> List[Dict]:
        """Get all pending reminders"""
        if not self.has_permissions.get("reminders", False):
            return []
            
        script = '''
        tell application "Reminders"
            set pendingReminders to {}
            
            repeat with reminderList in lists
                set listReminders to (every reminder of reminderList whose completed is false)
                repeat with r in listReminders
                    set reminderInfo to (name of r as string) & "|" & (name of reminderList as string)
                    if due date of r is not missing value then
                        set reminderInfo to reminderInfo & "|" & (due date of r as string)
                    end if
                    set end of pendingReminders to reminderInfo
                end repeat
            end repeat
            
            return pendingReminders
        end tell
        '''
        
        result = self._run_applescript(script)
        if not result:
            return []
            
        reminders = []
        for reminder_str in result.split(", "):
            parts = reminder_str.split("|")
            reminder = {
                "title": parts[0] if len(parts) > 0 else "",
                "list": parts[1] if len(parts) > 1 else "Reminders",
                "due_date": parts[2] if len(parts) > 2 else None
            }
            reminders.append(reminder)
        
        return reminders
    
    def complete_reminder(self, title: str) -> bool:
        """Mark a reminder as completed"""
        if not self.has_permissions.get("reminders", False):
            return False
            
        script = f'''
        tell application "Reminders"
            set targetReminder to first reminder whose name is "{title}" and completed is false
            set completed of targetReminder to true
        end tell
        '''
        
        return self._run_applescript(script) is not None
    
    # Contacts Integration for Vendor Management
    def add_vendor_contact(self, name: str, company: str = "", 
                          email: str = "", phone: str = "", 
                          notes: str = "") -> bool:
        """Add a vendor contact"""
        if not self.has_permissions.get("contacts", False):
            return False
            
        script = f'''
        tell application "Contacts"
            set newPerson to make new person with properties {{first name:"{name}", organization:"{company}", note:"{notes}"}}
            
            if "{email}" is not "" then
                make new email at end of emails of newPerson with properties {{label:"work", value:"{email}"}}
            end if
            
            if "{phone}" is not "" then
                make new phone at end of phones of newPerson with properties {{label:"work", value:"{phone}"}}
            end if
            
            save
        end tell
        '''
        
        return self._run_applescript(script) is not None
    
    def search_vendors(self, query: str) -> List[Dict]:
        """Search for vendor contacts"""
        if not self.has_permissions.get("contacts", False):
            return []
            
        script = f'''
        tell application "Contacts"
            set foundPeople to people whose organization contains "{query}" or name contains "{query}"
            set results to {{}}
            
            repeat with p in foundPeople
                set contactInfo to (name of p as string) & "|" & (organization of p as string)
                set end of results to contactInfo
            end repeat
            
            return results
        end tell
        '''
        
        result = self._run_applescript(script)
        if not result:
            return []
            
        vendors = []
        for vendor_str in result.split(", "):
            if "|" in vendor_str:
                name, company = vendor_str.split("|", 1)
                vendors.append({"name": name, "company": company})
        
        return vendors
    
    # Quick Actions for Agent-Banks
    def process_task_command(self, command: str) -> Dict[str, Any]:
        """Process natural language task commands"""
        command_lower = command.lower()
        
        # Calendar commands
        if "schedule" in command_lower or "meeting" in command_lower:
            # Parse meeting details from command
            # Example: "Schedule meeting with John tomorrow at 2pm"
            return {
                "action": "create_event",
                "app": "Calendar",
                "details": "Parsed meeting details would go here"
            }
        
        # Reminder commands
        elif "remind" in command_lower or "todo" in command_lower:
            # Parse reminder from command
            return {
                "action": "create_reminder",
                "app": "Reminders",
                "details": "Parsed reminder details"
            }
        
        # Vendor/Contact commands
        elif "vendor" in command_lower or "contact" in command_lower:
            if "add" in command_lower or "create" in command_lower:
                return {
                    "action": "add_vendor",
                    "app": "Contacts",
                    "details": "Parsed vendor details"
                }
            else:
                return {
                    "action": "search_vendor",
                    "app": "Contacts",
                    "details": "Search query"
                }
        
        # List tasks
        elif "tasks" in command_lower or "agenda" in command_lower:
            events = self.get_today_events()
            reminders = self.get_pending_reminders()
            
            return {
                "action": "list_tasks",
                "events": events,
                "reminders": reminders
            }
        
        return {"action": "unknown", "command": command}


# Integration with Agent-Banks
class AgentBanksTaskManager:
    """Manage tasks through Agent-Banks with native app integration"""
    
    def __init__(self):
        self.macos = MacOSTaskIntegration()
        
    def handle_task_request(self, message: str, persona: str = "banks") -> str:
        """Handle task-related requests"""
        
        # Process the command
        result = self.macos.process_task_command(message)
        
        if result["action"] == "list_tasks":
            # Format tasks nicely
            response = "📅 Today's Schedule:\n\n"
            
            if result.get("events"):
                response += "Calendar Events:\n"
                for event in result["events"]:
                    response += f"• {event['title']} - {event['date']}\n"
            else:
                response += "No calendar events today.\n"
            
            response += "\n📝 Pending Tasks:\n"
            if result.get("reminders"):
                for reminder in result["reminders"]:
                    due = f" (due: {reminder['due_date']})" if reminder.get('due_date') else ""
                    response += f"• {reminder['title']} [{reminder['list']}]{due}\n"
            else:
                response += "No pending reminders.\n"
            
            return response
        
        elif result["action"] == "create_event":
            # Would parse and create event
            return "I'll help you schedule that. Please provide the date and time."
        
        elif result["action"] == "create_reminder":
            # Would parse and create reminder
            return "I'll create that reminder for you."
        
        elif result["action"] == "add_vendor":
            return "I'll add that vendor contact. Please provide their details."
        
        elif result["action"] == "search_vendor":
            vendors = self.macos.search_vendors(message.split("vendor")[-1].strip())
            if vendors:
                response = "Found these vendors:\n"
                for v in vendors:
                    response += f"• {v['name']} - {v['company']}\n"
                return response
            else:
                return "No vendors found matching your search."
        
        else:
            return f"I couldn't understand that task command. Try:\n• 'Show my tasks'\n• 'Schedule meeting...'\n• 'Remind me to...'\n• 'Add vendor...'"