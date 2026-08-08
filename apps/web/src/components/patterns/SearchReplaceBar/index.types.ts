/** Props for SearchReplaceBar. */
export interface SearchReplaceBarProps {
  readonly onQueryChange: (value: string) => void;
  readonly onReplace: () => void;
  readonly onReplaceAll: () => void;
  readonly onReplaceChange: (value: string) => void;
  readonly query: string;
  readonly replaceEnabled: boolean;
  readonly replaceValue: string;
  readonly searchPlaceholder: string;
}
