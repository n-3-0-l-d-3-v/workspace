"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deleteDocument, shareDocument, unshareDocument } from "./actions";

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
    <div className="space-y-3 pt-4">
      {sharedWith.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs text-zinc-500">Shared with:</p>
          <div className="flex flex-wrap gap-2">
            {sharedWith.map((workspace) => (
              <button
                key={workspace.id}
                type="button"
                className="rounded-2xl border border-zinc-700 bg-zinc-900/50 px-4 py-2 text-xs text-zinc-300 transition-all duration-200 hover:border-red-600/50 hover:text-red-400 disabled:opacity-50 cursor-pointer"
                disabled={isPending}
                onClick={() => {
                  startTransition(async () => {
                    await unshareDocument(documentId, workspace.id);
                    router.refresh();
                  });
                }}
              >
                {workspace.name} ×
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        <label className="block text-xs text-zinc-500">
          Share with workspace
        </label>
        <select
          defaultValue=""
          disabled={isPending || workspaces.length === 0}
          className="w-full appearance-none rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-xs outline-none transition-all duration-200 focus:border-zinc-600 disabled:opacity-50 cursor-pointer"
          onChange={handleShareChange}
        >
          <option value="">Select workspace</option>
          {workspaces.map((workspace) => (
            <option key={workspace.id} value={workspace.id}>
              {workspace.name}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        className="rounded-2xl bg-red-600/10 px-5 py-3 text-xs font-semibold text-red-400 transition-all duration-200 hover:bg-red-600/20 disabled:opacity-50 cursor-pointer"
        disabled={isPending}
        onClick={() => {
          startTransition(async () => {
            await deleteDocument(documentId);
            router.refresh();
          });
        }}
      >
        Delete document
      </button>
    </div>
  );
}
