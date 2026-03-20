/// <reference types="vitest/config" />
import { readFileSync } from 'node:fs';
import type { PluginOption } from 'vite';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

interface PackageJsonRepository {
  url?: string;
}

interface PackageJsonShape {
  repository?: string | PackageJsonRepository;
}

const basePath = process.env.BASE_PATH ?? '/';
const appVersion = process.env.npm_package_version ?? '0.0.0';
const packageJson = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
) as PackageJsonShape;
const rawRepository =
  typeof packageJson.repository === 'string'
    ? packageJson.repository
    : packageJson.repository?.url ?? '';
const repoUrl = rawRepository.replace(/^git\+/, '').replace(/\.git$/, '');
const contentSecurityPolicy =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; manifest-src 'self'; media-src 'self';";

function cspPlugin(): PluginOption {
  return {
    name: 'deskgrid-csp-meta',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace(
        '<title>DeskGrid</title>',
        `    <meta http-equiv="Content-Security-Policy" content="${contentSecurityPolicy}" />\n    <title>DeskGrid</title>`,
      );
    },
  };
}

export default defineConfig({
  base: basePath,
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
    __REPO_URL__: JSON.stringify(repoUrl),
  },
  plugins: [react(), cspPlugin()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
    },
  },
});
