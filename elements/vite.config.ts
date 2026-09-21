/**
 * Build do Trilho A+ — @ucam/ui como custom elements (protótipo, ADR-010).
 *
 *   pnpm --filter @ucam/elements build
 *
 * Compila a fonte de ui/ com a Angular deste pacote (22), não com a de ui/
 * (21) — mesmo motivo que fez o site compilar a lib por fonte: o compilador do
 * 22 é mais estrito e foi ele que revelou os outputs duplicados de model().
 * Medir com o compilador antigo mediria um artefato que não vamos publicar.
 */
import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';
import tailwindcss from '@tailwindcss/vite';
import { join } from 'node:path';

const RAIZ = import.meta.dirname;
const REPO = join(RAIZ, '..');

// Cada pacote Angular resolve a partir daqui. Sem isto a fonte da lib puxa a
// Angular 21 de ui/ e o bundle sai com duas cópias do runtime — a mesma
// armadilha documentada no dedupe de site/vite.config.ts.
const angularPkgs = [
  '@angular/core',
  '@angular/common',
  '@angular/compiler',
  '@angular/elements',
  '@angular/forms',
  '@angular/platform-browser',
  '@angular/cdk',
  '@ng-icons/core',
  '@ng-icons/lucide',
  'rxjs',
];

export default defineConfig(() => ({
  root: RAIZ,
  resolve: {
    mainFields: ['module'],
    alias: {
      '@ucam/ui': join(REPO, 'ui/projects/ui/src/public-api.ts'),
      '@/': join(REPO, 'ui/projects/ui/src/lib') + '/',
    },
    // Só dedupe, sem alias por pacote: alias com caminho absoluto atropela o
    // campo `exports` e quebra subcaminho como '@angular/core/primitives/di',
    // que não é diretório real. dedupe resolve a partir da raiz deste pacote,
    // onde está a Angular 22 — e é o bastante para a fonte de ui/ (Angular 21)
    // não trazer uma segunda cópia do runtime.
    dedupe: angularPkgs,
  },
  plugins: [tailwindcss(), angular({ tsconfig: join(RAIZ, 'tsconfig.json') })],
  build: {
    target: ['es2022'],
    outDir: join(REPO, 'dist', 'elements'),
    emptyOutDir: true,
    lib: {
      entry: join(RAIZ, 'src', process.env['UCAM_ENTRY'] ?? 'main.ts'),
      name: 'UcamElements',
      formats: ['es'],
      fileName: () => (process.env['UCAM_ENTRY'] ? 'medicao.js' : 'ucam-elements.js'),
      cssFileName: 'ucam-elements',
    },
    // Nada de externals: a página legada carrega UM arquivo e não tem
    // empacotador para resolver import nenhum.
    rollupOptions: { external: [] },
    reportCompressedSize: true,
  },
}));
