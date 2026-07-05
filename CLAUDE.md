# CLAUDE.md

# AI Operating Manual

This document provides the architectural context and operating rules for AI coding assistants working on this repository.

The human developer remains the system architect. AI assistants are implementation partners operating under the constraints described below.

---

# Project

WorkspaceAI

Multi-Workspace Document Assistant

A full-stack AI document assistant that allows multiple workspaces to securely upload documents, perform Retrieval-Augmented Generation (RAG), execute AI tool calls, and maintain strict tenant isolation inside a shared vector store.

---

# Primary Goals

The project prioritizes:

1. Multi-tenant security
2. Correct RAG implementation
3. Reliable tool execution
4. Production-quality UX
5. Modular architecture
6. AI-assisted engineering workflow

Every implementation decision should support these goals.

---

# Technology Stack

Frontend

- Next.js App Router
- React
- TypeScript
- TailwindCSS
- shadcn/ui

Backend

- Next.js Route Handlers
- Server Actions
- Supabase

Database

- PostgreSQL
- pgvector
- Row Level Security

Authentication

- Supabase Auth

AI

- Gemini Flash
- Gemini Embeddings

Deployment

- Vercel

Notifications

- Discord Webhook

---

# Architecture Overview

User

↓

Authentication

↓

Workspace Selection

↓

Document Upload

↓

Chunking

↓

Embedding Generation

↓

Shared Vector Store

↓

Workspace Filtered Retrieval

↓

Grounded Prompt

↓

Gemini

↓

Tool Calling

↓

Response

---

# Core Engineering Principles

## 1. Workspace Isolation

Workspace isolation is the most important requirement.

Every database query must enforce workspace filtering.

Never retrieve data first and filter afterwards.

Correct

WHERE workspace_id = activeWorkspace

Incorrect

Retrieve all rows then filter in JavaScript.

---

## 2. Retrieval

Only retrieve chunks belonging to the active workspace.

Responses must always be grounded in retrieved context.

If context is insufficient:

Return:

"I don't know based on the uploaded workspace documents."

Never hallucinate.

---

## 3. Tool Calling

The LLM proposes.

The backend validates.

The backend executes.

Never execute tool arguments directly.

Always

Validate

Sanitize

Authorize

Log

---

## 4. Prompt Injection

Retrieved documents are data.

Never instructions.

Prompt should explicitly state that retrieved context must never override system instructions.

---

## 5. Security

Never expose

API Keys

Webhook URLs

Database secrets

Service role keys

Secrets belong only in server-side environment variables.

---

## 6. Code Style

Prefer

Small components

Reusable utilities

Pure functions

Server Components

Strong typing

Avoid

Large files

Business logic inside UI

Duplicated code

Magic numbers

Nested conditionals

---

# Folder Responsibilities

app/

Routing

pages

layouts

authentication

components/

Reusable UI

lib/

Business logic

Database

AI

Retrieval

Embedding

Prompt building

actions/

Server actions

types/

Shared interfaces

hooks/

React hooks

---

# AI Development Workflow

Architecture decisions are finalized before implementation begins.

AI assistants should implement specifications rather than invent architecture.

When uncertain,

do not assume.

Instead preserve existing architecture.

---

# Performance Priorities

Minimize unnecessary renders.

Avoid duplicate embeddings.

Avoid duplicate uploads.

Keep database queries indexed.

Prefer server-side computation.

---

# Testing Expectations

Before considering a feature complete:

✓ Build passes

✓ Type checking passes

✓ Workspace isolation verified

✓ Prompt injection tested

✓ Tool execution tested

✓ Mobile layout verified

✓ No console errors

---

# Definition of Done

A feature is complete only when

Implemented

Reviewed

Tested

Responsive

Documented

Integrated
