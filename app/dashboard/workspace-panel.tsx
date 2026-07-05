"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createWorkspace, setActiveWorkspace } from "./actions";

type WorkspaceItem = {
  id: string;
  name: string;
  role: string;
};

type Props = {
  workspaces: WorkspaceItem[];
  activeWorkspaceId: string | null;
};

export function WorkspacePanel({ workspaces, activeWorkspaceId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(
    activeWorkspaceId ?? "",
  );

  useEffect(() => {
    setSelectedWorkspaceId(activeWorkspaceId ?? "");
  }, [activeWorkspaceId]);

  async function handleWorkspaceChange(
    event: React.ChangeEvent<HTMLSelectElement>,
  ) {
    const workspaceId = event.target.value;
    setSelectedWorkspaceId(workspaceId);
    setMessage(null);

    startTransition(async () => {
      const result = await setActiveWorkspace(workspaceId);

      if (result.error) {
        setMessage(result.error);
        return;
      }

      router.refresh();
    });
  }

  async function handleCreateWorkspace(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const result = await createWorkspace(name);

      if (result.error) {
        setMessage(result.error);
        return;
      }

      setName("");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3 rounded-lg border border-zinc-800 p-4">
        <div className="space-y-1">
          <label
            className="block text-sm font-medium"
            htmlFor="workspace-switcher"
          >
            Active workspace
          </label>
          <select
            id="workspace-switcher"
            className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2"
            value={selectedWorkspaceId}
            onChange={handleWorkspaceChange}
            disabled={isPending || workspaces.length === 0}
          >
            {workspaces.length === 0 ? (
              <option value="">No workspaces yet</option>
            ) : null}
            {workspaces.map((workspace) => (
              <option key={workspace.id} value={workspace.id}>
                {workspace.name}
              </option>
            ))}
          </select>
        </div>

        {activeWorkspaceId ? (
          <p className="text-sm text-zinc-400">
            Current active workspace id: {activeWorkspaceId}
          </p>
        ) : (
          <p className="text-sm text-zinc-400">No active workspace selected.</p>
        )}
      </section>

      <section className="space-y-3 rounded-lg border border-zinc-800 p-4">
        <form className="space-y-3" onSubmit={handleCreateWorkspace}>
          <label className="block text-sm font-medium" htmlFor="workspace-name">
            Create workspace
          </label>
          <div className="flex gap-2">
            <input
              id="workspace-name"
              className="min-w-0 flex-1 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="New workspace"
            />
            <button
              type="submit"
              className="rounded-md border border-zinc-700 px-3 py-2"
              disabled={isPending}
            >
              Create
            </button>
          </div>
        </form>
      </section>

      {message ? <p className="text-sm text-red-400">{message}</p> : null}
    </div>
  );
}
