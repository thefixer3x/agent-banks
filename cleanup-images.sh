#!/bin/bash

# SD-Ghost-Protocol Final Cleanup Script
echo "Starting final image path cleanup..."

# Replace all instances of Lovable image paths with SD logo
find ./src -type f -name "*.tsx" -exec sed -i '' 's|/lovable-uploads/387154da-ae17-4d3b-82a5-2516cb6d85b2.png|/sd-logo.svg|g' {} \;

echo "Image paths cleaned up successfully."

# Update package.json to remove lovable-tagger
echo "Updating package.json to remove lovable-tagger dependency..."
sed -i '' 's/    "lovable-tagger": "^1.1.7",//' ./package.json

# Update vite.config.ts to remove lovable-tagger import and usage
echo "Updating vite.config.ts to remove lovable-tagger..."
sed -i '' 's/import { componentTagger } from "lovable-tagger";//' ./vite.config.ts
sed -i '' 's/    mode === '\''development'\'' &&\n    componentTagger(),//' ./vite.config.ts

echo "Dependency cleanup completed successfully."
echo "All cleanup tasks completed!"
