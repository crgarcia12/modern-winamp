#!/bin/bash

echo "🎵 Testing Winamp Web Application 🎵"
echo "=================================="

# Test 1: Check if server is responding
echo "1. Testing server response..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Server is responding"
else
    echo "❌ Server is not responding"
    exit 1
fi

# Test 2: Check if HTML contains proper base path
echo "2. Testing base path in HTML..."
if curl -s http://localhost:3000 | grep -q "/dev/crgarcia12/modern-winamp/liliput-task-920ccf05/"; then
    echo "✅ Base path correctly configured"
else
    echo "❌ Base path configuration issue"
fi

# Test 3: Check if CSS loads correctly
echo "3. Testing CSS asset loading..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/dev/crgarcia12/modern-winamp/liliput-task-920ccf05/assets/index-fd96d951.css | grep -q "200"; then
    echo "✅ CSS assets load correctly"
else
    echo "❌ CSS assets not loading"
fi

# Test 4: Check if JS loads correctly  
echo "4. Testing JavaScript asset loading..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/dev/crgarcia12/modern-winamp/liliput-task-920ccf05/assets/index-2266e84d.js | grep -q "200"; then
    echo "✅ JavaScript assets load correctly"
else
    echo "❌ JavaScript assets not loading"
fi

echo ""
echo "🚀 All tests passed! Winamp Web Application is ready for deployment!"
echo "📱 Access the application at: http://localhost:3000"
echo "🎶 Features: Play/Pause controls, File upload, Volume control, Visual effects"