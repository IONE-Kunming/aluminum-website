#!/bin/bash

# Update Firebase Service Account Secret
# This script helps update the FIREBASE_SERVICE_ACCOUNT secret in GitHub

set -e

echo "🔐 Firebase Service Account Secret Update Script"
echo "=================================================="
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed."
    echo "Please install it from: https://cli.github.com/"
    exit 1
fi

# Check if user is authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ You are not authenticated with GitHub CLI."
    echo "Please run: gh auth login"
    exit 1
fi

echo "✅ GitHub CLI is installed and authenticated"
echo ""

# Prompt for service account file
read -p "📄 Enter the path to your service account JSON file: " SA_FILE

if [ ! -f "$SA_FILE" ]; then
    echo "❌ File not found: $SA_FILE"
    exit 1
fi

# Validate JSON
if ! jq empty "$SA_FILE" 2>/dev/null; then
    echo "❌ Invalid JSON file. Please check the file format."
    exit 1
fi

echo "✅ Service account file is valid JSON"
echo ""

# Confirm before updating
echo "⚠️  This will update the FIREBASE_SERVICE_ACCOUNT secret for:"
echo "   Repository: IONE-Kunming/aluminum-website"
echo ""
read -p "Do you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "❌ Cancelled by user"
    exit 0
fi

echo ""
echo "🚀 Updating GitHub Secret..."

# Update the secret
if gh secret set FIREBASE_SERVICE_ACCOUNT --repo IONE-Kunming/aluminum-website < "$SA_FILE"; then
    echo "✅ Secret updated successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "1. The secret is now available for GitHub Actions"
    echo "2. For Codespaces, also set it at: https://github.com/settings/codespaces"
    echo "3. Test the workflows in the Actions tab"
    echo ""
    echo "🔒 Security reminder: Delete the local service account file if no longer needed"
else
    echo "❌ Failed to update secret. Please check your permissions."
    exit 1
fi
