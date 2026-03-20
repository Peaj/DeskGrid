import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();
const SCAN_ROOTS = [join(ROOT, 'src'), join(ROOT, 'index.html'), join(ROOT, 'vite.config.ts')];
const TEXT_FILE_EXTENSIONS = new Set(['.ts', '.tsx', '.css', '.html']);
const BANNED_PATTERNS = [
  /fonts\.googleapis\.com/i,
  /fonts\.gstatic\.com/i,
  /document\.cookie/i,
  /navigator\.sendBeacon/i,
  /\bsendBeacon\s*\(/i,
  /\bfetch\s*\(/i,
  /\baxios\b/i,
  /\bXMLHttpRequest\b/i,
  /\bWebSocket\b/i,
  /\bEventSource\b/i,
  /google-analytics\.com/i,
  /googletagmanager/i,
  /\bmixpanel\b/i,
  /\bposthog\b/i,
  /\bplausible\b/i,
  /https?:\/\//i,
];

function collectFiles(entryPath: string): string[] {
  const stats = statSync(entryPath);
  if (stats.isFile()) {
    if (entryPath.includes('.test.') || entryPath.includes('.spec.')) {
      return [];
    }
    return [entryPath];
  }

  return readdirSync(entryPath, { withFileTypes: true }).flatMap((entry) => {
    const childPath = join(entryPath, entry.name);
    if (entry.isDirectory()) {
      return collectFiles(childPath);
    }
    if (childPath.includes('.test.') || childPath.includes('.spec.')) {
      return [];
    }
    if (!TEXT_FILE_EXTENSIONS.has(entry.name.slice(entry.name.lastIndexOf('.')))) {
      return [];
    }
    return [childPath];
  });
}

describe('privacy guardrails', () => {
  it('keeps app source free of remote font and tracking integrations', () => {
    const files = SCAN_ROOTS.flatMap((entryPath) => collectFiles(entryPath));

    for (const filePath of files) {
      const content = readFileSync(filePath, 'utf8');
      for (const pattern of BANNED_PATTERNS) {
        expect(content).not.toMatch(pattern);
      }
    }
  });
});
