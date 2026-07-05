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

type Task = {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  created_at: string;
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

  const { data: tasks, error: tasksError } = activeWorkspaceId
    ? await supabase
        .from("tasks")
        .select("id, title, description, due_date, created_at")
        .eq("workspace_id", activeWorkspaceId)
        .order("created_at", { ascending: false })
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
    documentSharesError ||
    tasksError
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-12 text-zinc-100">
        <section className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/5 p-8">
          <p className="text-sm text-red-400">Failed to load dashboard data.</p>
        </section>
      </main>
    );
  }

  // Get username from email
  const username = user.email?.split("@")[0] || "User";

  return (
    <main className="flex h-screen flex-col bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-zinc-800 px-8 py-5">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent font-serif">
            Abstra
          </h1>
          <span className="text-sm text-zinc-500">|</span>
          <span className="text-sm text-zinc-400">Welcome, {username}</span>
        </div>
        <SignOutButton />
      </header>

      {/* Main Layout */}
      <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-full md:w-80 border-b md:border-b-0 md:border-r border-zinc-800 flex flex-col">
          {/* Workspace Section */}
          <div className="p-6 border-b border-zinc-800">
            <WorkspacePanel
              workspaces={orderedWorkspaces}
              activeWorkspaceId={activeWorkspaceId}
            />
          </div>

          {/* Documents Section */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-5">
              <div className="space-y-3">
                <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-[0.2em] font-serif">
                  Documents
                </h2>
                <DocumentUploadForm />
              </div>

              <div className="space-y-4">
                {documents && documents.length > 0 ? (
                  documents.map((document) => (
                    <div
                      key={document.id}
                      className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 transition-all duration-200 hover:border-zinc-700"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {document.filename}
                          </p>
                          <p className="text-xs text-zinc-500 truncate">
                            {document.id}
                          </p>
                        </div>
                      </div>
                      <DocumentShareControls
                        documentId={document.id}
                        workspaces={orderedWorkspaces.filter(
                          (workspace) => workspace.id !== activeWorkspaceId,
                        )}
                        sharedWith={(
                          (documentShares ?? []) as DocumentShareRow[]
                        )
                          .filter((share) => share.document_id === document.id)
                          .map((share) => ({
                            id:
                              share.shared_with_workspace?.id ??
                              share.shared_with_workspace_id,
                            name:
                              share.shared_with_workspace?.name ?? "unknown",
                          }))}
                      />
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-zinc-500">
                    No documents uploaded yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* Right Side - Chat and Info */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Chat Panel */}
          <div className="flex-1 border-b md:border-b-0 md:border-r border-zinc-800 flex flex-col">
            <ChatPanel messages={(chatMessages ?? []) as ChatMessage[]} />
          </div>

          {/* Tasks & Tool Calls */}
          <aside className="w-full md:w-80 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-7">
              {/* Tasks */}
              <div className="space-y-3">
                <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-[0.2em] font-serif">
                  Tasks
                </h2>
                {tasks && tasks.length > 0 ? (
                  <div className="space-y-4">
                    {tasks.map((task: Task) => (
                      <div
                        key={task.id}
                        className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 transition-all duration-200 hover:border-zinc-700"
                      >
                        <p className="text-sm font-medium">{task.title}</p>
                        <p className="text-xs text-zinc-400 mt-1">
                          {task.description ?? "No description"}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500">
                          {task.due_date && <span>Due: {task.due_date}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-500">No tasks yet.</p>
                )}
              </div>

              {/* Tool Calls */}
              <div className="space-y-3">
                <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-[0.2em] font-serif">
                  Tool calls
                </h2>
                {toolCalls && toolCalls.length > 0 ? (
                  <div className="space-y-4">
                    {toolCalls.map((toolCall) => (
                      <div
                        key={toolCall.id}
                        className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 transition-all duration-200 hover:border-zinc-700"
                      >
                        <p className="text-sm font-medium">
                          {toolCall.tool_name}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-1 text-xs text-zinc-400">
                          <span>{toolCall.status}</span>
                          <span>•</span>
                          <span>{toolCall.latency_ms} ms</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-500">No tool calls yet.</p>
                )}
              </div>

              {/* Workspace List */}
              <div className="space-y-3">
                <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-[0.2em] font-serif">
                  Your workspaces
                </h2>
                {orderedWorkspaces.length === 0 ? (
                  <p className="text-sm text-zinc-500">
                    You do not belong to any workspaces yet.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {orderedWorkspaces.map((workspace) => (
                      <div
                        key={workspace.id}
                        className={`rounded-2xl border p-5 transition-all duration-200 cursor-pointer ${
                          workspace.id === activeWorkspaceId
                            ? "border-zinc-600 bg-zinc-900"
                            : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
                        }`}
                      >
                        <p className="text-sm font-medium">{workspace.name}</p>
                        <p className="text-xs text-zinc-500 mt-1">
                          Role: {workspace.role}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
