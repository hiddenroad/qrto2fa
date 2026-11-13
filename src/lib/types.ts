export type Rect = { x: number; y: number; width: number; height: number };

export type RegionPick = { rect: Rect; viewportWidth: number; viewportHeight: number };

export type ScanError = "noTab" | "blocked" | "permission" | "file" | "interrupted" | "capture" | "notFound";

export type ScanOutcome = { kind: "text"; text: string } | { kind: "cancelled" } | { kind: "error"; error: ScanError };

declare global {
  interface Window {
    __qrTo2faSelect?: () => Promise<RegionPick | null>;
    __qrTo2faCancel?: () => void;
  }
}
