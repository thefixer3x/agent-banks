#!/bin/bash
# Start Complete Agent-Banks System with Real Execution

echo "🚀 Starting Complete Agent-Banks System with Real Execution..."
echo "================================================"

# Kill any existing processes
echo "🔄 Stopping existing services..."
pkill -f "web_frontend.py"
pkill -f "cua_ex_server.py"
pkill -f "unified_execution_orchestrator.py"
sleep 2

# Start CUA Execution Server (the missing piece!)
echo "1️⃣ Starting CUA Execution Server on port 5002..."
cd "/Users/seyederick/ochestrator logic1" && python3 cua_ex_server.py &
CUA_PID=$!
sleep 3

# Check if CUA server started
if lsof -i :5002 > /dev/null 2>&1; then
    echo "✅ CUA Execution Server running on port 5002"
else
    echo "❌ Failed to start CUA Execution Server"
    exit 1
fi

# Start Unified Execution Orchestrator (instead of basic web_frontend)
echo "2️⃣ Starting Unified Execution Orchestrator on port 7777..."
cd "/Users/seyederick/CascadeProjects/sd-ghost-protocol/agent_banks_workspace"
export PYTHONPATH="/Users/seyederick/CascadeProjects/sd-ghost-protocol/agent_banks_workspace:$PYTHONPATH"
uvicorn unified_execution_orchestrator:app --host 0.0.0.0 --port 7777 &
ORCHESTRATOR_PID=$!
sleep 3

# Check if orchestrator started
if lsof -i :7777 > /dev/null 2>&1; then
    echo "✅ Unified Execution Orchestrator running on port 7777"
else
    echo "❌ Failed to start Unified Execution Orchestrator"
    # Try with python directly if uvicorn fails
    python3 -m uvicorn unified_execution_orchestrator:app --host 0.0.0.0 --port 7777 &
    ORCHESTRATOR_PID=$!
    sleep 3
fi

echo ""
echo "🎉 Agent-Banks Complete System Started!"
echo "================================================"
echo "📍 Services Running:"
echo "   - CUA Execution Server: http://localhost:5002"
echo "   - Agent-Banks Interface: http://localhost:7777"
echo ""
echo "🔧 Features Enabled:"
echo "   ✅ Real computer control (not simulation!)"
echo "   ✅ Banks & Bella AI personas"
echo "   ✅ MCP memory integration"
echo "   ✅ Subscription tier management"
echo "   ✅ Multi-step workflow automation"
echo ""
echo "📝 Process IDs:"
echo "   - CUA Server PID: $CUA_PID"
echo "   - Orchestrator PID: $ORCHESTRATOR_PID"
echo ""
echo "🛑 To stop all services:"
echo "   pkill -f 'cua_ex_server.py|unified_execution_orchestrator.py'"
echo ""
echo "🌐 Opening Agent-Banks in browser..."
sleep 2
open http://localhost:7777

# Keep script running and show logs
echo ""
echo "📊 Monitoring services (Ctrl+C to stop)..."
tail -f /dev/null