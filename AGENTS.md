# AGENTS.md

# AI Agent Orchestration Guide

## Overview

This project was developed using a structured, multi-agent AI workflow rather than relying on a single coding assistant. Each AI system was assigned a clearly defined responsibility based on its strengths, allowing architectural reasoning, implementation, content generation, validation, and documentation to be handled independently.

The human developer acted as the Engineering Lead, making all final technical decisions while orchestrating collaboration between specialized AI agents.

---

# Development Philosophy

The objective was not to maximize AI-generated code.

Instead, the objective was to maximize engineering quality by:

- separating planning from implementation
- assigning specialized responsibilities to different AI models
- minimizing unnecessary context switching
- reducing token consumption
- validating every AI-generated change before integration
- ensuring all architectural decisions remained consistent throughout the project

---

# AI Organization

```
Human Developer
        │
        ▼
Chief Architect (Claude)
        │
 ┌──────┼──────────────┐
 ▼      ▼              ▼
Repository        Knowledge      Documentation
Engineer          Generator      Reviewer
(Copilot)         (Gemini)       (Claude)
        │
        ▼
Validation Pipeline
        │
        ▼
Human Approval
```

---

# Agent Responsibilities

## 1. Human Developer

Role:
Engineering Lead

Responsibilities

- Define project goals
- Approve architectural decisions
- Review AI outputs
- Test all functionality
- Resolve conflicting AI suggestions
- Manage project scope
- Final deployment

The human developer remains responsible for every line of production code.

---

## 2. Chief Architect

Primary Model

Claude

Purpose

Claude serves as the architectural reasoning engine for the project.

Responsibilities

- System architecture
- RAG workflow design
- Workspace isolation strategy
- Database schema planning
- API design
- Prompt engineering
- Feature planning
- Refactoring strategy
- Documentation planning
- Code reviews
- UI/UX refinement guidance

Claude focuses on high-level reasoning rather than producing large amounts of implementation code.

Deliverables

- Technical specifications
- Architecture documents
- Component designs
- Review reports
- Implementation plans

---

## 3. Repository Engineer

Primary Tool

GitHub Copilot Agent

Purpose

Implement repository-aware code based on predefined specifications.

Responsibilities

- React components
- Next.js routes
- API handlers
- Database integration
- UI implementation
- Component refactoring
- Bug fixes
- Boilerplate generation

Constraints

The Repository Engineer should never redesign architecture.

It implements approved specifications only.

---

## 4. Knowledge Generator

Primary Model

Google Gemini

Purpose

Generate high-volume content that does not require repository context.

Responsibilities

- Sample documents
- Example datasets
- Testing conversations
- Demo content
- Seed data
- Placeholder documentation
- Example prompts

This delegation reduces repository-aware AI usage while improving development efficiency.

---

## 5. Documentation Reviewer

Primary Model

Claude

Responsibilities

- README refinement
- Architecture explanations
- AI workflow documentation
- Technical writing
- Demo preparation
- Release documentation

---

# Validation Pipeline

Every completed implementation passes through the following validation process.

```
Implementation

↓

npm run lint

↓

TypeScript compilation

↓

Production build

↓

Manual testing

↓

Architecture review

↓

Git commit
```

Only validated code is merged into the project.

---

# Agent Communication Protocol

Every feature follows the same workflow.

```
Feature Request

↓

Architecture Planning

↓

Technical Specification

↓

Implementation

↓

Build Verification

↓

Review

↓

Refinement

↓

Manual Testing

↓

Documentation

↓

Release
```

Each stage produces structured outputs for the next stage rather than relying on repeated prompting.

---

# Delegation Strategy

Different AI systems were intentionally selected based on task suitability.

| Task                      | Primary Agent         | Reason                                      |
| ------------------------- | --------------------- | ------------------------------------------- |
| Architecture              | Claude                | Long-context reasoning and system design    |
| Repository implementation | GitHub Copilot        | Repository-aware coding assistance          |
| Boilerplate generation    | GitHub Copilot        | Fast code generation inside project context |
| Demo data                 | Gemini                | High-volume free content generation         |
| Documentation             | Claude                | Technical writing and consistency           |
| Validation                | Local Tooling + Human | Deterministic verification                  |

---

# Token Optimization Strategy

Repository-aware AI interactions are significantly more expensive than standalone generation.

To maximize efficiency:

- Architecture is completed before implementation begins.
- Large implementation tasks are broken into small, well-defined specifications.
- Content generation is delegated to Gemini.
- Boilerplate is generated using GitHub Copilot.
- Claude is reserved for reasoning-intensive tasks.
- Validation relies on local tooling whenever possible.

This minimizes unnecessary AI interactions while maintaining implementation quality.

---

# Human Decision Points

The following decisions always require human approval.

- Architecture changes
- Database schema changes
- Security-related changes
- Authentication logic
- Prompt modifications
- Production deployment
- Documentation sign-off

AI may recommend changes but never autonomously make these decisions.

---

# Engineering Principles

All agents follow these principles.

1. Preserve workspace isolation.
2. Never expose secrets.
3. Keep components modular.
4. Prefer server-side logic.
5. Maintain strong typing.
6. Validate all tool calls.
7. Prevent prompt injection.
8. Prioritize readability over cleverness.
9. Keep documentation synchronized with implementation.
10. Optimize for maintainability rather than shortest code.

---

# Definition of Success

The AI workflow is considered successful when:

- Architecture remains consistent across the project.
- AI-generated code integrates cleanly.
- Every feature is validated before release.
- Documentation accurately reflects implementation.
- Human oversight is maintained throughout development.

The objective of this workflow is not to replace software engineering, but to augment it through structured AI collaboration.
