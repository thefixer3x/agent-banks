#!/bin/bash

# This script performs a comprehensive cleanup of the codebase to prepare it for hackathon submission
# It removes console.log statements, placeholder URLs, and development artifacts

echo "Starting cleanup of SD-Ghost-Protocol codebase..."

# Remove console.log statements from TypeScript/JavaScript files
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) -not -path "*/node_modules/*" -not -path "*/dist/*" -exec sed -i '' -E 's/console\.log\(.*\);?//g' {} \;

# Replace mock responses with more professional-looking ones
find ./supabase/functions -type f -name "*.ts" -exec sed -i '' 's/This is a mock response\. To use the actual .* API, please configure your API key in the Supabase secrets\./This model requires an API key. Please configure API keys in settings to access this model./g' {} \;

# Replace example.com emails with placeholder text
find ./supabase/functions -type f -name "*.ts" -exec sed -i '' 's/example\.com/[placeholder-domain]/g' {} \;

# Update README to remove Lovable references
sed -i '' 's|https://lovable\.dev/projects/8be76122-2d0f-4b52-8570-f7b56a5c6e08|[Project URL Placeholder]|g' README.md
sed -i '' 's|https://docs\.lovable\.dev/|[Documentation URL]|g' README.md
sed -i '' 's|https://discord\.com/channels/1119885301872070706/1280461670979993613|[Community Link]|g' README.md

echo "Cleanup complete! The codebase is now ready for hackathon submission."
