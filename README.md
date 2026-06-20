# Polymath Engine — Second Brain for Real Life

**USAII Global AI Hackathon 2026 · College/Undergraduate Track · Challenge Brief 3: Productivity**

An AI-powered knowledge synthesis tool that transforms scattered daily inputs into connected visual mind maps, sharper decisions, and the right support exactly when needed.

**$0 total cost. Fully local AI. No paid APIs.**

---

## Prerequisites — What to Download

### 1. Node.js (v18 or newer)
- **Download:** https://nodejs.org/en/download
- Pick the LTS version for your OS (Windows/Mac/Linux)
- Verify: `node --version` should show v18+

### 2. Ollama (local LLM runner)
- **Download:** https://ollama.com/download
- Windows: download the installer
- Mac: `brew install ollama` or download from site
- Linux: `curl -fsSL https://ollama.com/install.sh | sh`
- Verify: `ollama --version`

### 3. Neo4j AuraDB Free Tier (cloud graph database)
- **Sign up:** https://console.neo4j.io
- Create a free instance (no credit card needed)
- Save the connection URI, username, and password — you'll need them for `.env.local`
- Free tier: 200k nodes, 400k relationships, pauses after 30 days idle

### 4. FFmpeg (for video frame extraction)
- **Download:** https://ffmpeg.org/download.html
- Windows: download from https://www.gyan.dev/ffmpeg/builds/ → extract, add to PATH
- Mac: `brew install ffmpeg`
- Linux: `sudo apt install ffmpeg`
- Verify: `ffmpeg -version`

### 5. Git (optional but recommended)
- **Download:** https://git-scm.com/downloads

---

## Setup — Step by Step

### Step 1: Pull the AI models (one-time, ~5 min)
```bash
ollama pull llama3.1
ollama pull llava
ollama pull nomic-embed-text
```

### Step 2: Start Ollama (keep this running)
```bash
ollama serve
```
This runs on http://localhost:11434. Leave this terminal open.

### Step 3: Install dependencies
```bash
cd polymath-hackathon
npm install
```

### Step 4: Configure environment
```bash
cp .env.local.example .env.local
```
Edit `.env.local` with your Neo4j AuraDB credentials:
```
NEO4J_URI=neo4j+s://xxxxxxxx.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=your-password-from-aura
OLLAMA_BASE_URL=http://localhost:11434/v1
```

### Step 5: Run the app
```bash
npm run dev
```
Open http://localhost:3000

---

## Project Structure

```
polymath-hackathon/
├── app/
│   ├── api/
│   │   ├── ingest/route.ts          ← IngestAgent (text/image/docx → concept)
│   │   ├── ingest-video/route.ts    ← Video frame extraction → ingest
│   │   ├── domain/[id]/route.ts     ← DomainAgent (position in map)
│   │   ├── link/route.ts            ← LinkerAgent (cross-domain bridges)
│   │   ├── critic/route.ts          ← CriticAgent (SWOT + premortem)
│   │   ├── question/route.ts        ← QuestionerAgent (Socratic + forcing)
│   │   └── scenario/route.ts        ← ScenarioAgent (Decision Weather Report)
│   ├── layout.tsx                   ← Root layout with sidebar nav
│   ├── page.tsx                     ← Dashboard (mind map overview)
│   ├── ingest/page.tsx              ← Upload screen
│   ├── sketch/page.tsx              ← "Draw before AI reveals" (Excalidraw)
│   ├── decision/page.tsx            ← Decision lab (critic + scenario)
│   └── community/page.tsx           ← Community map (mocked, static)
├── components/
│   ├── mindmap.tsx                  ← React Flow knowledge graph
│   ├── sketch-canvas.tsx            ← Excalidraw wrapper
│   ├── decision-chart.tsx           ← Recharts 3-horizon visualization
│   ├── ingest-form.tsx              ← Multimodal upload form
│   └── critic-report.tsx            ← SWOT + premortem display
├── lib/
│   ├── ai.ts                       ← Ollama client (all agents)
│   ├── neo4j.ts                    ← Graph DB operations
│   ├── embeddings.ts               ← nomic-embed-text vectors
│   ├── whisper.ts                  ← Local speech-to-text
│   ├── fsrs.ts                     ← Spaced repetition
│   ├── anonymize.ts                ← Location fuzzing + age gates
│   ├── causal-graph.ts             ← Hardcoded weighted life variables
│   └── prompts.ts                  ← Every agent's system prompt
├── .env.local.example
├── package.json
└── README.md
```

---

## Architecture — Three Rings

### Ring 1: Real-Time Agent Swarm (BUILT)
IngestAgent → DomainAgent → LinkerAgent → QuestionerAgent (sequential, on every upload)
CriticAgent + ScenarioAgent (parallel, on-demand for decisions)

### Ring 2: Causal Graph Simulation (BUILT, simplified)
Hardcoded weighted nodes (gym, energy, sleep, stress, project_time, skill_decay, social, academics)
propagate() function traces effects through edges → feeds ScenarioAgent

### Ring 3: Self-Improving Meta Layer (ROADMAP ONLY)
MetaAgent + Evaluator — needs hundreds of real user sessions, shown as future-vision slide

---

## Tech Stack — $0 Cost

| Layer | Tool | Cost |
|-------|------|------|
| Framework | Next.js 14, App Router | Free |
| LLM (text) | Ollama + llama3.1 | Free, local |
| LLM (vision) | Ollama + llava | Free, local |
| Embeddings | Ollama + nomic-embed-text | Free, local |
| Graph + Vector DB | Neo4j AuraDB free tier | Free |
| Mind map | React Flow | Free |
| Sketch canvas | Excalidraw | Free |
| OCR | Tesseract.js | Free |
| Voice-to-text | transformers.js (whisper-base) | Free, local |
| Video frames | fluent-ffmpeg | Free |
| Word docs | Mammoth.js | Free |
| Spaced repetition | ts-fsrs | Free |
| Decision viz | Recharts | Free |

---

## Demo Script (3-5 min video)

1. **Feed input** (30s): Upload a text note about CS decomposition + a photo of a whiteboard diagram
2. **Watch the map** (30s): Show the mind map updating with a new node and domain connection
3. **Sketch first** (45s): Draw a rough connection diagram, then reveal what the AI found that you missed
4. **Decision lab** (60s): Type "Should I skip gym for the project?" — show the critic report + 3-branch forecast
5. **Community** (30s): Show the mocked map, explain knowledge-overlap matching and safety gates
6. **Architecture** (30s): Quick slide showing the three rings, two agent flows, one shared substrate

---

## Responsible AI

- **Risk:** Geospatial weaponization — malicious actors exploiting location-based avatar map
- **Mitigations:** Location fuzzed to ~1km zones, sharing opt-in + time-limited, minors age-gated with parental portal, behavioral pattern detection → human review, AI never acts alone on safety decisions
- **Gamification:** Fixed-increment mastery, NO variable-ratio rewards, NO randomness — every threshold visible in advance
- **Human-in-the-loop:** Mental health signals → trained human responder, minor connections → guardian approval, AI recommends but user always decides
