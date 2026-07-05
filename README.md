# Abstra

> **Multi-Workspace AI Document Assistant**

A production-ready Retrieval-Augmented Generation (RAG) platform that
enables secure, workspace-isolated document intelligence with AI-powered
chat, grounded document retrieval, and validated AI tool calling.

---

## Overview

Abstra is a full-stack AI document assistant that enables users to
organize documents into isolated workspaces, upload and index knowledge
bases, and interact with an AI assistant capable of answering questions
grounded in uploaded content.

Each workspace maintains complete logical isolation while sharing a
single vector store. Responses are generated using Retrieval-Augmented
Generation (RAG), cite uploaded documents where appropriate, and support
AI tool calling for actions such as task creation and notifications.

## Features

- Secure authentication with Supabase Auth
- Multi-workspace architecture
- PDF document upload and ingestion
- Intelligent chunking and vector embeddings
- Gemini-powered RAG chat
- Source citations
- AI tool calling with backend validation
- Workspace task management
- Dashboard with chat, documents, and tool history
- Modern responsive UI
- Dark mode interface

## Tech Stack

### Frontend

- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS
- shadcn/ui

### Backend

- Next.js Route Handlers
- Server Actions

### Database

- Supabase PostgreSQL
- pgvector
- Row Level Security (RLS)

### AI

- Google Gemini Flash
- Gemini Embeddings

### Deployment

- Vercel

---

# Getting Started

## Prerequisites

- Node.js 20+
- npm
- Supabase Project
- Google AI Studio API Key
- Discord Webhook (optional)

## Installation

```bash
git clone https://github.com/YOUR_USERNAME/abstra.git
cd abstra
npm install
cp .env.example .env.local
npm run dev
```

Open:

    http://localhost:3000

---

# Environment Variables

Create `.env.local` using the following template.

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
DISCORD_WEBHOOK_URL=
```

## .env.example

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GEMINI_API_KEY=your_gemini_api_key
DISCORD_WEBHOOK_URL=your_discord_webhook_url
```

---

# Deployment

The application is deployed on **Vercel**.

Deployment steps:

1.  Push the repository to GitHub.
2.  Import the repository into Vercel.
3.  Configure all environment variables.
4.  Deploy.
5.  Verify authentication, uploads, retrieval, and AI tool execution.

---

# Project Structure

```text
app/
components/
actions/
lib/
hooks/
types/
public/
docs/
```

---

# AI Workflow

This project follows a distributed AI engineering workflow.

Agent Responsibility

---

Claude Architecture, planning, reviews, documentation
GitHub Copilot Agent Repository-aware implementation
GitHub Copilot Boilerplate and autocomplete
Gemini Demo content and sample data
Human Developer Engineering decisions, testing and deployment

Additional documentation:

- README.md
- CLAUDE.md
- AGENTS.md
- AI_NOTES.md

---

# Testing

Recommended validation:

- Authentication
- Workspace creation
- Workspace switching
- Document upload
- RAG retrieval
- Citation generation
- "I don't know" fallback
- Tool calling
- Responsive UI
- Production build

---

# License

MIT License

---

# Acknowledgements

Built with Next.js, Supabase, PostgreSQL, pgvector, Google Gemini,
Tailwind CSS, shadcn/ui, and Vercel.
