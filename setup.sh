#!/bin/bash

# SamayGen Setup Script
echo "🚀 Setting up SamayGen - Academic Timetable Generator"
echo "=================================================="

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16 or higher."
    exit 1
fi

echo "✅ Prerequisites check passed!"

# Setup Backend
echo ""
echo "📦 Setting up backend..."
cd backend

if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

echo "Activating virtual environment..."
source venv/bin/activate

echo "Installing Python dependencies..."
pip install -r requirements.txt

echo "✅ Backend setup complete!"

# Setup Frontend
echo ""
echo "📦 Setting up frontend..."
cd ../frontend

echo "Installing Node.js dependencies..."
npm install

echo "✅ Frontend setup complete!"

echo ""
echo "🎉 Setup complete! You can now run SamayGen:"
echo ""
echo "Backend (Terminal 1):"
echo "  cd backend && source venv/bin/activate && python -m app.main"
echo ""
echo "Frontend (Terminal 2):"
echo "  cd frontend && ng serve"
echo ""
echo "🌐 Access the application at: http://localhost:4200"
echo "📚 API documentation available at: http://localhost:8000/docs"
