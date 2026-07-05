import { uploadDocumentForm } from "./actions";

export function DocumentUploadForm() {
  return (
    <form action={uploadDocumentForm}>
      <input name="file" type="file" accept=".txt,.md" />
      <button type="submit">Upload document</button>
    </form>
  );
}
