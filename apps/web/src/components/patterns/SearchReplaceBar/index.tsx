import { Button } from "../../core/Button/index.js";
import { Input } from "../../core/Input/index.js";
import styles from "./index.module.css";
import type { SearchReplaceBarProps } from "./index.types.js";

/**
 * Search and replace controls for document text.
 * @param props Search/replace props.
 * @returns Search and replace bar.
 */
export function SearchReplaceBar({
  query,
  replaceValue,
  onQueryChange,
  onReplaceChange,
  onReplace,
  onReplaceAll,
}: SearchReplaceBarProps) {
  return (
    <div className={styles.bar}>
      <div className={styles.field}>
        <Input
          label="Search"
          onChange={(event) => {
            onQueryChange(event.target.value);
          }}
          placeholder="Find…"
          value={query}
        />
      </div>
      <div className={styles.field}>
        <Input
          label="Replace"
          onChange={(event) => {
            onReplaceChange(event.target.value);
          }}
          placeholder="Replace with…"
          value={replaceValue}
        />
      </div>
      <div className={styles.actions}>
        <Button onClick={onReplace} size="sm">
          Replace
        </Button>
        <Button onClick={onReplaceAll} size="sm" variant="secondary">
          Replace all
        </Button>
      </div>
    </div>
  );
}
