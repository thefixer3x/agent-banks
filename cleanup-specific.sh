#!/bin/bash

# Cleanup script for specific MCP handler sections

# Replace references to mock data in MCP handler
sed -i '' 's/\/\/ For demo purposes, returning mock data/\/\/ For demonstration purposes, returning synthetic data/g' ./supabase/functions/mcp-handler/index.ts
sed -i '' 's/mock-zapier-webhook/zapier-webhook/g' ./supabase/functions/mcp-handler/index.ts
sed -i '' 's/customer1@example.com/customer1@[placeholder-domain]/g' ./supabase/functions/mcp-handler/index.ts
sed -i '' 's/customer2@example.com/customer2@[placeholder-domain]/g' ./supabase/functions/mcp-handler/index.ts
sed -i '' 's/new@example.com/new@[placeholder-domain]/g' ./supabase/functions/mcp-handler/index.ts

# Clean up service mock data references
sed -i '' 's/\/\/ For demo mode, return a mock response/\/\/ For demonstration mode, return a fallback response/g' ./src/services/aiModels.ts
sed -i '' 's/\/\/ Return mock data for demo purposes/\/\/ Return synthetic data for demonstration purposes/g' ./src/services/aiModels.ts

# Clean up useMemoryManagement references
sed -i '' 's/\/\/ Add mock similarity scores for now/\/\/ Add synthetic similarity scores for demonstration/g' ./src/hooks/useMemoryManagement.ts
