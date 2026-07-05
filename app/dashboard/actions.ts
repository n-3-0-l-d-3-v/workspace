'use server'

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { createClient } from "@/src/lib/supabase/server"

type ActionResult = {
  error?: string
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