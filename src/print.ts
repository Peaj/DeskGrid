import type { GridConfig } from './domain/types';

export type PrintTone = 'color' | 'bw';
export type PrintOrientation = 'portrait' | 'landscape';

export const PRINT_PAGE_STYLE_ID = 'deskgrid-print-page-style';

export function getPrintOrientation(grid: Pick<GridConfig, 'width' | 'height'>): PrintOrientation {
  return grid.width > grid.height ? 'landscape' : 'portrait';
}

export function applyPrintPageStyle(orientation: PrintOrientation): () => void {
  if (typeof document === 'undefined') {
    return () => {};
  }

  let style = document.getElementById(PRINT_PAGE_STYLE_ID) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement('style');
    style.id = PRINT_PAGE_STYLE_ID;
    document.head.append(style);
  }

  style.textContent = `@page { size: A4 ${orientation}; margin: 10mm; }`;

  return () => {
    style?.remove();
  };
}
