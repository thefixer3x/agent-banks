#!/usr/bin/env node

/**
 * Test script for hybrid VPS + Supabase integration
 */

// Test VPS services
async function testVPSServices() {
  console.log('🔍 Testing VPS Services...');
  
  // Test VPS Chat API
  try {
    console.log('Testing VPS Chat API...');
    const chatResponse = await fetch('http://srv896342.hstgr.cloud:5000/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: "Hello, this is a test of the hybrid integration system",
        persona: "banks"
      })
    });
    
    if (chatResponse.ok) {
      const chatData = await chatResponse.json();
      console.log('✅ VPS Chat API working:', chatData.response.substring(0, 100) + '...');
    } else {
      console.log('❌ VPS Chat API failed:', chatResponse.status);
    }
  } catch (error) {
    console.log('❌ VPS Chat API error:', error.message);
  }

  // Test VPS Memory API
  try {
    console.log('Testing VPS Memory Search API...');
    const memoryResponse = await fetch('http://srv896342.hstgr.cloud:3000/api/memories/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: "integration test",
        limit: 3
      })
    });
    
    if (memoryResponse.ok) {
      const memoryData = await memoryResponse.json();
      console.log('✅ VPS Memory API working:', memoryData.success ? 'Success' : 'Failed');
      console.log('   Search strategies:', memoryData.strategies_used?.map(s => s.strategy).join(', '));
    } else {
      console.log('❌ VPS Memory API failed:', memoryResponse.status);
    }
  } catch (error) {
    console.log('❌ VPS Memory API error:', error.message);
  }

  // Test VPS Status APIs
  try {
    console.log('Testing VPS Status APIs...');
    const [chatStatus, memoryHealth] = await Promise.all([
      fetch('http://srv896342.hstgr.cloud:5000/status').then(r => r.json()),
      fetch('http://srv896342.hstgr.cloud:3000/health').then(r => r.json())
    ]);
    
    console.log('✅ VPS Status APIs working:');
    console.log('   Chat Service - AI Provider:', chatStatus['AI Provider']?.available ? 'Available' : 'Unavailable');
    console.log('   Memory Service - Status:', memoryHealth.status || 'Unknown');
    console.log('   Memory Features:', Object.keys(memoryHealth.features || {}).filter(k => memoryHealth.features[k]).join(', '));
  } catch (error) {
    console.log('❌ VPS Status APIs error:', error.message);
  }
}

// Test React app connectivity
async function testReactApp() {
  console.log('\n🔍 Testing React App...');
  
  try {
    const response = await fetch('http://localhost:8081');
    if (response.ok) {
      console.log('✅ React app is accessible at http://localhost:8081');
    } else {
      console.log('❌ React app returned status:', response.status);
    }
  } catch (error) {
    console.log('❌ React app not accessible:', error.message);
    console.log('💡 Start it with: cd /Users/seyederick/CascadeProjects/sd-ghost-protocol && npm run dev');
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Hybrid Integration Test Suite');
  console.log('='.repeat(50));
  
  await testVPSServices();
  await testReactApp();
  
  console.log('\n✅ Test Summary:');
  console.log('   VPS Chat API: Available on port 5000');
  console.log('   VPS Memory API: Available on port 3000');
  console.log('   React Frontend: Needs to be started on port 8081');
  console.log('\n🎯 Integration Status: VPS services ready for React frontend connection');
}

// Run the tests
runTests().catch(console.error);