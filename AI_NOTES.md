# AI_NOTES.md

# AI Engineering Notes

## Project Overview

This project was developed using an AI-assisted engineering workflow centered around planning, implementation, review, and validation rather than simple code generation. Instead of relying on a single model for all tasks, different AI systems were delegated specialized responsibilities based on their strengths, with all final technical decisions remaining under human supervision.

The objective was to use AI as a collaborative engineering tool while maintaining full understanding and ownership of the resulting application.

---

# AI Tools Used

## Claude

Primary Role

- System architecture
- Project planning
- Feature decomposition
- Database design
- RAG pipeline design
- Prompt engineering
- Tool calling architecture
- UI/UX refinement
- Documentation
- Code review
- Debugging assistance

Claude was primarily used as the architectural reasoning engine. Rather than generating large quantities of implementation code, it was responsible for designing systems, reviewing implementations, identifying issues, and producing detailed technical specifications that guided development.

---

## GitHub Copilot (Agent Mode)

Primary Role

- Repository-aware implementation
- Component generation
- API route implementation
- React development
- TypeScript generation
- Refactoring
- Bug fixes
- Multi-file code edits

Once architectural decisions were finalized, GitHub Copilot Agent translated specifications into working code within the existing repository structure.

---

## GitHub Copilot Autocomplete

Primary Role

- Boilerplate generation
- Repetitive UI code
- Type definitions
- Utility functions
- Component scaffolding

Autocomplete accelerated routine coding tasks while reducing manual repetition.

---

## Google Gemini

Primary Role

- Sample documents
- Demo datasets
- Example prompts
- Test conversations
- Placeholder content
- Documentation assistance

Gemini was intentionally delegated content generation tasks that did not require repository context. This reduced repository-aware AI usage while maintaining development speed.

---

# Development Workflow

Every feature followed a structured engineering pipeline.

```text
Problem Definition
        │
        ▼
Architecture Planning (Claude)
        │
        ▼
Technical Specification
        │
        ▼
Implementation (GitHub Copilot)
        │
        ▼
Local Validation
        │
        ▼
Architecture Review (Claude)
        │
        ▼
Manual Testing
        │
        ▼
Documentation
        │
        ▼
Production Integration
```

This workflow separated planning from implementation, resulting in more consistent architecture and fewer redesigns during development.

---

# Key Engineering Decisions

## 1. Shared Vector Store with Workspace Isolation

One of the most important architectural decisions was maintaining a single shared vector store while enforcing strict workspace isolation.

Instead of creating separate vector databases for each workspace, all document embeddings are stored in the same table and filtered using the active workspace identifier during retrieval.

This satisfies the project requirement while improving scalability and simplifying data management.

---

## 2. AI Tool Calling Architecture

Tool execution follows a structured workflow:

- The language model proposes a tool call.
- The backend validates the request.
- Arguments are checked before execution.
- The requested operation is performed.
- Results are returned to the model.
- Tool activity is logged for transparency.

Separating decision-making from execution reduces the risk of unintended actions.

---

## 3. Modular Application Architecture

The application was intentionally divided into independent layers.

- Authentication
- Workspace management
- Document ingestion
- Embedding generation
- Retrieval
- Prompt construction
- Tool execution
- Dashboard
- UI components

This modular structure improved maintainability and simplified debugging throughout development.

---

# Hardest Bug Encountered

The most significant issue occurred during the final UI refinement phase.

A partially migrated stylesheet introduced an unmatched brace within the global stylesheet, causing the Next.js application to fail during compilation. Around the same time, an additional duplicate closing tag remained inside one of the dashboard components after a UI refactor.

Initially the issue appeared to originate from React components, but systematic debugging isolated the failures to the stylesheet and component structure.

The solution involved:

- identifying the unmatched CSS block,
- removing the duplicate JSX closing tag,
- rebuilding the project,
- verifying the production build before continuing UI refinement.

This reinforced the importance of validating structural changes after large interface refactors.

---

# Human Contributions

Although AI significantly accelerated development, several important engineering decisions remained human-driven.

Examples include:

- selecting the overall technology stack,
- determining the workspace isolation strategy,
- defining the retrieval workflow,
- choosing the project architecture,
- refining the user experience,
- prioritizing features,
- validating AI-generated code,
- deciding when AI suggestions should be rejected or revised.

All AI-generated code was reviewed before being integrated into the repository.

---

# Lessons Learned

This project demonstrated that AI is most effective when used as a collaborative engineering partner rather than a replacement for software engineering.

Separating architectural reasoning, implementation, content generation, validation, and documentation into specialized stages produced a more maintainable codebase than relying on a single AI assistant for every task.

It also highlighted the importance of clear specifications before implementation, reducing ambiguity and minimizing unnecessary revisions.

---

# Future Improvements

Given additional development time, the following enhancements would be prioritized:

- Hybrid retrieval combining vector and keyword search.
- Streaming responses from the language model.
- Advanced observability dashboards for latency and token usage.
- Cross-workspace document sharing with explicit permissions.
- Background processing for document ingestion.
- Expanded automated testing coverage.
- Additional productivity tools and integrations.
- Performance optimizations for larger document collections.

---

# Final Reflection

This project was an exercise in AI-assisted software engineering rather than AI-generated software.

The focus throughout development was on using different AI systems where they were most effective, maintaining human oversight for architectural decisions, and validating every generated change before production use.

The resulting workflow emphasized planning, modularity, testing, documentation, and responsible AI collaboration while producing a complete end-to-end application that satisfies the project requirements.
