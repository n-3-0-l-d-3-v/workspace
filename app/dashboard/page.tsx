import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/src/lib/supabase/server";
import { SignOutButton } from "./sign-out-button";
import { WorkspacePanel } from "./workspace-panel";

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

  if (membershipError || workspaceError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-12 text-zinc-100">
        <section className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/5 p-8">
          <p className="text-sm text-red-400">Failed to load workspaces.</p>
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
