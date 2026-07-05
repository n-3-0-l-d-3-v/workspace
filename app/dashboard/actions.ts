'use server'

import crypto from "crypto"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { createClient } from "@/src/lib/supabase/server"

type ActionResult = {
  error?: string
}

type WorkspaceMembershipRow = {
  workspace_id: string
  role?: string
}

type WorkspaceRow = {
  id: string
}

type DocumentRow = {
  id: string
}

function chunkText(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean)
  const chunkSize = 500
  const overlap = 50
  const step = chunkSize - overlap

  if (words.length === 0) {
    return []
  }

  const chunks: string[] = []

  for (let start = 0; start < words.length; start += step) {
    const end = Math.min(start + chunkSize, words.length)
    const chunkWords = words.slice(start, end)

    if (chunkWords.length === 0) {
      break
    }

    chunks.push(chunkWords.join(" "))

    if (end === words.length) {
      break
    }
  }

  return chunks
}

async function resolveActiveWorkspaceId() {
  const cookieStore = await cookies()
  const cookieWorkspaceId = cookieStore.get("active_workspace_id")?.value ?? null
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "You must be signed in." as const }
  }

  if (cookieWorkspaceId) {
    const { data: membership } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", user.id)
      .eq("workspace_id", cookieWorkspaceId)
      .maybeSingle()

    if (membership) {
      return { workspaceId: cookieWorkspaceId, supabase, cookieStore }
    }
  }

  const { data: memberships, error } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)

  if (error) {
    return { error: error.message }
  }

  const workspaceIds = (memberships ?? []).map((membership: WorkspaceMembershipRow) => membership.workspace_id)

  if (workspaceIds.length === 0) {
    return { error: "You do not belong to any workspace." as const }
  }

  const { data: workspaces, error: workspacesError } = await supabase
    .from("workspaces")
    .select("id")
    .in("id", workspaceIds)
    .order("created_at", { ascending: true })

  if (workspacesError) {
    return { error: workspacesError.message }
  }

  const firstWorkspaceId = (workspaces as WorkspaceRow[] | null)?.[0]?.id ?? null

  if (!firstWorkspaceId) {
    return { error: "You do not belong to any workspace." as const }
  }

  return { workspaceId: firstWorkspaceId, supabase, cookieStore }
}

export async function setActiveWorkspace(workspaceId: string): Promise<ActionResult> {
  if (!workspaceId) {
    return { error: "Workspace id is required." }
  }

  const cookieStore = await cookies()
  cookieStore.set("active_workspace_id", workspaceId, {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
  })

  revalidatePath("/dashboard")
  return {}
}

export async function createWorkspace(name: string): Promise<ActionResult & { workspaceId?: string }> {
  const trimmedName = name.trim()

  if (!trimmedName) {
    return { error: "Workspace name is required." }
  }

  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: "You must be signed in to create a workspace." }
  }

  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .insert({ name: trimmedName, owner_id: user.id })
    .select("id")
    .single()

  if (workspaceError || !workspace) {
    return { error: workspaceError?.message ?? "Could not create workspace." }
  }

  const { error: memberError } = await supabase.from("workspace_members").insert({
    workspace_id: workspace.id,
    user_id: user.id,
    role: "owner",
  })

  if (memberError) {
    await supabase.from("workspaces").delete().eq("id", workspace.id)
    return { error: memberError.message }
  }

  const cookieStore = await cookies()
  cookieStore.set("active_workspace_id", workspace.id, {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
  })

  revalidatePath("/dashboard")
  return { workspaceId: workspace.id }
}

export async function uploadDocument(formData: FormData): Promise<ActionResult> {
  const file = formData.get("file")

  if (!(file instanceof File)) {
    return { error: "Choose a .txt or .md file." }
  }

  const filename = file.name.trim()
  const lowerFilename = filename.toLowerCase()

  if (!lowerFilename.endsWith(".txt") && !lowerFilename.endsWith(".md")) {
    return { error: "Only .txt and .md files are allowed." }
  }

  const workspaceResolution = await resolveActiveWorkspaceId()

  if ("error" in workspaceResolution) {
    return { error: workspaceResolution.error }
  }

  const { workspaceId, supabase, cookieStore } = workspaceResolution
  const content = await file.text()
  const documentHash = crypto.createHash("sha256").update(content).digest("hex")

  const { data: existingDocument } = await supabase
    .from("documents")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("content_hash", documentHash)
    .maybeSingle()

  if (existingDocument) {
    return {}
  }
  const geminiApiKey = process.env.GEMINI_API_KEY

  if (!geminiApiKey) {
    return { error: "GEMINI_API_KEY is not configured." }
  }

  const { data: documentRow, error: documentError } = await supabase
    .from("documents")
    .insert({ workspace_id: workspaceId, filename, content_hash: documentHash })
    .select("id")
    .single()

  if (documentError || !documentRow) {
    return { error: documentError?.message ?? "Could not create document." }
  }

  const document = documentRow as DocumentRow
  const gemini = new GoogleGenerativeAI(geminiApiKey)
  const embeddingModel = gemini.getGenerativeModel({ model: "gemini-embedding-001" })
  const chunks = chunkText(content)

  if (chunks.length === 0) {
    revalidatePath("/dashboard")
    cookieStore.set("active_workspace_id", workspaceId, {
      path: "/",
      sameSite: "lax",
      httpOnly: true,
    })
    return {}
  }

  const chunkRows = [] as Array<{
    workspace_id: string
    document_id: string
    content: string
    embedding: number[]
    chunk_index: number
    content_hash: string
  }>

  for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex += 1) {
    const chunkContent = chunks[chunkIndex]
    const contentHash = crypto.createHash("sha256").update(chunkContent).digest("hex")
    const embeddingResult = await embeddingModel.embedContent(chunkContent)

    chunkRows.push({
      workspace_id: workspaceId,
      document_id: document.id,
      content: chunkContent,
      embedding: embeddingResult.embedding.values,
      chunk_index: chunkIndex,
      content_hash: contentHash,
    })
  }

  const { error: chunkError } = await supabase.from("chunks").upsert(chunkRows, {
    onConflict: "workspace_id,document_id,content_hash",
    ignoreDuplicates: true,
  })

  if (chunkError) {
    return { error: chunkError.message }
  }

  cookieStore.set("active_workspace_id", workspaceId, {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
  })

  revalidatePath("/dashboard")
  return {}
}

export async function uploadDocumentForm(formData: FormData): Promise<void> {
  await uploadDocument(formData)
}