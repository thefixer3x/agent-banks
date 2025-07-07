# Claude + Agent-Banks IDE Integration

## Quick Setup

1. **Start Agent-Banks** (already running on port 7777)
2. **Start the Bridge**:
   ```bash
   python claude_ide_bridge.py
   ```

## Usage in Your IDE

### Option 1: Direct Terminal Commands

While coding, you can quickly ask Agent-Banks:

```bash
# Share a thought
curl -X POST http://localhost:8888/claude/think \
  -H "Content-Type: application/json" \
  -d '{"thought": "Should we add caching to this function?", "context": "Working on API calls"}'

# Review code
curl -X POST http://localhost:8888/claude/code_review \
  -H "Content-Type: application/json" \
  -d '{"code": "def hello():\n    return \"world\"", "language": "python"}'
```

### Option 2: IDE Shortcuts

Add these to your VSCode/Windsurf settings.json:

```json
{
  "terminal.integrated.env.osx": {
    "AGENT_BANKS_URL": "http://localhost:7777",
    "CLAUDE_BRIDGE_URL": "http://localhost:8888"
  }
}
```

### Option 3: Python Script in IDE

Create a file `.claude_helper.py` in your workspace:

```python
import requests
import json

def ask_banks(thought):
    """Quick function to ask Banks while coding"""
    response = requests.post('http://localhost:8888/claude/think', 
        json={"thought": thought, "context": "Active development"})
    
    if response.status_code == 200:
        print("💼 Banks says:", response.json()['banks_response'])
    else:
        print("❌ Bridge not running")

# Usage: 
# ask_banks("Should I refactor this class?")
```

## Your Personal Use Case

Since you want Claude to help build cool stuff with Agent-Banks:

1. **Real-time Development Feedback**
   - As you code, Claude can ask Banks for architectural advice
   - Bella can suggest UX improvements

2. **Collaborative Feature Building**
   - Claude proposes implementation
   - Banks reviews for best practices
   - Bella ensures user-friendliness

3. **Continuous Improvement Loop**
   - Your IDE Claude learns from Agent-Banks responses
   - Agent-Banks evolves based on your development patterns

## Example Workflow

```python
# In your IDE, while building a new feature:

# 1. Claude thinks of an approach
thought = "I'm implementing a voice command system for Agent-Banks"

# 2. Get Banks' technical perspective
banks_feedback = ask_banks(thought)

# 3. Implement with both Claude and Banks insights
# 4. Get code review from both personas
# 5. Iterate based on feedback
```

This creates a powerful triangle:
- **You** (the developer)
- **Claude** (in your IDE)
- **Banks/Bella** (your AI assistants)

All working together to build cool stuff! 🚀