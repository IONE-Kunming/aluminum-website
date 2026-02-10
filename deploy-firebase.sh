#!/bin/bash

# Firebase Deployment Script for Aluminum Website
# This script helps you deploy Firebase configurations for chat, orders, and invoices functionality

set -e  # Exit on error

echo "================================================"
echo "Firebase Deployment Script"
echo "Aluminum Website - Chat, Orders, Invoices"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Firebase CLI is installed
echo -e "${BLUE}Checking Firebase CLI...${NC}"
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}✗ Firebase CLI is not installed${NC}"
    echo ""
    echo "Please install Firebase CLI:"
    echo "  npm install -g firebase-tools"
    echo ""
    exit 1
fi
echo -e "${GREEN}✓ Firebase CLI is installed${NC}"
echo ""

# Check if user is logged in
echo -e "${BLUE}Checking Firebase authentication...${NC}"
if ! firebase projects:list &> /dev/null; then
    echo -e "${RED}✗ Not logged in to Firebase${NC}"
    echo ""
    echo "Please login to Firebase:"
    echo "  firebase login"
    echo ""
    exit 1
fi
echo -e "${GREEN}✓ Logged in to Firebase${NC}"
echo ""

# Display current project
echo -e "${BLUE}Current Firebase project:${NC}"
firebase use
echo ""

# Ask what to deploy
echo -e "${YELLOW}What would you like to deploy?${NC}"
echo ""
echo "  1) Everything (Firestore rules + indexes + Storage rules + Hosting)"
echo "  2) Firestore only (rules + indexes)"
echo "  3) Firestore rules only"
echo "  4) Firestore indexes only"
echo "  5) Storage rules only"
echo "  6) Hosting only (website)"
echo "  7) Exit"
echo ""
read -p "Enter your choice (1-7): " choice

case $choice in
    1)
        echo ""
        echo -e "${BLUE}Deploying everything...${NC}"
        firebase deploy
        ;;
    2)
        echo ""
        echo -e "${BLUE}Deploying Firestore (rules + indexes)...${NC}"
        firebase deploy --only firestore
        ;;
    3)
        echo ""
        echo -e "${BLUE}Deploying Firestore security rules...${NC}"
        firebase deploy --only firestore:rules
        ;;
    4)
        echo ""
        echo -e "${BLUE}Deploying Firestore indexes...${NC}"
        firebase deploy --only firestore:indexes
        ;;
    5)
        echo ""
        echo -e "${BLUE}Deploying Storage rules...${NC}"
        firebase deploy --only storage
        ;;
    6)
        echo ""
        echo -e "${BLUE}Building and deploying website...${NC}"
        npm run build
        firebase deploy --only hosting
        ;;
    7)
        echo ""
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo ""
        echo -e "${RED}Invalid choice. Exiting...${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}✓ Deployment completed successfully!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""

# Check if indexes were deployed
if [[ $choice == "1" || $choice == "2" || $choice == "4" ]]; then
    echo -e "${YELLOW}⚠ IMPORTANT: Firestore indexes are building${NC}"
    echo ""
    echo "Firestore needs time to build the deployed indexes."
    echo "This can take 5-15 minutes depending on data size."
    echo ""
    echo "To check index status:"
    echo "  1. Go to: https://console.firebase.google.com/"
    echo "  2. Select your project"
    echo "  3. Navigate to: Firestore Database → Indexes"
    echo "  4. Wait until all indexes show 'Enabled' status"
    echo ""
fi

echo -e "${BLUE}Next steps:${NC}"
echo ""
echo "1. Verify deployment in Firebase Console:"
echo "   https://console.firebase.google.com/"
echo ""
echo "2. Test your application:"
echo "   - Chat functionality (send messages, upload files)"
echo "   - Orders (place orders, view order history)"
echo "   - Invoices (view invoices, mark as paid)"
echo ""
echo "3. Read the verification guide:"
echo "   cat FIREBASE_VERIFICATION.md"
echo ""
echo -e "${GREEN}Done!${NC}"
