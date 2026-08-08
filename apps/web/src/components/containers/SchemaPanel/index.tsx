import { type ChangeEvent, useCallback } from "react";

import {
  useDocumentSchema,
  useDocumentState,
} from "../../../hooks/use-document.js";
import { runPromise } from "../../../utils/run-promise.js";
import { Button } from "../../core/index.js";
import { ValidationList } from "../../patterns/index.js";
import styles from "./index.module.css";

/**
 * Side panel for JSON Schema input and validation results.
 * @returns Schema panel.
 */
export function SchemaPanel() {
  const { state, setSelection } = useDocumentState();
  const { setSchemaText, validate } = useDocumentSchema();

  const handleSchemaChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      setSchemaText(event.target.value);
    },
    [setSchemaText],
  );

  const handleValidate = useCallback(() => {
    runPromise(validate());
  }, [validate]);

  return (
    <aside className={styles.panel}>
      <h2 className={styles.title}>Schema & validation</h2>
      <p className={styles.help}>
        Paste a JSON Schema (draft-07). Custom rules also flag{" "}
        <code>banned: true</code>.
      </p>
      <textarea
        aria-label="JSON Schema"
        className={styles.textarea}
        onChange={handleSchemaChange}
        placeholder='{ "type": "object", "properties": { ... } }'
        value={state.schemaText}
      />
      <Button onClick={handleValidate} variant="primary">
        Run validation
      </Button>
      <h3 className={styles.sectionTitle}>Issues</h3>
      <ValidationList
        issues={state.validationIssues}
        onSelectPath={setSelection}
      />
    </aside>
  );
}
