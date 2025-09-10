/**
 * Example: How to use store_memory function
 * 
 * This demonstrates various ways to store memories in SD-Ghost Protocol
 */

import { store_memory, store_memories_batch, store_conversation_memory } from '@/utils/store-memory';

// Example 1: Store a simple knowledge memory
async function storeKnowledgeExample() {
  const result = await store_memory({
    title: "JavaScript Array Methods",
    content: `
      JavaScript provides many useful array methods:
      - map(): Transform each element
      - filter(): Select elements matching criteria
      - reduce(): Aggregate values
      - find(): Get first matching element
      - forEach(): Iterate over elements
      
      These methods are essential for functional programming in JavaScript.
    `,
    summary: "Overview of common JavaScript array methods",
    memory_type: "knowledge",
    tags: ["javascript", "programming", "arrays", "methods"],
    project_ref: "javascript-learning"
  });

  if (result.success) {
    console.log("✅ Knowledge stored:", result.memory.id);
  } else {
    console.error("❌ Failed:", result.error);
  }
}

// Example 2: Store project-related memory
async function storeProjectMemory() {
  const result = await store_memory({
    title: "SD-Ghost Protocol Enhancement Plan",
    content: `
      Enhancement roadmap for SD-Ghost Protocol:
      
      1. Implement real-time collaboration features
      2. Add voice input/output capabilities
      3. Create mobile-responsive UI
      4. Enhance memory search with filters
      5. Add export/import functionality
      
      Timeline: Q1 2025
      Priority: High
    `,
    summary: "Development roadmap for SD-Ghost Protocol enhancements",
    memory_type: "project",
    tags: ["roadmap", "enhancement", "planning", "sd-ghost-protocol"],
    project_ref: "sd-ghost-protocol",
    metadata: {
      priority: "high",
      timeline: "Q1 2025",
      status: "planning"
    }
  });

  console.log("Project memory stored:", result);
}

// Example 3: Store conversation memory
async function storeConversationExample() {
  const result = await store_conversation_memory(
    "How can I improve the search functionality in my app?",
    "To improve search functionality, consider: 1) Implementing fuzzy search, 2) Adding filters and facets, 3) Using vector embeddings for semantic search, 4) Caching frequent queries, 5) Adding search suggestions",
    {
      model: "gpt-4",
      topic: "search-optimization"
    }
  );

  console.log("Conversation stored:", result);
}

// Example 4: Batch store multiple memories
async function storeBatchExample() {
  const memories = [
    {
      title: "Meeting Notes - Team Standup",
      content: "Discussed progress on memory service extraction...",
      memory_type: "knowledge" as const,
      tags: ["meeting", "standup"],
      project_ref: "team-meetings"
    },
    {
      title: "Bug Fix - Memory Search",
      content: "Fixed issue where vector search was returning empty results...",
      memory_type: "reference" as const,
      tags: ["bugfix", "search"],
      project_ref: "sd-ghost-protocol"
    },
    {
      title: "API Design Decision",
      content: "Decided to use REST API with GraphQL for complex queries...",
      memory_type: "project" as const,
      tags: ["architecture", "api", "decision"],
      project_ref: "api-design"
    }
  ];

  const results = await store_memories_batch(memories);
  console.log(`Stored ${results.stored} memories successfully`);
}

// Example 5: Store with custom metadata
async function storeWithMetadata() {
  const result = await store_memory({
    title: "Customer Feedback Analysis",
    content: `
      Key insights from customer feedback:
      - Users want better search functionality
      - Mobile app is highly requested
      - Performance improvements needed
      - More integrations desired
    `,
    memory_type: "context",
    tags: ["feedback", "analysis", "customer"],
    metadata: {
      source: "survey-2025-q1",
      respondents: 150,
      satisfaction_score: 4.2,
      key_themes: ["search", "mobile", "performance", "integrations"],
      analysis_date: new Date().toISOString()
    }
  });

  console.log("Memory with metadata stored:", result);
}

// Run examples
async function runExamples() {
  console.log("🧠 SD-Ghost Protocol Memory Storage Examples\n");
  
  console.log("1️⃣ Storing knowledge memory...");
  await storeKnowledgeExample();
  
  console.log("\n2️⃣ Storing project memory...");
  await storeProjectMemory();
  
  console.log("\n3️⃣ Storing conversation memory...");
  await storeConversationExample();
  
  console.log("\n4️⃣ Batch storing memories...");
  await storeBatchExample();
  
  console.log("\n5️⃣ Storing with custom metadata...");
  await storeWithMetadata();
  
  console.log("\n✅ All examples completed!");
}

// Export for use in other files
export {
  storeKnowledgeExample,
  storeProjectMemory,
  storeConversationExample,
  storeBatchExample,
  storeWithMetadata,
  runExamples
};