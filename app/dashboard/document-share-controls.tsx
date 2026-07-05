"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deleteDocument, shareDocument, unshareDocument } from "./actions"

type WorkspaceOption = {
  id: string;
  name: string;
};

type SharedWorkspace = {
  id: string;
  name: string;
};

type Props = {
  documentId: string;
  workspaces: WorkspaceOption[];
  sharedWith: SharedWorkspace[];
};

export function DocumentShareControls({
  documentId,
  workspaces,
  sharedWith,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleShareChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const selectElement = event.currentTarget;
    const targetWorkspaceId = selectElement.value;

    if (!targetWorkspaceId) {
      return;
    }

    startTransition(async () => {
      await shareDocument(documentId, targetWorkspaceId);
      router.refresh();
      selectElement.value = "";
    });
  }

  return (
    <div className="space-y-2">
      {sharedWith.length > 0 ? (
        <div className="text-xs text-zinc-400">
          Shared with:{" "}
          {sharedWith.map((workspace) => workspace.name).join(", ")}
          <div className="mt-1 flex flex-wrap gap-2">
            {sharedWith.map((workspace) => (
              <button
                key={workspace.id}
                type="button"
                className="rounded border border-zinc-700 px-2 py-1 text-xs"
                disabled={isPending}
                onClick={() => {
                  startTransition(async () => {
                    await unshareDocument(documentId, workspace.id);
                    router.refresh();
                  });
                }}
              >
                Unshare {workspace.name}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <label className="block text-xs text-zinc-400">
        Share with...
        <select
          defaultValue=""
          disabled={isPending || workspaces.length === 0}
          className="mt-1 rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs"
          onChange={handleShareChange}
        >
          <option value="">Select workspace</option>
          {workspaces.map((workspace) => (
            <option key={workspace.id} value={workspace.id}>
              {workspace.name}
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        className="rounded border border-zinc-700 px-2 py-1 text-xs"
        disabled={isPending}
        onClick={() => {
          startTransition(async () => {
            await deleteDocument(documentId)
            router.refresh()
          })
        }}
      >
        Delete
      </button>
    </div>
  );
}
