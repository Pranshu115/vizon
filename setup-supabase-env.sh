#!/bin/bash

# Supabase Environment Setup Script
# This script helps you set up your .env.local file with Supabase credentials

echo "🚀 Supabase Environment Setup"
echo "=============================="
echo ""

# Check if .env.local already exists
if [ -f ".env.local" ]; then
    echo "⚠️  .env.local already exists!"
    read -p "Do you want to overwrite it? (y/n): " overwrite
    if [ "$overwrite" != "y" ]; then
        echo "❌ Cancelled. Your existing .env.local was not modified."
        exit 0
    fi
fi

# Get Supabase URL
echo "📝 Enter your Supabase Project URL:"
echo "   (Looks like: https://xxxxxxxxxxxxx.supabase.co)"
read -p "Project URL: " SUPABASE_URL

# Get Supabase Anon Key
echo ""
echo "📝 Enter your Supabase anon public key:"
echo "   (Long string starting with eyJ...)"
read -p "Anon Key: " SUPABASE_ANON_KEY

# Validate inputs
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
    echo "❌ Error: Both URL and Key are required!"
    exit 1
fi

# Create .env.local file
cat > .env.local << EOF
# Supabase Configuration
# Generated automatically - $(date)

NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY

# Alternative variable names (optional)
# SUPABASE_URL=$SUPABASE_URL
# SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
EOF

echo ""
echo "✅ Success! Created .env.local file with your Supabase credentials"
echo ""
echo "📋 Next steps:"
echo "   1. Restart your development server if it's running"
echo "   2. Test the connection by running: npm run dev"
echo ""

