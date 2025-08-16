#!/bin/bash

# Build script for Netlify deployment
echo "🔧 Building for Netlify deployment..."

# Type check
echo "📝 Running TypeScript checks..."
npx tsc --noEmit

# Build the frontend
echo "🎨 Building frontend..."
npx vite build

echo "✅ Build completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Create a new Netlify site"
echo "2. Connect your repository"
echo "3. Set build command: 'chmod +x ./build-netlify.sh && ./build-netlify.sh'"
echo "4. Set publish directory: 'dist/public'"
echo "5. Add environment variable: MONGODB_URI"
echo "6. Deploy!"