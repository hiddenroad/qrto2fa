export const selectionCss = `
* { box-sizing: border-box; }
[hidden] { display: none !important; }
.overlay {
  position: fixed; inset: 0; pointer-events: auto; cursor: crosshair;
  background: rgba(15, 23, 42, 0.28); user-select: none; touch-action: none;
}
.overlay.dragging { background: transparent; }
.box {
  position: fixed; border: 2px solid #22c55e; border-radius: 2px;
  box-shadow: 0 0 0 100vmax rgba(15, 23, 42, 0.38);
}
.hint {
  position: fixed; top: 16px; left: 50%; transform: translateX(-50%);
  padding: 8px 14px; border-radius: 999px; background: #0f172a; color: #f8fafc;
  font: 500 13px/1.4 system-ui, -apple-system, "Segoe UI", sans-serif;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}
`;
