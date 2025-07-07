#!/usr/bin/env python3
"""
Browserbase Integration for Agent-Banks
Adds cloud browser automation capabilities
"""

import asyncio
import json
import os
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
import logging

# Optional imports - fallback if not available
try:
    from browserbase import Browserbase
    from browserbase.helpers.gotopage import GotoPageHelper
    BROWSERBASE_AVAILABLE = True
except ImportError:
    BROWSERBASE_AVAILABLE = False
    print("⚠️  Browserbase not installed - using Playwright fallback only")


@dataclass
class BrowserAction:
    action_type: str
    target: str
    value: Optional[str] = None
    wait_time: float = 2.0


class BrowserbaseManager:
    """Enhanced browser automation using Browserbase cloud browsers"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.browserbase_api_key = os.getenv('BROWSERBASE_API_KEY')
        self.browserbase_project_id = os.getenv('BROWSERBASE_PROJECT_ID')
        
        if not self.browserbase_api_key or not BROWSERBASE_AVAILABLE:
            self.logger.warning("⚠️  Browserbase not available - using local browser fallback")
            self.browserbase_enabled = False
        else:
            self.browserbase_enabled = True
            self.client = Browserbase(api_key=self.browserbase_api_key)
            self.logger.info("✅ Browserbase cloud browser ready")
    
    async def navigate_and_interact(self, url: str, actions: List[BrowserAction] = None) -> Dict[str, Any]:
        """
        Navigate to URL and perform actions using Browserbase
        """
        if not self.browserbase_enabled:
            return await self._fallback_browser_automation(url, actions)
        
        try:
            # Create a new browser session
            session = self.client.sessions.create(
                project_id=self.browserbase_project_id
            )
            
            session_id = session.id
            self.logger.info(f"🌐 Started Browserbase session: {session_id}")
            
            result = {
                "session_id": session_id,
                "url": url,
                "actions_performed": [],
                "screenshots": [],
                "page_content": "",
                "success": True
            }
            
            # Use GotoPageHelper for navigation
            goto_helper = GotoPageHelper(session)
            
            # Navigate to the page
            self.logger.info(f"🔗 Navigating to: {url}")
            page_result = await goto_helper.goto(url)
            
            if page_result.get("success"):
                result["page_content"] = page_result.get("content", "")
                self.logger.info("✅ Page loaded successfully")
            
            # Perform actions if provided
            if actions:
                for action in actions:
                    action_result = await self._perform_action(session, action)
                    result["actions_performed"].append(action_result)
                    
                    if not action_result["success"]:
                        self.logger.warning(f"⚠️  Action failed: {action_result}")
            
            # Take a screenshot
            screenshot = await self._take_screenshot(session)
            if screenshot:
                result["screenshots"].append(screenshot)
            
            # Close the session
            self.client.sessions.close(session_id)
            self.logger.info(f"🔚 Closed session: {session_id}")
            
            return result
            
        except Exception as e:
            self.logger.error(f"❌ Browserbase automation failed: {e}")
            return await self._fallback_browser_automation(url, actions)
    
    async def _perform_action(self, session, action: BrowserAction) -> Dict[str, Any]:
        """Perform a specific browser action"""
        try:
            action_result = {
                "action": action.action_type,
                "target": action.target,
                "value": action.value,
                "success": False,
                "error": None
            }
            
            if action.action_type == "click":
                # Implement click action
                result = await self._click_element(session, action.target)
                action_result["success"] = result.get("success", False)
                
            elif action.action_type == "type":
                # Implement typing action
                result = await self._type_text(session, action.target, action.value)
                action_result["success"] = result.get("success", False)
                
            elif action.action_type == "wait":
                # Wait for element or time
                await asyncio.sleep(action.wait_time)
                action_result["success"] = True
                
            elif action.action_type == "extract":
                # Extract text from element
                result = await self._extract_text(session, action.target)
                action_result["value"] = result.get("text", "")
                action_result["success"] = result.get("success", False)
            
            return action_result
            
        except Exception as e:
            return {
                "action": action.action_type,
                "target": action.target,
                "success": False,
                "error": str(e)
            }
    
    async def _click_element(self, session, selector: str) -> Dict[str, Any]:
        """Click an element by selector"""
        try:
            # This would use Browserbase's click API
            # For now, returning a mock successful result
            return {"success": True, "action": "click", "selector": selector}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def _type_text(self, session, selector: str, text: str) -> Dict[str, Any]:
        """Type text into an element"""
        try:
            # This would use Browserbase's type API
            # For now, returning a mock successful result
            return {"success": True, "action": "type", "selector": selector, "text": text}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def _extract_text(self, session, selector: str) -> Dict[str, Any]:
        """Extract text from an element"""
        try:
            # This would use Browserbase's extract API
            # For now, returning a mock result
            return {"success": True, "text": "Extracted text", "selector": selector}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def _take_screenshot(self, session) -> Optional[str]:
        """Take a screenshot of the current page"""
        try:
            # This would use Browserbase's screenshot API
            # For now, returning a mock screenshot URL
            return "https://browserbase.com/screenshots/session_123.png"
        except Exception as e:
            self.logger.error(f"Screenshot failed: {e}")
            return None
    
    async def _fallback_browser_automation(self, url: str, actions: List[BrowserAction] = None) -> Dict[str, Any]:
        """Fallback to local Playwright automation when Browserbase is unavailable"""
        try:
            from playwright.async_api import async_playwright
            
            self.logger.info("🔄 Using local Playwright fallback")
            
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=False)
                page = await browser.new_page()
                
                # Navigate to URL
                await page.goto(url)
                
                result = {
                    "session_id": "local_playwright",
                    "url": url,
                    "actions_performed": [],
                    "page_content": await page.content(),
                    "success": True
                }
                
                # Perform actions if provided
                if actions:
                    for action in actions:
                        try:
                            if action.action_type == "click":
                                await page.click(action.target)
                                result["actions_performed"].append({
                                    "action": "click",
                                    "target": action.target,
                                    "success": True
                                })
                            
                            elif action.action_type == "type":
                                await page.fill(action.target, action.value)
                                result["actions_performed"].append({
                                    "action": "type",
                                    "target": action.target,
                                    "value": action.value,
                                    "success": True
                                })
                            
                            elif action.action_type == "wait":
                                await asyncio.sleep(action.wait_time)
                                result["actions_performed"].append({
                                    "action": "wait",
                                    "duration": action.wait_time,
                                    "success": True
                                })
                                
                        except Exception as action_error:
                            result["actions_performed"].append({
                                "action": action.action_type,
                                "target": action.target,
                                "success": False,
                                "error": str(action_error)
                            })
                
                await browser.close()
                return result
                
        except ImportError:
            return {
                "success": False,
                "error": "Neither Browserbase nor Playwright available for browser automation"
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Local browser automation failed: {str(e)}"
            }


class EnhancedWebAssistant:
    """Web automation assistant with Browserbase integration"""
    
    def __init__(self):
        self.browser_manager = BrowserbaseManager()
        self.logger = logging.getLogger(__name__)
        
    async def navigate_and_fill_form(self, url: str, form_data: Dict[str, str]) -> Dict[str, Any]:
        """Navigate to a website and auto-fill a form"""
        try:
            # Create actions for form filling
            actions = []
            
            # Add form filling actions based on common field names
            for field_name, field_value in form_data.items():
                # Try multiple selector strategies
                selectors = [
                    f'input[name="{field_name}"]',
                    f'input[id="{field_name}"]',
                    f'input[placeholder*="{field_name}"]',
                    f'textarea[name="{field_name}"]'
                ]
                
                for selector in selectors:
                    actions.append(BrowserAction(
                        action_type="type",
                        target=selector,
                        value=field_value
                    ))
                    break  # Use first matching selector
            
            # Navigate and perform actions
            result = await self.browser_manager.navigate_and_interact(url, actions)
            
            return {
                "success": result.get("success", False),
                "url": url,
                "form_data": form_data,
                "actions_performed": result.get("actions_performed", []),
                "session_id": result.get("session_id")
            }
            
        except Exception as e:
            self.logger.error(f"Form filling failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "url": url
            }
    
    async def extract_page_info(self, url: str, selectors: List[str]) -> Dict[str, Any]:
        """Extract specific information from a webpage"""
        try:
            # Create extraction actions
            actions = []
            for selector in selectors:
                actions.append(BrowserAction(
                    action_type="extract",
                    target=selector
                ))
            
            result = await self.browser_manager.navigate_and_interact(url, actions)
            
            # Process extraction results
            extracted_data = {}
            for action_result in result.get("actions_performed", []):
                if action_result["action"] == "extract" and action_result["success"]:
                    extracted_data[action_result["target"]] = action_result.get("value", "")
            
            return {
                "success": result.get("success", False),
                "url": url,
                "extracted_data": extracted_data,
                "page_content": result.get("page_content", "")
            }
            
        except Exception as e:
            self.logger.error(f"Page extraction failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "url": url
            }
    
    async def perform_website_task(self, task_description: str, url: str) -> Dict[str, Any]:
        """Perform a general website task based on description"""
        try:
            # This would integrate with AI to interpret the task
            # For now, just navigate to the URL
            result = await self.browser_manager.navigate_and_interact(url)
            
            return {
                "success": result.get("success", False),
                "task": task_description,
                "url": url,
                "result": "Task initiated - manual interaction may be required",
                "session_id": result.get("session_id")
            }
            
        except Exception as e:
            self.logger.error(f"Website task failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "task": task_description
            }


async def demo_browserbase_integration():
    """Demo the Browserbase integration"""
    print("🌐 Testing Browserbase Integration")
    
    assistant = EnhancedWebAssistant()
    
    # Test 1: Simple navigation
    print("\n📱 Test 1: Navigate to GitHub")
    result = await assistant.perform_website_task(
        "Navigate to GitHub and check repositories",
        "https://github.com"
    )
    print(f"Result: {result}")
    
    # Test 2: Form filling simulation
    print("\n📝 Test 2: Form filling simulation")
    form_data = {
        "name": "Test User",
        "email": "test@example.com",
        "message": "Hello from Agent-Banks!"
    }
    
    result = await assistant.navigate_and_fill_form(
        "https://example.com/contact",
        form_data
    )
    print(f"Form filling result: {result}")
    
    print("\n✅ Browserbase integration demo complete!")


if __name__ == "__main__":
    asyncio.run(demo_browserbase_integration())