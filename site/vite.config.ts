/// <reference types="vitest" />
import { defineConfig } from 'vite';
import analog from '@analogjs/platform';
import tailwindcss from '@tailwindcss/vite';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const SPEC = join(import.meta.dirname, '..', 'spec');
const readSpec = (p: string) => JSON.parse(readFileSync(join(SPEC, p), 'utf8'));

const slug = (s: string) =>
  String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// As rotas do catálogo não são uma lista mantida à mão: saem dos contratos.
// Um componente novo em spec/components/ vira página sem tocar em código.
function specRoutes(): string[] {
  const componentes = readdirSync(join(SPEC, 'components'))
    .filter((f) => f.endsWith('.json'))
    .map((f) => `/catalogo/${readSpec(`components/${f}`).id}`);

  const padroes = readSpec('patterns/patterns.json').patterns.map(
    (p: { id: string }) => `/padroes/${p.id}`,
  );

  const decisoes = readSpec('decisions/adr.json').decisions.map(
    (d: { id: string }) => `/decisoes/${slug(d.id)}`,
  );

  // As telas também saem da spec: tela nova em spec/templates.json vira rota
  // sem tocar em código.
  const telas = readSpec('templates.json').projetos.flatMap(
    (p: { id: string; templates: { id: string }[] }) =>
      p.templates.map((t) => `/telas/${p.id}/${t.id}`),
  );

  return [...componentes, ...padroes, ...decisoes, ...telas];
}

// As rotas estáticas saem do DIRETÓRIO de páginas, não de uma lista.
//
// Eram dezoito nomes digitados à mão, e em 09/09/2026 cinco fundações novas
// compilaram, entraram no menu e devolveram 404 em produção: o arquivo existia,
// o nome não estava na lista, e nada no build avisou. Uma lista paralela ao
// que já está no disco só tem um destino.
//
// Convenção do Analog, que é a que este diretório já segue:
//   index.page.ts        -> a rota do diretório
//   nome.page.ts         -> /diretorio/nome
//   [param].page.ts      -> rota dinâmica; quem enumera é specRoutes()
//   (grupo)/             -> agrupamento, não aparece na URL
function rotasDePaginas(dir = join(import.meta.dirname, 'src', 'app', 'pages'), prefixo = ''): string[] {
  const rotas: string[] = [];
  for (const item of readdirSync(dir, { withFileTypes: true })) {
    if (item.isDirectory()) {
      const seg = item.name.startsWith('(') ? prefixo : `${prefixo}/${item.name}`;
      rotas.push(...rotasDePaginas(join(dir, item.name), seg));
      continue;
    }
    if (!item.name.endsWith('.page.ts')) continue;
    const nome = item.name.slice(0, -'.page.ts'.length);
    // Rota dinâmica é enumerada pelo spec, não pelo disco: o disco só sabe que
    // existe UM arquivo para as quarenta e seis páginas de componente.
    if (nome.includes('[')) continue;
    rotas.push(nome === 'index' ? prefixo || '/' : `${prefixo}/${nome}`);
  }
  return rotas;
}

const fixas = rotasDePaginas().sort();

// O host mora na spec, não aqui. Ele aparece em três lugares — o sitemap, os
// exemplos de instalação e o portão de publicação — e quando morava só neste
// arquivo os exemplos apontavam para outro domínio sem que nada percebesse.
const { host: HOST } = readSpec('resources.json').publicacao;

export default defineConfig(() => ({
  root: import.meta.dirname,
  publicDir: 'src/assets',
  build: {
    target: ['es2022'],
  },
  resolve: {
    mainFields: ['module'],
    // O plugin do Analog não lê os paths do tsconfig — o alias precisa existir
    // aqui também. '@/' vem ANTES de nada mais específico porque é o alias
    // interno da lib para a base ZardUI.
    alias: {
      '@ucam/ui': join(import.meta.dirname, '..', 'ui/projects/ui/src/public-api.ts'),
      '@/': join(import.meta.dirname, '..', 'ui/projects/ui/src/lib') + '/',
    },
    // Uma única instância de cada pacote Angular no bundle.
    //
    // @analogjs/router importa @angular/common e @angular/platform-browser sem
    // declará-los como peer. Sob pnpm isso cai no fallback hoisted
    // (node_modules/.pnpm/node_modules/@angular/*), que aponta para a Angular 21
    // trazida por ui/ — enquanto o site roda Angular 22. Duas cópias do runtime
    // significam dois injetores: o inject(Meta) do router 21 não enxerga o
    // contexto do 22 e todo prerender morre com NG0203, gerando zero HTML.
    //
    // dedupe força esses specifiers a resolver a partir da raiz do site.
    // Remover só quando ui/ subir para a mesma major do site.
    dedupe: [
      '@angular/core',
      '@angular/common',
      '@angular/compiler',
      '@angular/forms',
      '@angular/platform-browser',
      '@angular/platform-server',
      '@angular/router',
      '@angular/ssr',
      // Chegam junto com a fonte da lib, que é Angular 21. Mesma armadilha.
      '@angular/cdk',
      '@ng-icons/core',
      'rxjs',
      // Mesma armadilha, e mais cara: duas cópias do ngx-echarts significam
      // dois provideEchartsCore, e o z-chart do site pegaria o do injetor
      // errado — gráfico que compila e não desenha.
      'ngx-echarts',
      'echarts',
    ],
  },
  plugins: [
    tailwindcss(),
    // Site totalmente estático: toda rota é conhecida no build, nenhuma
    // depende de requisição. Nada aqui justifica função serverless.
    //
    // Sem preset 'vercel': com static:true o Nitro usa o preset
    // nitro-prerender e ignora o preset da plataforma, escrevendo em
    // .vercel/output/static SEM o config.json que a Build Output API exige —
    // uma saída que parece pronta e a Vercel recusa. Deixando o padrão, os
    // arquivos vão para dist/analog/public e o vercel.json aponta para lá.
    analog({
      static: true,
      prerender: {
        routes: async () => [...fixas, ...specRoutes()],
        sitemap: {
          host: `${HOST}/`,
        },
      },
    }),
  ],
}));
