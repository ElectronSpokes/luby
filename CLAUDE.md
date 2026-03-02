# CLAUDE.md - Luby

> Part of the Northernlights Network — Vitality Wellness Companion

## Overview

**Luby** is a health and wellness companion satellite. It provides AI-powered food logging, hydration tracking, movement monitoring, and fasting management through a React frontend with Gemini AI integration.

## Quick Start

```bash
npm install
npm run dev    # Starts on port 3000
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4 |
| AI | Google Gemini (via @google/genai) |
| Charts | Recharts |
| Animation | Motion (Framer Motion) |
| Icons | Lucide React |

## Project Structure

```
/opt/luby/
├── src/                     # Source code
│   ├── App.tsx              # Main app with all views
│   ├── types.ts             # TypeScript types
│   ├── components/          # Feature components
│   │   ├── AIAssistant.tsx  # AI chat assistant
│   │   ├── FoodScanner.tsx  # Camera food scanning
│   │   ├── MenuPlanner.tsx  # Meal planning
│   │   └── Recipes.tsx      # Recipe suggestions
│   └── lib/utils.ts         # Utilities
├── config-env/              # Environment files
│   └── vault.env            # Vault AppRole credentials
├── .northernlights/         # Hub MCP integration
└── .claude/rules/           # Claude guidelines
```

## Environment

- **Host**: luby (10.0.110.27)
- **Hub**: northernlights-hub (10.0.100.11:3100)
- **Project ID**: 197e53b7-eef0-44af-930f-f4d065d0dd2a
- **Gitea**: http://git.theflux.life:3000/halinova/luby

## Workflow Commands

| Command | Purpose |
|---------|---------|
| `/springboard` | Start work session |
| `/compound` | Capture learnings |
| `/implement` | Implement from tasks |

## Key Notes

- Gemini API key required: set `GEMINI_API_KEY` in `.env.local`
- Camera permissions needed for FoodScanner
- All data currently client-side (localStorage)

## Detailed Guidelines

See the rules files:
- @.claude/rules/common-mistakes.md
- @.claude/rules/patterns.md
- @.claude/rules/decisions.md
- @.claude/rules/hub-integration.md

## Critical Reminders

**Hub API uses X-Hub-Key header**, not X-API-Key.

**Test API responses with curl** before building frontend:
```bash
curl endpoint | jq .
```
