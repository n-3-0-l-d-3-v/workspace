import { uploadDocumentForm } from "./actions";

export function DocumentUploadForm() {
  return (
    <form action={uploadDocumentForm} className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <label className="flex-1 cursor-pointer">
          <input name="file" type="file" accept=".txt,.md" className="hidden" />
          <div className="flex items-center justify-center rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/50 px-5 py-4 text-sm text-zinc-400 transition-all duration-200 hover:border-zinc-600 hover:text-zinc-300">
            Choose file
          </div>
        </label>
        <button
          type="submit"
          className="rounded-2xl bg-white px-6 py-4 text-sm font-semibold text-zinc-950 transition-all duration-200 hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
        >
          Upload
        </button>
      </div>
    </form>
  );
}
