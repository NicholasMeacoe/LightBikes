#!/bin/bash
cd public
echo "Starting LightBikes on http://localhost:8000"
python3 -m http.server 8000
