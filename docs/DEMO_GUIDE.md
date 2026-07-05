# DEMO_GUIDE.md

# Abstra Demo & Recording Guide

## Purpose

This document outlines the recommended demo flow, sample data, test scenarios, and recording script for showcasing Abstra. Following this guide ensures all major features are demonstrated in a logical, repeatable manner.

---

# Demo Duration

**Target Length:** 8–10 minutes

---

# Pre-Demo Checklist

Before recording, verify:

- Application builds successfully (`npm run build`)
- Development server starts without errors
- Environment variables are configured
- Authentication is working
- AI responses are operational
- Discord webhook (if enabled) is functional
- Sample workspaces are populated
- Browser cache is cleared
- Notifications are disabled (optional)

---

# Demo Account

Use a dedicated demo account.

Email:

```text
demo@example.com
```

Password:

```text
********
```

Do not use personal accounts during recording.

---

# Sample Workspaces

Create at least three workspaces.

## 1. Software Engineering

Contains:

- Software Requirements Specification
- API Documentation
- System Architecture Notes
- Sprint Planning Document

Purpose:

Demonstrates technical documentation retrieval.

---

## 2. University

Contains:

- Lecture Notes
- Assignment Brief
- Research Paper
- Project Proposal

Purpose:

Demonstrates educational document retrieval.

---

## 3. Company Handbook

Contains:

- Employee Handbook
- Leave Policy
- Remote Work Policy
- Security Guidelines

Purpose:

Demonstrates policy-based question answering.

---

# Demo Flow

## 1. Introduction (30–45 seconds)

Introduce:

- Project name
- Purpose
- Technologies used
- High-level architecture

---

## 2. Authentication (30 seconds)

Demonstrate:

- Login
- Protected routes
- Dashboard access

---

## 3. Workspace Management (45 seconds)

Show:

- Existing workspaces
- Switching between workspaces
- Independent document collections

Mention that all workspaces share the same vector database while maintaining strict logical isolation.

---

## 4. Document Upload (45–60 seconds)

Upload a new PDF.

Explain:

- Chunking
- Embedding generation
- Storage
- Indexing

Wait until ingestion completes.

---

## 5. Retrieval-Augmented Generation (2 minutes)

Ask questions such as:

### Software Engineering

- "Summarize the system architecture."
- "What authentication method is used?"
- "How does the retrieval pipeline work?"

---

### University

- "What are the project requirements?"
- "Summarize the assignment brief."
- "What is the submission deadline?"

---

### Company Handbook

- "What is the leave policy?"
- "Can employees work remotely?"
- "How should security incidents be reported?"

Highlight that answers are grounded in uploaded documents.

---

## 6. Workspace Isolation (1 minute)

Switch workspaces.

Ask the same question.

Example:

```
What is the leave policy?
```

Demonstrate that responses change based on the active workspace.

Explain that retrieval is filtered by workspace ID, preventing cross-workspace data leakage.

---

## 7. AI Tool Calling (1 minute)

Ask:

```
Create a task reminding me to review the architecture.
```

Demonstrate:

- Tool selection
- Backend validation
- Task creation
- Success confirmation

If Discord integration is enabled:

Show the notification.

---

## 8. Unknown Question (30 seconds)

Ask a question unrelated to uploaded documents.

Example:

```
What is the capital of Iceland?
```

Expected response:

The assistant should indicate that the answer cannot be determined from the uploaded documents instead of hallucinating.

---

## 9. Dashboard Overview (45 seconds)

Show:

- Uploaded documents
- Chat history
- Tasks
- Tool execution history

---

## 10. Closing (30 seconds)

Summarize:

- Secure multi-workspace architecture
- Retrieval-Augmented Generation
- AI tool calling
- Modern user interface
- Production-ready engineering practices

---

# Suggested Demo Questions

## Retrieval

- Summarize this document.
- What are the key objectives?
- Explain the architecture.
- List important requirements.
- What technologies are mentioned?

---

## Tool Calling

- Create a task for tomorrow.
- Remind me to review this document.
- Send a project notification.

---

## Isolation

Ask identical questions in multiple workspaces to demonstrate different responses.

---

# Failure Scenarios

Demonstrate graceful handling of:

- Unknown questions
- Empty workspaces
- Invalid uploads (if supported)
- AI uncertainty
- Missing document context

---

# Recording Tips

- Record in full-screen mode.
- Use a clean browser profile.
- Increase browser zoom if needed.
- Speak slowly and explain architectural decisions.
- Avoid unnecessary mouse movement.
- Keep terminal windows closed unless demonstrating setup.

---

# Post-Recording Checklist

- Verify audio quality.
- Ensure no secrets are visible.
- Confirm no personal information appears.
- Check AI responses are readable.
- Ensure the recording covers all required project features.

---

# Feature Coverage Checklist

| Feature                 | Demonstrated |
| ----------------------- | ------------ |
| Authentication          | ✅           |
| Multi-workspace support | ✅           |
| Document upload         | ✅           |
| RAG retrieval           | ✅           |
| Source citations        | ✅           |
| Workspace isolation     | ✅           |
| AI tool calling         | ✅           |
| Task creation           | ✅           |
| Dashboard               | ✅           |
| Responsive UI           | ✅           |
| Modern design           | ✅           |

---

# Notes

The objective of the demonstration is not to show every screen, but to clearly communicate the engineering decisions behind Abstra. Focus on explaining _why_ features were designed the way they were, particularly workspace isolation, grounded retrieval, and validated AI tool execution, as these are the core architectural strengths of the application.
