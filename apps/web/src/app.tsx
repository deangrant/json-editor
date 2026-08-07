import { DocumentProvider } from "./contexts/document-context.js";
import { EditorPage } from "./pages/Editor/index.js";

/**
 * Application root.
 * @returns App element.
 */
export function App() {
  return (
    <DocumentProvider>
      <EditorPage />
    </DocumentProvider>
  );
}
