import { uploadDocumentForm } from "./actions";

export function DocumentUploadForm() {
  return (
    <form action={uploadDocumentForm} className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <label className="flex-1 cursor-pointer">
          <input
            name="file"
            type="file"
            accept=".txt,.md"
            className="hidden"
          />
          <div className="flex items-center justify-center rounded-xl border border-dashed border-zinc-700 bg-zinc-900/50 px-4 py-3 text-sm text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-300">
            Choose file
          </div>
        </label>
        <button
          type="submit"
          className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Upload
        </button>
      </div>
    </form>
  );
}
