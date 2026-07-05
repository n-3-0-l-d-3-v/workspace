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
  const [switchingWorkspaceId, setSwitchingWorkspaceId] = useState<
    string | null
  >(null);
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
    setSwitchingWorkspaceId(workspaceId);
    setMessage(null);

    startTransition(async () => {
      const result = await setActiveWorkspace(workspaceId);

      if (result.error) {
        setMessage(result.error);
        setSwitchingWorkspaceId(null);
        return;
      }

      router.refresh();
      setSwitchingWorkspaceId(null);
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
    <div className="space-y-4">
      <div className="space-y-3">
        <label
          className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider"
          htmlFor="workspace-switcher"
        >
          Active workspace
        </label>
        <select
          id="workspace-switcher"
          className="w-full appearance-none rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm outline-none transition-colors focus:border-zinc-600 disabled:opacity-50"
          value={selectedWorkspaceId}
          onChange={handleWorkspaceChange}
          disabled={isPending || workspaces.length === 0}
        >
          {workspaces.length === 0 ? (
            <option value="">No workspaces yet</option>
          ) : null}
          {workspaces.map((workspace) => (
            <option
              key={workspace.id}
              value={workspace.id}
              disabled={switchingWorkspaceId === workspace.id}
            >
              {switchingWorkspaceId === workspace.id
                ? `${workspace.name} (loading...)`
                : workspace.name}
            </option>
          ))}
        </select>
      </div>

      <form className="space-y-3" onSubmit={handleCreateWorkspace}>
        <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider" htmlFor="workspace-name">
          Create new workspace
        </label>
        <div className="flex gap-3">
          <input
            id="workspace-name"
            className="min-w-0 flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm outline-none transition-colors placeholder:text-zinc-500 focus:border-zinc-600"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Workspace name"
          />
          <button
            type="submit"
            className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isPending}
          >
            Create
          </button>
        </div>
      </form>

      {message ? <p className="text-sm text-red-400">{message}</p> : null}
    </div>
  );
}
