#!/bin/bash

# Firebase Deployment Script for IONE Aluminum Website
# This script automates the build and deployment process

set -e  # Exit on error

echo "🚀 Starting deployment process..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
else
    echo "✓ Dependencies already installed"
fi

# Build the project
echo "🔨 Building the project..."
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    echo "❌ Build failed - dist folder not found"
    exit 1
fi

echo "✓ Build completed successfully"

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Installing..."
    npm install -g firebase-tools
fi

# Check if user is logged in to Firebase
echo "🔑 Checking Firebase authentication..."
firebase login:list &> /dev/null || {
    echo "Please login to Firebase:"
    firebase login
}

echo "✓ Firebase authentication verified"

# Deploy to Firebase
echo "🚀 Deploying to Firebase Hosting..."
firebase deploy --only hosting

echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "🌐 Your website should now be live at:"
echo "   https://gen-lang-client-0988357303.web.app"
echo "   https://gen-lang-client-0988357303.firebaseapp.com"
echo ""
echo "💡 To deploy security rules as well, run:"
echo "   firebase deploy"
echo ""
