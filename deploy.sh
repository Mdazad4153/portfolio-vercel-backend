#!/bin/bash

# Portfolio Backend - Quick Deploy Script
# This script helps you deploy your backend quickly

echo "🚀 Portfolio Backend Deployment Helper"
echo "======================================="
echo ""

# Check if vercel is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found!"
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

echo "✅ Vercel CLI found!"
echo ""

# Check for .env file
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found!"
    echo "📋 Please create .env file with your configuration"
    echo ""
    echo "Required variables:"
    echo "  - SUPABASE_URL"
    echo "  - SUPABASE_SERVICE_KEY"
    echo "  - JWT_SECRET"
    echo "  - ADMIN_EMAIL"
    echo "  - ADMIN_PASSWORD"
    echo ""
    exit 1
fi

echo "✅ .env file found!"
echo ""

# Ask user which deployment type
echo "Select deployment type:"
echo "  1) Preview deployment (test)"
echo "  2) Production deployment"
echo ""
read -p "Enter choice (1 or 2): " choice

if [ "$choice" = "1" ]; then
    echo ""
    echo "🔨 Deploying preview..."
    vercel
elif [ "$choice" = "2" ]; then
    echo ""
    echo "🚀 Deploying to production..."
    vercel --prod
else
    echo "❌ Invalid choice!"
    exit 1
fi

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next Steps:"
echo "  1. Copy the deployment URL"
echo "  2. Update frontend API URL in:"
echo "     - frontend/js/admin.js"
echo "     - frontend/js/app.js"
echo "  3. Test your deployment"
echo ""
echo "🎉 Happy coding!"
