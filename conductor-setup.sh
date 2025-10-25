#!/bin/bash
set -e

echo "🚀 Setting up workspace..."

# Check for Bun
if ! command -v bun &> /dev/null; then
    echo "❌ Error: Bun is not installed. Please install Bun first: https://bun.sh"
    exit 1
fi

echo "✓ Bun found: $(bun --version)"

# Install dependencies
echo "📦 Installing dependencies..."
bun install

# Check for .env file in root
if [ -n "$CONDUCTOR_ROOT_PATH" ] && [ -f "$CONDUCTOR_ROOT_PATH/.env" ]; then
    echo "📝 Copying .env file from root..."
    cp "$CONDUCTOR_ROOT_PATH/.env" apps/web/.env
    echo "✓ Environment variables copied"
else
    echo "⚠️  Warning: No .env file found in root. You may need to set up environment variables manually."
    echo "   Expected location: $CONDUCTOR_ROOT_PATH/.env"
fi

# Run database migrations
echo "🗄️  Running database migrations..."
if bun run db:migrate; then
    echo "✓ Database migrations completed"
else
    echo "⚠️  Warning: Database migrations failed. You may need to set up the database manually."
fi

echo "✅ Workspace setup complete!"
echo "   Run 'bun run dev:web' to start the development server"
