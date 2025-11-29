# 🚀 Quick Start Guide

Get your Voice Game Master running in 5 minutes!

## 📋 Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] Python 3.11+ installed
- [ ] pnpm installed (`npm install -g pnpm`)
- [ ] LiveKit account created
- [ ] Murf.ai API key obtained
- [ ] OpenAI API key obtained

## ⚡ Fast Setup

### 1. Clone & Navigate
```bash
git clone https://github.com/GhanshyamJha05/Eighth_task_murf_ai.git
cd Eighth_task_murf_ai/ten-days-of-voice-agents-2025
```

### 2. Backend Setup (2 minutes)
```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# Mac/Linux
source .venv/bin/activate

# Install dependencies
pip install -e .
```

### 3. Configure Backend Environment
Create `backend/.env.local`:
```env
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=APIxxxxxxxxx
LIVEKIT_API_SECRET=xxxxxxxxxxxxxxxxx
MURF_API_KEY=your-murf-api-key
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxx
```

### 4. Frontend Setup (1 minute)
```bash
cd ../frontend
pnpm install
```

### 5. Configure Frontend Environment
Create `frontend/.env.local`:
```env
LIVEKIT_API_KEY=APIxxxxxxxxx
LIVEKIT_API_SECRET=xxxxxxxxxxxxxxxxx
LIVEKIT_URL=https://your-project.livekit.cloud
```

### 6. Run Everything (3 terminals)

**Terminal 1 - LiveKit Server:**
```bash
cd ten-days-of-voice-agents-2025
.\livekit-server.exe --dev
```

**Terminal 2 - Backend:**
```bash
cd backend
.venv\Scripts\activate
python src/agent.py dev
```

**Terminal 3 - Frontend:**
```bash
cd frontend
pnpm dev
```

### 7. Open & Play! 🎮
Navigate to [http://localhost:3000](http://localhost:3000)

## 🔑 Getting API Keys

### LiveKit (Free)
1. Go to [livekit.io](https://livekit.io)
2. Sign up for free
3. Create a new project
4. Copy API Key and Secret from Settings

### Murf.ai
1. Visit [murf.ai](https://murf.ai)
2. Sign up and get API key
3. Use Falcon model for fastest response

### OpenAI
1. Go to [platform.openai.com](https://platform.openai.com)
2. Create API key
3. Add credits to your account

## 🎮 First Commands to Try

Once connected, try saying:
- "Start the adventure"
- "I look around"
- "Roll for perception"
- "Check my inventory"
- "I attack the enemy"

## ❓ Troubleshooting

### Backend won't start
- Check Python version: `python --version` (should be 3.11+)
- Verify virtual environment is activated
- Check all API keys are correct

### Frontend won't start
- Check Node version: `node --version` (should be 18+)
- Try: `pnpm install --force`
- Clear cache: `rm -rf .next`

### No voice response
- Verify Murf.ai API key is valid
- Check LiveKit server is running
- Ensure microphone permissions are granted

### Connection issues
- Verify all three services are running
- Check LiveKit URL format (wss:// for backend, https:// for frontend)
- Try restarting all services

## 📚 Next Steps

- Customize your character in `shared-data/game_state.json`
- Modify game behavior in `backend/src/agent.py`
- Adjust UI colors in `frontend/styles/globals.css`

## 💬 Need Help?

Open an issue on [GitHub](https://github.com/GhanshyamJha05/Eighth_task_murf_ai/issues)

---

Happy adventuring! ⚔️🎲
