import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/src/lib/supabase/server";
import { ChatPanel } from "./chat-panel";
import { DocumentUploadForm } from "./document-upload-form";
import { DocumentShareControls } from "./document-share-controls";
import { SignOutButton } from "./sign-out-button";
import { WorkspacePanel } from "./workspace-panel";

type Citation = {
  filename: string;
  chunk_index: number;
};

type ChatMessage = {
  id: string;
  role: string;
  content: string;
  citations: Citation[] | null;
  retrieved_chunk_ids: string[] | null;
};

type DocumentShareRow = {
  document_id: string;
  shared_with_workspace_id: string;
  shared_with_workspace: {
    id: string;
    name: string;
  } | null;
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const cookieStore = await cookies();
  const activeWorkspaceCookie =
    cookieStore.get("active_workspace_id")?.value ?? null;

  const { data: memberships, error: membershipError } = await supabase
    .from("workspace_members")
    .select("workspace_id, role")
    .eq("user_id", user.id);

  const workspaceIds =
    memberships?.map((membership) => membership.workspace_id) ?? [];
  const roleByWorkspaceId = new Map(
    (memberships ?? []).map((membership) => [
      membership.workspace_id,
      membership.role,
    ]),
  );

  const { data: workspaces, error: workspaceError } =
    workspaceIds.length > 0
      ? await supabase
          .from("workspaces")
          .select("id, name, owner_id, created_at")
          .in("id", workspaceIds)
          .order("created_at", { ascending: true })
      : { data: [], error: null };

  const orderedWorkspaces = (workspaces ?? []).map((workspace) => ({
    id: workspace.id,
    name: workspace.name,
    role: roleByWorkspaceId.get(workspace.id) ?? "member",
  }));

  const activeWorkspaceId =
    activeWorkspaceCookie &&
    orderedWorkspaces.some(
      (workspace) => workspace.id === activeWorkspaceCookie,
    )
      ? activeWorkspaceCookie
      : (orderedWorkspaces[0]?.id ?? null);

  const activeWorkspace =
    orderedWorkspaces.find((workspace) => workspace.id === activeWorkspaceId) ??
    null;

  const { data: documents, error: documentsError } = activeWorkspaceId
    ? await supabase
        .from("documents")
        .select("id, filename")
        .eq("workspace_id", activeWorkspaceId)
    : { data: [], error: null };

  const documentIds = (documents ?? []).map((document) => document.id);

  const { data: documentShares, error: documentSharesError } =
    documentIds.length > 0
      ? await supabase
          .from("document_shares")
          .select(
            "document_id, shared_with_workspace_id, shared_with_workspace:workspaces(id, name)",
          )
          .in("document_id", documentIds)
      : { data: [], error: null };

  const { data: chatMessages, error: chatError } = activeWorkspaceId
    ? await supabase
        .from("chat_messages")
        .select("id, role, content, citations, retrieved_chunk_ids")
        .eq("workspace_id", activeWorkspaceId)
        .order("created_at", { ascending: true })
    : { data: [], error: null };

  const { data: toolCalls, error: toolCallsError } = activeWorkspaceId
    ? await supabase
        .from("tool_calls")
        .select("id, tool_name, status, latency_ms, created_at")
        .eq("workspace_id", activeWorkspaceId)
        .order("created_at", { ascending: false })
    : { data: [], error: null };

  if (
    membershipError ||
    workspaceError ||
    documentsError ||
    chatError ||
    toolCallsError ||
    documentSharesError
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-12 text-zinc-100">
        <section className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/5 p-8">
          <p className="text-sm text-red-400">Failed to load dashboard data.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-12 text-zinc-100">
      <section className="mx-auto w-full max-w-2xl space-y-8 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20 backdrop-blur">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-zinc-400">
            Dashboard
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Welcome, {user.email}
          </h1>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            You are signed in and protected by the Supabase session.
          </p>
        </div>

        <div className="space-y-2 rounded-lg border border-zinc-800 p-4">
          <p className="text-sm font-medium">Active workspace</p>
          <p className="text-sm text-zinc-400">
            {activeWorkspace
              ? `${activeWorkspace.name} (${activeWorkspace.id})`
              : "No workspace selected."}
          </p>
        </div>

        <WorkspacePanel
          workspaces={orderedWorkspaces}
          activeWorkspaceId={activeWorkspaceId}
        />

        <div className="space-y-2 rounded-lg border border-zinc-800 p-4">
          <h2 className="text-lg font-medium">Upload document</h2>
          <DocumentUploadForm />
        </div>

        <div className="space-y-2 rounded-lg border border-zinc-800 p-4">
          <h2 className="text-lg font-medium">Documents</h2>
          {documents && documents.length > 0 ? (
            <div className="space-y-2">
              {documents.map((document) => (
                <div
                  key={document.id}
                  className="rounded-md border border-zinc-800 p-3"
                >
                  <p className="font-medium">{document.filename}</p>
                  <p className="text-sm text-zinc-500">{document.id}</p>
                  <DocumentShareControls
                    documentId={document.id}
                    workspaces={orderedWorkspaces.filter(
                      (workspace) => workspace.id !== activeWorkspaceId,
                    )}
                    sharedWith={((documentShares ?? []) as DocumentShareRow[])
                      .filter((share) => share.document_id === document.id)
                      .map((share) => ({
                        id:
                          share.shared_with_workspace?.id ??
                          share.shared_with_workspace_id,
                        name: share.shared_with_workspace?.name ?? "unknown",
                      }))}
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-400">No documents uploaded yet.</p>
          )}
        </div>

        <ChatPanel messages={(chatMessages ?? []) as ChatMessage[]} />

        <div className="space-y-2 rounded-lg border border-zinc-800 p-4">
          <h2 className="text-lg font-medium">Tool calls</h2>
          {toolCalls && toolCalls.length > 0 ? (
            <div className="space-y-2">
              {toolCalls.map((toolCall) => (
                <div
                  key={toolCall.id}
                  className="rounded-md border border-zinc-800 p-3"
                >
                  <p className="font-medium">{toolCall.tool_name}</p>
                  <p className="text-sm text-zinc-400">{toolCall.status}</p>
                  <p className="text-sm text-zinc-400">
                    Latency: {toolCall.latency_ms} ms
                  </p>
                  <p className="text-sm text-zinc-500">{toolCall.created_at}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-400">No tool calls yet.</p>
          )}
        </div>

        <div className="pt-2">
          <h2 className="mb-3 text-lg font-medium">Your workspaces</h2>
          <div className="space-y-2">
            {orderedWorkspaces.length === 0 ? (
              <p className="text-sm text-zinc-400">
                You do not belong to any workspaces yet.
              </p>
            ) : (
              orderedWorkspaces.map((workspace) => (
                <div
                  key={workspace.id}
                  className="rounded-lg border border-zinc-800 p-4"
                >
                  <p className="font-medium">{workspace.name}</p>
                  <p className="text-sm text-zinc-400">
                    Role: {workspace.role}
                  </p>
                  <p className="text-sm text-zinc-500">{workspace.id}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <SignOutButton />
        </div>
      </section>
    </main>
  );
}
