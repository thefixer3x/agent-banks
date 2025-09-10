#!/usr/bin/env python3
"""
Diagnose Agent-Banks Setup
Checks what's running vs what should be running for real execution
"""

import subprocess
import os
import requests
import json
from pathlib import Path

print("🔍 Agent-Banks System Diagnostic")
print("=" * 50)

# Check running processes
print("\n📊 Currently Running Processes:")
processes = subprocess.run(['ps', 'aux'], capture_output=True, text=True)
running = {
    'web_frontend.py': False,
    'unified_execution_orchestrator.py': False,
    'cua_ex_server.py': False,
    'enhanced_memory_server.js': False
}

for line in processes.stdout.split('\n'):
    for process in running:
        if process in line and 'grep' not in line:
            running[process] = True
            print(f"   ✅ {process} is running")

for process, is_running in running.items():
    if not is_running:
        print(f"   ❌ {process} is NOT running")

# Check ports
print("\n🔌 Port Status:")
ports = {
    5002: "CUA Execution Server (CRITICAL for real execution)",
    7777: "Agent-Banks Web Interface",
    3000: "Memory Service",
    8888: "Claude's Realm IDE"
}

for port, service in ports.items():
    try:
        result = subprocess.run(['lsof', '-i', f':{port}'], capture_output=True, text=True)
        if result.stdout:
            print(f"   ✅ Port {port}: {service} - ACTIVE")
        else:
            print(f"   ❌ Port {port}: {service} - NOT RUNNING")
    except:
        print(f"   ⚠️  Port {port}: Could not check")

# Check file locations
print("\n📁 Critical File Locations:")
files = {
    "/Users/seyederick/ochestrator logic1/cua_ex_server.py": "CUA Execution Server (THE BREAKTHROUGH)",
    "/Users/seyederick/CascadeProjects/sd-ghost-protocol/agent_banks_workspace/unified_execution_orchestrator.py": "Unified Orchestrator",
    "/Users/seyederick/CascadeProjects/sd-ghost-protocol/agent_banks_workspace/web_frontend.py": "Basic Web Frontend",
    "/Users/seyederick/DevOps/_project_folders/computer agent/CA_improvements/cua_ex_server.py": "Original CUA Server"
}

for file_path, description in files.items():
    if os.path.exists(file_path):
        print(f"   ✅ Found: {description}")
        print(f"      Path: {file_path}")
    else:
        print(f"   ❌ Missing: {description}")

# Test services
print("\n🧪 Service Health Checks:")

# Test CUA server
try:
    response = requests.get("http://localhost:5002/health", timeout=2)
    if response.status_code == 200:
        print("   ✅ CUA Execution Server: HEALTHY")
    else:
        print("   ❌ CUA Execution Server: UNHEALTHY")
except:
    print("   ❌ CUA Execution Server: NOT RESPONDING (This is why execution doesn't work!)")

# Test Agent-Banks interface
try:
    response = requests.get("http://localhost:7777/health", timeout=2)
    if response.status_code == 200:
        print("   ✅ Agent-Banks Interface: HEALTHY")
    else:
        print("   ⚠️  Agent-Banks Interface: UNHEALTHY")
except:
    try:
        response = requests.get("http://localhost:7777/status", timeout=2)
        if response.status_code == 200:
            print("   ✅ Agent-Banks Interface: RUNNING (basic mode)")
        else:
            print("   ❌ Agent-Banks Interface: ERROR")
    except:
        print("   ❌ Agent-Banks Interface: NOT RESPONDING")

# Analysis
print("\n🎯 DIAGNOSIS:")
print("=" * 50)

if not running['cua_ex_server.py']:
    print("❌ CRITICAL: CUA Execution Server is NOT running!")
    print("   This is the 'Sherlock breakthrough' that enables real computer control.")
    print("   Without this, Agent-Banks can only simulate actions, not execute them.")
    print("")

if running['web_frontend.py'] and not running['unified_execution_orchestrator.py']:
    print("⚠️  WARNING: Running basic web_frontend.py instead of unified orchestrator!")
    print("   The basic frontend doesn't connect to the CUA execution server.")
    print("   You need the unified orchestrator for real execution capabilities.")
    print("")

print("🔧 TO FIX AND ENABLE REAL EXECUTION:")
print("   1. Stop current services:")
print("      pkill -f 'web_frontend.py'")
print("")
print("   2. Start the complete system:")
print("      ./start_agent_banks_complete.sh")
print("")
print("   OR manually:")
print("      # Terminal 1 - Start CUA Server:")
print("      cd '/Users/seyederick/ochestrator logic1'")
print("      python3 cua_ex_server.py")
print("")
print("      # Terminal 2 - Start Orchestrator:")
print("      cd '/Users/seyederick/CascadeProjects/sd-ghost-protocol/agent_banks_workspace'")
print("      uvicorn unified_execution_orchestrator:app --port 7777")

print("\n" + "=" * 50)
print("💡 Remember: The CUA server is what makes Agent-Banks REAL, not just a chatbot!")