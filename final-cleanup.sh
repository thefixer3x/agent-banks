#!/bin/zsh

echo "Running final cleanup script for SD-Ghost-Protocol..."

# Remove lovable-uploads directory if it exists
if [ -d "public/lovable-uploads" ]; then
    echo "Removing lovable-uploads directory..."
    rm -rf public/lovable-uploads
    echo "✅ Removed lovable-uploads directory"
else
    echo "✓ lovable-uploads directory not found (already removed)"
fi

# Check for any remaining references to lovable in the codebase
echo "Checking for any remaining references to 'lovable'..."
grep -r --include="*.{ts,tsx,js,jsx,json,html,md}" "lovable" ./src ./public ./supabase

echo "Checking for any remaining console.log statements..."
grep -r --include="*.{ts,tsx,js,jsx}" "console\.log" ./src ./supabase

echo "Checking for any remaining 'mock' or 'placeholder' references..."
grep -r --include="*.{ts,tsx,js,jsx}" -E "(mock|placeholder)" ./src ./supabase

echo "Final cleanup completed!"
