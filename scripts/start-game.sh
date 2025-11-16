#!/bin/bash
# LightBikes Game Launcher

echo "🏍️  LightBikes Game Launcher"
echo "=============================="
echo ""

# Check if bundle.js exists
if [ ! -f "bundle.js" ]; then
    echo "⚠️  bundle.js not found. Building..."
    npm run build
    if [ $? -ne 0 ]; then
        echo "❌ Build failed. Please run 'npm run build' manually."
        exit 1
    fi
    echo "✅ Build complete!"
    echo ""
fi

# Get IP address
IP=$(hostname -I | awk '{print $1}')

echo "🌐 Starting HTTP server..."
echo ""
echo "📍 Access the game at:"
echo "   Local:   http://localhost:8000"
echo "   Network: http://$IP:8000"
echo "   mDNS:    http://$(hostname).local:8000"
echo ""
echo "🎮 Controls:"
echo "   Arrow Keys - Move your bike"
echo "   R - Restart"
echo "   P - Pause"
echo ""
echo "Press Ctrl+C to stop the server"
echo "=============================="
echo ""

# Start Python HTTP server
python3 -m http.server 8000
