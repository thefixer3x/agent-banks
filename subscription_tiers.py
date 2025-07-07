#!/usr/bin/env python3
"""
Agent-Banks Subscription Tier System
Your subscription is the AI's monthly wages! 💰

Tier 1: Minor Actions Plan ($9/month) - The Training Wheels
Tier 2: Regular Plan ($29/month) - The Reliable Assistant  
Tier 3: Exclusive Actions Plan ($79/month) - The Power User
Tier 4: Big Boss Assistant Plan ($199/month) - The Executive Delegate
"""

import json
import sqlite3
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from enum import Enum


class SubscriptionTier(Enum):
    """Subscription tiers with increasing capabilities"""
    MINOR_ACTIONS = "minor_actions"
    REGULAR_PLAN = "regular_plan"
    EXCLUSIVE_ACTIONS = "exclusive_actions"
    BIG_BOSS_ASSISTANT = "big_boss_assistant"


@dataclass
class TierConfiguration:
    """Configuration for each subscription tier"""
    name: str
    price_monthly: float
    credits_per_month: int
    description: str
    features: List[str]
    action_types: List[str]
    max_concurrent_tasks: int
    ai_intelligence_level: str
    memory_retention_days: int
    priority_support: bool
    custom_workflows: bool
    api_access: bool


class SubscriptionManager:
    """Manages user subscriptions and credit system"""
    
    def __init__(self, db_path: str = "~/.agent_banks/subscriptions.db"):
        self.db_path = db_path
        self.conn = self._init_database()
        self.tiers = self._initialize_tiers()
        
    def _init_database(self) -> sqlite3.Connection:
        """Initialize subscription database"""
        import os
        from pathlib import Path
        
        db_path = Path(self.db_path).expanduser()
        db_path.parent.mkdir(parents=True, exist_ok=True)
        
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()
        
        # Users table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                subscription_tier TEXT NOT NULL,
                credits_remaining INTEGER DEFAULT 0,
                credits_total INTEGER DEFAULT 0,
                subscription_start DATE,
                subscription_end DATE,
                auto_renewal BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Usage tracking
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS usage_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                action_type TEXT NOT NULL,
                credits_used INTEGER NOT NULL,
                tier_required TEXT NOT NULL,
                success BOOLEAN DEFAULT 1,
                execution_time REAL,
                persona_used TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                metadata TEXT,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')
        
        # Subscription history
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS subscription_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                tier_from TEXT,
                tier_to TEXT,
                price_paid REAL,
                credits_added INTEGER,
                change_reason TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')
        
        conn.commit()
        return conn
        
    def _initialize_tiers(self) -> Dict[SubscriptionTier, TierConfiguration]:
        """Initialize subscription tier configurations"""
        return {
            SubscriptionTier.MINOR_ACTIONS: TierConfiguration(
                name="Minor Actions Plan",
                price_monthly=9.00,
                credits_per_month=100,
                description="Perfect for beginners - basic automation and simple tasks",
                features=[
                    "Basic click and type automation",
                    "Simple application launching", 
                    "Screenshot capabilities",
                    "Basic web browsing",
                    "Standard response time",
                    "Community support"
                ],
                action_types=[
                    "click", "type", "screenshot", "open_application", 
                    "browse_url", "scroll", "key_press"
                ],
                max_concurrent_tasks=1,
                ai_intelligence_level="Standard Claude",
                memory_retention_days=7,
                priority_support=False,
                custom_workflows=False,
                api_access=False
            ),
            
            SubscriptionTier.REGULAR_PLAN: TierConfiguration(
                name="Regular Plan", 
                price_monthly=29.00,
                credits_per_month=500,
                description="For productivity enthusiasts - advanced workflows and multi-step tasks",
                features=[
                    "All Minor Actions features",
                    "File management operations",
                    "Email and calendar integration",
                    "Multi-step workflows",
                    "Document creation/editing", 
                    "Research and data collection",
                    "Priority response time",
                    "Email support"
                ],
                action_types=[
                    "click", "type", "screenshot", "open_application", "browse_url",
                    "file_operation", "email_management", "calendar_event", 
                    "document_edit", "web_research", "data_extraction"
                ],
                max_concurrent_tasks=3,
                ai_intelligence_level="Enhanced Claude with Context",
                memory_retention_days=30,
                priority_support=True,
                custom_workflows=True,
                api_access=False
            ),
            
            SubscriptionTier.EXCLUSIVE_ACTIONS: TierConfiguration(
                name="Exclusive Actions Plan",
                price_monthly=79.00, 
                credits_per_month=2000,
                description="For power users - complex orchestration and advanced automation",
                features=[
                    "All Regular Plan features",
                    "Multi-app orchestration",
                    "Cross-platform data syncing", 
                    "Automated reporting workflows",
                    "Complex project management",
                    "Advanced AI reasoning",
                    "Custom persona training",
                    "API access (rate limited)",
                    "Priority support with chat"
                ],
                action_types=[
                    "click", "type", "screenshot", "open_application", "browse_url",
                    "file_operation", "email_management", "calendar_event", 
                    "document_edit", "web_research", "data_extraction",
                    "multi_app_workflow", "data_sync", "automated_reporting",
                    "complex_integration", "batch_processing"
                ],
                max_concurrent_tasks=10,
                ai_intelligence_level="Advanced Claude with Learning",
                memory_retention_days=90,
                priority_support=True,
                custom_workflows=True,
                api_access=True
            ),
            
            SubscriptionTier.BIG_BOSS_ASSISTANT: TierConfiguration(
                name="Big Boss Assistant Plan",
                price_monthly=199.00,
                credits_per_month=10000,
                description="For executives - full AI delegation and enterprise-level automation",
                features=[
                    "All Exclusive Actions features",
                    "Complete project delegation",
                    "Team coordination assistance",
                    "Strategic analysis and execution",
                    "Complex business workflows",
                    "AI-driven decision making",
                    "Custom enterprise integrations",
                    "Unlimited API access",
                    "Dedicated support manager",
                    "Custom SLA guarantees"
                ],
                action_types=[
                    # All previous actions plus:
                    "project_delegation", "team_coordination", "strategic_analysis",
                    "ai_decision_making", "enterprise_workflow", "custom_integration",
                    "advanced_analytics", "business_intelligence"
                ],
                max_concurrent_tasks=50,
                ai_intelligence_level="Executive Claude with Strategic Reasoning",
                memory_retention_days=365,
                priority_support=True,
                custom_workflows=True,
                api_access=True
            )
        }
    
    def create_user(self, username: str, email: str, 
                   tier: SubscriptionTier = SubscriptionTier.MINOR_ACTIONS) -> int:
        """Create new user with subscription"""
        cursor = self.conn.cursor()
        
        tier_config = self.tiers[tier]
        start_date = datetime.now()
        end_date = start_date + timedelta(days=30)  # Monthly subscription
        
        cursor.execute('''
            INSERT INTO users (username, email, subscription_tier, credits_remaining, 
                             credits_total, subscription_start, subscription_end)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (username, email, tier.value, tier_config.credits_per_month, 
              tier_config.credits_per_month, start_date, end_date))
        
        user_id = cursor.lastrowid
        
        # Log subscription creation
        cursor.execute('''
            INSERT INTO subscription_history (user_id, tier_from, tier_to, price_paid, 
                                            credits_added, change_reason)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (user_id, None, tier.value, tier_config.price_monthly, 
              tier_config.credits_per_month, "Initial subscription"))
        
        self.conn.commit()
        return user_id
    
    def get_user_subscription(self, username: str) -> Optional[Dict[str, Any]]:
        """Get user's current subscription details"""
        cursor = self.conn.cursor()
        cursor.execute('''
            SELECT * FROM users WHERE username = ?
        ''', (username,))
        
        row = cursor.fetchone()
        if not row:
            return None
            
        columns = [description[0] for description in cursor.description]
        user_data = dict(zip(columns, row))
        
        # Add tier configuration
        tier = SubscriptionTier(user_data['subscription_tier'])
        user_data['tier_config'] = self.tiers[tier]
        
        return user_data
    
    def can_execute_action(self, username: str, action_type: str) -> Dict[str, Any]:
        """Check if user can execute action based on subscription"""
        user = self.get_user_subscription(username)
        if not user:
            return {"allowed": False, "reason": "User not found"}
        
        # Check if subscription is active
        end_date = datetime.fromisoformat(user['subscription_end'])
        if datetime.now() > end_date:
            return {"allowed": False, "reason": "Subscription expired"}
        
        # Check if action is allowed in current tier
        tier = SubscriptionTier(user['subscription_tier'])
        tier_config = self.tiers[tier]
        
        if action_type not in tier_config.action_types:
            # Find minimum required tier
            required_tier = self._find_minimum_tier_for_action(action_type)
            return {
                "allowed": False, 
                "reason": f"Action requires {required_tier.value} tier",
                "current_tier": tier.value,
                "required_tier": required_tier.value,
                "upgrade_price": self.tiers[required_tier].price_monthly
            }
        
        # Check credits
        credits_needed = self._calculate_credits_for_action(action_type)
        if user['credits_remaining'] < credits_needed:
            return {
                "allowed": False, 
                "reason": "Insufficient credits",
                "credits_needed": credits_needed,
                "credits_remaining": user['credits_remaining']
            }
        
        return {
            "allowed": True,
            "credits_cost": credits_needed,
            "credits_remaining_after": user['credits_remaining'] - credits_needed
        }
    
    def execute_action(self, username: str, action_type: str, 
                      execution_time: float = 0.0, success: bool = True,
                      persona: str = "banks", metadata: Dict[str, Any] = None) -> bool:
        """Record action execution and deduct credits"""
        
        # Check if action is allowed
        permission = self.can_execute_action(username, action_type)
        if not permission["allowed"]:
            return False
        
        user = self.get_user_subscription(username)
        credits_cost = permission["credits_cost"]
        
        # Deduct credits
        cursor = self.conn.cursor()
        cursor.execute('''
            UPDATE users SET credits_remaining = credits_remaining - ?, 
                           updated_at = CURRENT_TIMESTAMP
            WHERE username = ?
        ''', (credits_cost, username))
        
        # Log usage
        tier_required = self._find_minimum_tier_for_action(action_type).value
        cursor.execute('''
            INSERT INTO usage_log (user_id, action_type, credits_used, tier_required,
                                 success, execution_time, persona_used, metadata)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (user['id'], action_type, credits_cost, tier_required, success,
              execution_time, persona, json.dumps(metadata or {})))
        
        self.conn.commit()
        return True
    
    def upgrade_subscription(self, username: str, new_tier: SubscriptionTier) -> bool:
        """Upgrade user's subscription tier"""
        user = self.get_user_subscription(username)
        if not user:
            return False
        
        current_tier = SubscriptionTier(user['subscription_tier'])
        new_tier_config = self.tiers[new_tier]
        
        # Calculate prorated credits (simplified)
        days_remaining = (datetime.fromisoformat(user['subscription_end']) - datetime.now()).days
        if days_remaining > 0:
            # Add prorated credits for remaining days
            daily_credits = new_tier_config.credits_per_month / 30
            additional_credits = int(daily_credits * days_remaining)
        else:
            additional_credits = new_tier_config.credits_per_month
        
        # Update subscription
        cursor = self.conn.cursor()
        end_date = datetime.now() + timedelta(days=30)
        
        cursor.execute('''
            UPDATE users SET subscription_tier = ?, credits_remaining = credits_remaining + ?,
                           credits_total = ?, subscription_end = ?, updated_at = CURRENT_TIMESTAMP
            WHERE username = ?
        ''', (new_tier.value, additional_credits, new_tier_config.credits_per_month,
              end_date, username))
        
        # Log subscription change
        cursor.execute('''
            INSERT INTO subscription_history (user_id, tier_from, tier_to, price_paid,
                                            credits_added, change_reason)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (user['id'], current_tier.value, new_tier.value, 
              new_tier_config.price_monthly, additional_credits, "Upgrade"))
        
        self.conn.commit()
        return True
    
    def get_usage_analytics(self, username: str, days: int = 30) -> Dict[str, Any]:
        """Get user's usage analytics"""
        user = self.get_user_subscription(username)
        if not user:
            return {}
        
        cursor = self.conn.cursor()
        cutoff_date = datetime.now() - timedelta(days=days)
        
        # Total usage stats
        cursor.execute('''
            SELECT COUNT(*) as total_actions, SUM(credits_used) as total_credits,
                   AVG(execution_time) as avg_execution_time,
                   SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful_actions
            FROM usage_log 
            WHERE user_id = ? AND timestamp > ?
        ''', (user['id'], cutoff_date))
        
        stats = dict(zip([d[0] for d in cursor.description], cursor.fetchone()))
        
        # Action breakdown
        cursor.execute('''
            SELECT action_type, COUNT(*) as count, SUM(credits_used) as credits
            FROM usage_log 
            WHERE user_id = ? AND timestamp > ?
            GROUP BY action_type
            ORDER BY count DESC
        ''', (user['id'], cutoff_date))
        
        action_breakdown = [
            dict(zip([d[0] for d in cursor.description], row))
            for row in cursor.fetchall()
        ]
        
        # Persona usage
        cursor.execute('''
            SELECT persona_used, COUNT(*) as count
            FROM usage_log 
            WHERE user_id = ? AND timestamp > ?
            GROUP BY persona_used
        ''', (user['id'], cutoff_date))
        
        persona_usage = dict(cursor.fetchall())
        
        return {
            "period_days": days,
            "summary": stats,
            "action_breakdown": action_breakdown,
            "persona_usage": persona_usage,
            "subscription": {
                "tier": user['subscription_tier'],
                "credits_remaining": user['credits_remaining'],
                "days_until_renewal": (datetime.fromisoformat(user['subscription_end']) - datetime.now()).days
            }
        }
    
    def _find_minimum_tier_for_action(self, action_type: str) -> SubscriptionTier:
        """Find minimum tier required for action"""
        for tier in [SubscriptionTier.MINOR_ACTIONS, SubscriptionTier.REGULAR_PLAN,
                     SubscriptionTier.EXCLUSIVE_ACTIONS, SubscriptionTier.BIG_BOSS_ASSISTANT]:
            if action_type in self.tiers[tier].action_types:
                return tier
        return SubscriptionTier.BIG_BOSS_ASSISTANT  # Default to highest tier
    
    def _calculate_credits_for_action(self, action_type: str) -> int:
        """Calculate credit cost for action"""
        tier = self._find_minimum_tier_for_action(action_type)
        
        # Credit costs by tier
        costs = {
            SubscriptionTier.MINOR_ACTIONS: 1,
            SubscriptionTier.REGULAR_PLAN: 5,
            SubscriptionTier.EXCLUSIVE_ACTIONS: 15,
            SubscriptionTier.BIG_BOSS_ASSISTANT: 50
        }
        
        return costs[tier]


def main():
    """Demo the subscription system"""
    print("💰 AGENT-BANKS SUBSCRIPTION SYSTEM")
    print("=" * 50)
    
    manager = SubscriptionManager()
    
    # Create demo user
    user_id = manager.create_user("demo_user", "demo@agentbanks.ai", SubscriptionTier.REGULAR_PLAN)
    print(f"✅ Created user ID: {user_id}")
    
    # Show subscription details
    user = manager.get_user_subscription("demo_user")
    print(f"\n📋 User: {user['username']}")
    print(f"   Tier: {user['tier_config'].name}")
    print(f"   Price: ${user['tier_config'].price_monthly}/month")
    print(f"   Credits: {user['credits_remaining']}/{user['credits_total']}")
    print(f"   Expires: {user['subscription_end']}")
    
    # Test action permissions
    test_actions = ["click", "file_operation", "multi_app_workflow", "strategic_analysis"]
    
    print(f"\n🔍 Action Permissions Test:")
    for action in test_actions:
        permission = manager.can_execute_action("demo_user", action)
        status = "✅ Allowed" if permission["allowed"] else "❌ Blocked"
        reason = f" - {permission.get('reason', '')}" if not permission["allowed"] else ""
        print(f"   {action}: {status}{reason}")
    
    # Execute some actions
    print(f"\n⚡ Executing Actions:")
    for action in ["click", "file_operation"]:
        success = manager.execute_action("demo_user", action, execution_time=1.5, persona="banks")
        print(f"   {action}: {'✅ Executed' if success else '❌ Failed'}")
    
    # Show analytics
    analytics = manager.get_usage_analytics("demo_user", days=30)
    print(f"\n📊 Usage Analytics (30 days):")
    print(f"   Total Actions: {analytics['summary']['total_actions']}")
    print(f"   Credits Used: {analytics['summary']['total_credits']}")
    print(f"   Success Rate: {analytics['summary']['successful_actions']}/{analytics['summary']['total_actions']}")
    
    print(f"\n💡 Tier Comparison:")
    for tier, config in manager.tiers.items():
        print(f"   {config.name}: ${config.price_monthly}/month - {config.credits_per_month} credits")


if __name__ == "__main__":
    main()