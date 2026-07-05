# Architecture

## Overview

## Design Goals

## High-Level System Architecture

(User → Auth → Workspace → Upload → Chunk → Embedding → pgvector → Retrieval → LLM → Tool Calling → Response)

## Technology Stack

## Folder Structure

## Database Architecture

- users
- workspaces
- documents
- document_chunks
- embeddings
- chats
- tasks
- tool_logs

Explain relationships.

## Authentication Flow

## Workspace Isolation

Explain:

- active workspace
- workspace_id filtering
- shared vector database
- RLS
- why this scales

## Document Ingestion Pipeline

Upload

↓

PDF Extraction

↓

Chunking

↓

Metadata

↓

Embeddings

↓

Vector Storage

## Retrieval Pipeline

Question

↓

Embedding

↓

Similarity Search

↓

Workspace Filter

↓

Top-k Results

↓

Prompt Construction

↓

Gemini

↓

Response

## Prompt Engineering

Explain:

System Prompt

Context

User Prompt

Tool Instructions

Hallucination Prevention

## Tool Calling Flow

LLM

↓

Tool Suggestion

↓

Validation

↓

Execution

↓

Database

↓

Response

## Security Considerations

Workspace Isolation

Secrets

Validation

Prompt Injection

## Performance Optimizations

Chunk Size

Embedding Cache

Indexes

Server Components

## Future Improvements

Hybrid Search

Streaming

Background Jobs

Monitoring
