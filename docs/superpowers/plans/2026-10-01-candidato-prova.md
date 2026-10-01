# Fluxo do candidato (entrada, prova, resultado) — Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar o fluxo do candidato do vestibular online (entrada pelo link, instruções, prova objetiva, redação, entrega e resultado) como app Angular 21 construído com o UCAMDS (Trilho B), falando com o backend legado.

**Architecture:** App standalone/zoneless com rotas reais sob `/candidato/:oid`; um guard recupera o candidato do backend e redireciona pela situação. Estado em stores com signals (`CandidatoStore`, `ProvaStore`), relógio da prova e fila offline de respostas como serviços puros e testáveis; telas finas sobre os componentes `<ucam-*>` e as classes de layout do `@ucam/css`.

**Tech Stack:** Angular 21.2 (standalone, signals, zoneless, Vitest via `ng test`), `@ucam/ui` 0.1.1, `@ucam/tokens` 0.1.1, `@ucam/css` 0.1.1 (tokens, fontes Geist, layout e classes `.ucam-*` que os componentes usam), Tailwind v4, npm.

**Spec:** `docs/superpowers/specs/2026-10-01-candidato-prova-design.md`

## Global Constraints

- Angular `>=21.0.0 <23.0.0`; `@ng-icons/*` fixados em `34.0.0` (35+ exige Angular 22); `ngx-echarts@21`; gerenciador: **npm** (pnpm 11 recusa tarballs por URL).
- Pacotes do DS instalados por tarball (`file:../ucamds/dist/pacotes/ucam-*-0.1.1.tgz` até a publicação; depois `https://ucam-ds.vercel.app/pacotes/ucam-*-0.1.1.tgz`).
- Só componentes `<ucam-*>` e classes `.ucam-*`; nunca `<z-*>`; nenhum hex, nenhum token primitivo, nenhum `style` inline de cor/espaço/fonte (ADR-007). Utilities Tailwind só para arranjo responsivo (`hidden lg:block`), nunca para cor.
- Um `h1` por tela; rótulo persistente em todo campo; nada em caixa alta; vermelho só em destruição irreversível (reprovado é neutro); uma ação primária por tela.
- Carregando: `ucam-skeleton` na região ou `loading` no botão — nunca `disabled` no botão em carregamento, nunca overlay de tela cheia (ADR-005, ADR-042).
- Botão desabilitado sempre com o motivo escrito ao lado.
- Bloqueio de copiar/recortar/colar/menu de contexto só nos elementos de questão e redação.
- Redação: mínimo 300 caracteres não brancos; teto 3.000 caracteres.
- Textos de interface em português do edital: prova objetiva, redação, caderno, entregar a prova, aprovado/reprovado.
- Commits pequenos e frequentes, mensagem em português, com a linha `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.
- Antes de fechar cada tela: `npm run ds:checar` sem erros.

## Review Focus

1. **Link sem `oid` ou `oid` inexistente** — a pessoa vê uma mensagem clara com saída (conferir o e-mail, falar com a secretaria), nunca tela em branco. Teste em Task 6 (`SemLinkPage`) e Task 5 (guard devolve `erro`).
2. **Recarregar a página no meio da prova** — volta à questão da URL com o mapa e as respostas corretas, e o relógio continua do `horarioinicio` do servidor, não de um contador local. Teste em Task 3 (relógio parte do servidor) e Task 8 (store carrega respostas por questão).
3. **Rede caindo ao escolher uma alternativa** — a escolha fica marcada, o indicador vira "pendente", a fila reenvia quando a rede volta e a entrega não acontece com pendência. Teste em Task 4.
4. **Tempo esgotado com a aba em segundo plano** — ao voltar, o app entrega e vai ao resultado em vez de mostrar tempo negativo. Teste em Task 3 (`restante` nunca negativo, `esgotado` dispara mesmo com salto de tempo).
5. **Redação com 299 caracteres mais espaços** — a contagem ignora brancos e a entrega fica bloqueada com o motivo ao lado; com HTML/colagem de texto rico, só texto simples é guardado. Teste em Task 12.

---

### Task 1: Base do app — estilos, moldura de pacotes, environment, scripts

**Files:**
- Modify: `package.json` (dependências e scripts)
- Modify: `src/styles.css`
- Modify: `src/index.html`
- Modify: `src/app/app.config.ts`
- Create: `src/environments/environment.ts`, `src/environments/environment.prod.ts`
- Modify: `angular.json` (fileReplacements)
- Modify: `src/app/app.ts`, `src/app/app.html` (remover boilerplate), `src/app/app.spec.ts`

**Interfaces:**
- Produces: `environment` com `{ backend, backendApi, formUrl, siteEad, sitePresencialBase, unidRef, duracaoPadraoMs, redacaoMin, redacaoMax, contatoSecretaria }`.

- [ ] **Step 1: Instalar `@ucam/css` e remover as fontes do fontsource (a fonte vem do pacote do DS)**

```bash
cd vestibular-online
npm uninstall @fontsource-variable/geist @fontsource-variable/geist-mono
npm install ../ucamds/dist/pacotes/ucam-css-0.1.1.tgz ../ucamds/dist/pacotes/ucam-tokens-0.1.1.tgz --no-audit --no-fund
```

Esperado: `package.json` com `"@ucam/css": "file:../ucamds/dist/pacotes/ucam-css-0.1.1.tgz"` e `@ucam/tokens` apontando para a 0.1.1.

- [ ] **Step 2: Escrever `src/styles.css`**

```css
/* Fonte Geist auto-hospedada: sai do pacote do DS, não de CDN. */
@import "@ucam/css/ucam-fonts.css";
/* Trilho A do DS: layout (ucam-stack, ucam-split…), tela de entrada
   (ucam-login) e as classes .ucam-* que os componentes do @ucam/ui usam.
   Quase tudo é global; o que depende do ancestral .ucam (box-sizing, fonte,
   anel de foco) vale porque <body class="ucam">. */
@import "@ucam/css/ucam.css";

@import "tailwindcss";
/* Tokens como @theme do Tailwind: bg-surface-canvas, text-text-primary… */
@import "@ucam/tokens/ucam-theme.css";
/* Base dos componentes <ucam-*>: utilities do bundle (via @source),
   ponte para os tokens e o @layer base da biblioteca. */
@import "@ucam/ui/styles.css";
```

- [ ] **Step 3: Escrever `src/index.html`**

```html
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <title>Vestibular Online · UCAM</title>
    <base href="/" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light dark" />
    <link rel="icon" type="image/x-icon" href="favicon.ico" />
  </head>
  <body class="ucam">
    <app-root></app-root>
  </body>
</html>
```

- [ ] **Step 4: Criar os environments**

`src/environments/environment.ts`:

```ts
export const environment = {
  production: false,
  backend: 'http://localhost:8030/',
  backendApi: 'http://localhost:8030/vestibularonline/',
  /** Área do inscrito: destino do aprovado, com o CPF no fim. */
  formUrl: 'https://www.candidomendes.edu.br/processo-seletivo/area-do-inscrito',
  siteEad: 'https://ead.candidomendes.edu.br/',
  /** Recebe o slug da sigla da unidade no fim. */
  sitePresencialBase: 'https://eupossoestudarnacandido.com.br/',
  /** Unidade de referência da instalação. unid32 = EAD. */
  unidRef: 'unid01',
  duracaoPadraoMs: 2 * 60 * 60 * 1000,
  redacaoMin: 300,
  redacaoMax: 3000,
  contatoSecretaria: 'secretaria@candidomendes.edu.br',
};
```

`src/environments/environment.prod.ts`: igual, com `production: true`, `backend: 'DEPLOY_PROCESSO_BACKEND/'`, `backendApi: 'DEPLOY_PROCESSO_BACKEND/vestibularonline/'`, `unidRef: 'UNIDADE_REFERENCIA'` (os marcadores são trocados pelo `replace.sh` do deploy, como no legado).

- [ ] **Step 5: `angular.json` — fileReplacements em produção**

Dentro de `projects.vestibular-online.architect.build.configurations.production`, adicionar:

```json
"fileReplacements": [
  { "replace": "src/environments/environment.ts", "with": "src/environments/environment.prod.ts" }
]
```

- [ ] **Step 6: `app.config.ts` com HttpClient e roteador configurado**

```ts
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideRouter, withComponentInputBinding, withRouterConfig } from '@angular/router';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withFetch()),
    provideRouter(
      routes,
      withComponentInputBinding(),
      // :oid fica na rota pai; os filhos precisam enxergá-lo.
      withRouterConfig({ paramsInheritanceStrategy: 'always' }),
    ),
  ],
};
```

- [ ] **Step 7: Limpar o `App` raiz**

`src/app/app.ts`:

```ts
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class App {}
```

Apagar `src/app/app.html` e `src/app/app.css`. `src/app/app.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App', () => {
  it('cria a raiz com o outlet', async () => {
    await TestBed.configureTestingModule({ imports: [App], providers: [provideRouter([])] }).compileComponents();
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('router-outlet')).not.toBeNull();
  });
});
```

- [ ] **Step 8: Scripts no `package.json`**

```json
"scripts": {
  "ng": "ng",
  "start": "ng serve --host localhost",
  "build": "ng build",
  "test": "ng test",
  "ds:checar": "ucam-ds checar src/app/**/*.html"
}
```

`ucam-ds` vem de `@ucam/ds-mcp`, instalado na raiz do workspace (`../node_modules/.bin`). Instalar também aqui para o script resolver: `npm install -D ../ucamds/dist/pacotes/ucam-ds-mcp-0.1.1.tgz --no-audit --no-fund`.

- [ ] **Step 9: Build e teste**

Run: `npx ng build && npx ng test --include src/app/app.spec.ts`
Esperado: build completo; no CSS final existem `.ucam-split`, `.ucam-login` e `@font-face` da Geist (`grep -c "ucam-login" dist/vestibular-online/browser/styles-*.css` > 0); teste PASS.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "Base do app: @ucam/css, environment, roteador e HttpClient

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: Modelos de domínio e APIs tipadas

**Files:**
- Create: `src/app/core/model/candidato.ts`, `src/app/core/model/prova.ts`
- Create: `src/app/core/api/candidato.api.ts`, `src/app/core/api/prova.api.ts`
- Test: `src/app/core/api/candidato.api.spec.ts`, `src/app/core/api/prova.api.spec.ts`, `src/app/core/model/prova.spec.ts`

**Interfaces:**
- Produces: tipos `CandidatoProva`, `SituacaoProva`, `Tentativas`, `CadernoProva`, `Questao`, `Alternativa`, `RespostaCandidato`, `TempoMaximo`, `DadosCandidato`; funções `slugTipoProva(tipo)`, `rotuloTipoProva(tipo)`, `ehRedacao(tipo)`; classes `CandidatoApi` e `ProvaApi` (métodos abaixo).

- [ ] **Step 1: Modelos**

`src/app/core/model/candidato.ts`:

```ts
export type SituacaoProva = 'CADASTRADO' | 'PROVA_INICIADA' | 'PROVA_FINALIZADA' | 'PROVA_CORRIGIDA';
export type SituacaoInscricao = 'APROVADO' | 'REPROVADO' | 'MATRICULADO' | (string & {});

export interface Unidade {
  oid: string;
  nome?: string;
  sigla?: string;
  cidade?: string;
  uf?: string;
}

/** O registro `candidatoprova` do backend, no formato em que ele chega. */
export interface CandidatoProva {
  oid: string;
  situacao: SituacaoProva;
  horarioinicio?: string | null;
  horariofim?: string | null;
  formaingressopessoa: {
    oid: string;
    situacao: SituacaoInscricao;
    pessoa: { oid: string; nome: string; cpf: { numero: string } };
    periodounidadecurso: {
      turnoLabel: string;
      unidadecurso: { curso: { nome: string }; unidade: Unidade };
    };
  };
}

export interface Tentativas {
  tentativaAtual: number;
  totalTentativasPossiveis: number;
}

/** Projeção `candidato-inline`: só o que o resultado usa. */
export interface DadosCandidato {
  horarioinicio?: string | null;
  horariofim?: string | null;
}
```

`src/app/core/model/prova.ts`:

```ts
export interface Alternativa { oid: string; descricao: string; }
export interface Questao { oid: string; descricao: string; textoreferencia?: string | null; alternativas: Alternativa[]; }
export interface CadernoProva { oid: string; tipoprova: string; questoes: Questao[]; }
export interface RespostaCandidato { oidAlternativa: string | null; respostaTextual: string | null; }
export interface TempoMaximo { tempomaximo: string; } // 'HH:MM:SS'

const ROTULOS: Record<string, string> = {
  portugues: 'Português',
  matematica: 'Matemática',
  conhecimentos_gerais: 'Conhecimentos gerais',
  redacao: 'Redação',
};

function chave(tipo: string): string | undefined {
  const t = tipo.toLowerCase();
  return Object.keys(ROTULOS).find((k) => t.includes(k));
}

/** 'CONHECIMENTOS_GERAIS' → 'conhecimentos-gerais' (segmento de URL). */
export function slugTipoProva(tipo: string): string {
  return (chave(tipo) ?? tipo.toLowerCase()).replace(/_/g, '-');
}

/** 'CONHECIMENTOS_GERAIS' → 'Conhecimentos gerais'. Desconhecido: o próprio tipo em caixa natural. */
export function rotuloTipoProva(tipo: string): string {
  const k = chave(tipo);
  if (k) return ROTULOS[k];
  const t = tipo.toLowerCase().replace(/_/g, ' ');
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export function ehRedacao(tipo: string): boolean {
  return /redacao/i.test(tipo);
}
```

- [ ] **Step 2: Teste dos helpers**

`src/app/core/model/prova.spec.ts`:

```ts
import { ehRedacao, rotuloTipoProva, slugTipoProva } from './prova';

describe('tipos de prova', () => {
  it('gera slug de URL', () => {
    expect(slugTipoProva('PORTUGUES')).toBe('portugues');
    expect(slugTipoProva('CONHECIMENTOS_GERAIS')).toBe('conhecimentos-gerais');
    expect(slugTipoProva('REDACAO')).toBe('redacao');
  });
  it('gera rótulo em caixa natural', () => {
    expect(rotuloTipoProva('MATEMATICA')).toBe('Matemática');
    expect(rotuloTipoProva('HISTORIA_GERAL')).toBe('Historia geral');
  });
  it('reconhece redação', () => {
    expect(ehRedacao('REDACAO')).toBe(true);
    expect(ehRedacao('PORTUGUES')).toBe(false);
  });
});
```

Run: `npx ng test --include src/app/core/model/prova.spec.ts` → PASS.

- [ ] **Step 3: Teste da `CandidatoApi` (falha: classe não existe)**

`src/app/core/api/candidato.api.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { CandidatoApi } from './candidato.api';
import { environment } from '../../../environments/environment';

describe('CandidatoApi', () => {
  let api: CandidatoApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    api = TestBed.inject(CandidatoApi);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('busca o candidato pelo oid da forma de ingresso', async () => {
    const p = firstValueFrom(api.buscar('fip-1'));
    const req = http.expectOne((r) => r.url === `${environment.backendApi}candidatoprova/search/findbyformaingressopessoa`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('oidformaingressopessoa')).toBe('fip-1');
    req.flush({ oid: 'cp-1', situacao: 'CADASTRADO' });
    expect((await p)?.oid).toBe('cp-1');
  });

  it('devolve null quando o backend responde vazio', async () => {
    const p = firstValueFrom(api.buscar('fip-1'));
    http.expectOne(() => true).flush(null);
    expect(await p).toBeNull();
  });

  it('cria com tentativa', async () => {
    const p = firstValueFrom(api.criar('fip-1', '2'));
    const req = http.expectOne((r) => r.url === `${environment.backendApi}candidatoprova`);
    expect(req.request.method).toBe('POST');
    expect(req.request.params.get('tentativa')).toBe('2');
    req.flush({ oid: 'cp-2', situacao: 'CADASTRADO' });
    expect((await p).oid).toBe('cp-2');
  });

  it('consulta tentativas', async () => {
    const p = firstValueFrom(api.tentativas('fip-1'));
    http.expectOne(`${environment.backendApi}formaingressopessoa/fip-1/tentativas`).flush({ tentativaAtual: 1, totalTentativasPossiveis: 3 });
    expect((await p).totalTentativasPossiveis).toBe(3);
  });
});
```

Run: `npx ng test --include src/app/core/api/candidato.api.spec.ts` → FAIL (módulo não encontrado).

- [ ] **Step 4: Implementar `CandidatoApi`**

`src/app/core/api/candidato.api.ts`:

```ts
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CandidatoProva, DadosCandidato, Tentativas } from '../model/candidato';

@Injectable({ providedIn: 'root' })
export class CandidatoApi {
  private readonly http = inject(HttpClient);
  private readonly api = environment.backendApi;

  buscar(oidFormaIngressoPessoa: string): Observable<CandidatoProva | null> {
    const params = new HttpParams().set('oidformaingressopessoa', oidFormaIngressoPessoa);
    return this.http
      .get<CandidatoProva | null>(`${this.api}candidatoprova/search/findbyformaingressopessoa`, { params })
      .pipe(map((c) => c ?? null));
  }

  criar(oidFormaIngressoPessoa: string, tentativa?: string): Observable<CandidatoProva> {
    let params = new HttpParams().set('oidformaingressopessoa', oidFormaIngressoPessoa);
    if (tentativa) params = params.set('tentativa', tentativa);
    return this.http.post<CandidatoProva>(`${this.api}candidatoprova`, {}, { params });
  }

  tentativas(oidFormaIngressoPessoa: string): Observable<Tentativas> {
    return this.http.get<Tentativas>(`${this.api}formaingressopessoa/${oidFormaIngressoPessoa}/tentativas`);
  }

  /** Projeção com horário de início e fim (usada no resultado). */
  dados(oidCandidatoProva: string): Observable<DadosCandidato> {
    return this.http.get<DadosCandidato>(`${environment.backend}data-context/candidato/${oidCandidatoProva}?projection=candidato-inline`);
  }
}
```

Run: `npx ng test --include src/app/core/api/candidato.api.spec.ts` → PASS.

- [ ] **Step 5: Teste da `ProvaApi`**

`src/app/core/api/prova.api.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { ProvaApi } from './prova.api';
import { environment } from '../../../environments/environment';

const API = environment.backendApi;

describe('ProvaApi', () => {
  let api: ProvaApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    api = TestBed.inject(ProvaApi);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('inicia a prova', async () => {
    const p = firstValueFrom(api.iniciar('cp-1'));
    const req = http.expectOne(`${API}candidatoprova/cp-1/iniciarprova`);
    expect(req.request.method).toBe('POST');
    req.flush({ oid: 'cp-1', situacao: 'PROVA_INICIADA' });
    expect((await p).situacao).toBe('PROVA_INICIADA');
  });

  it('lista cadernos', async () => {
    const p = firstValueFrom(api.cadernos('cp-1'));
    http.expectOne(`${API}candidatoprova/cp-1/cadernoprova`).flush([{ oid: 'c1', tipoprova: 'PORTUGUES', questoes: [] }]);
    expect((await p)[0].tipoprova).toBe('PORTUGUES');
  });

  it('consulta a resposta de uma questão', async () => {
    const p = firstValueFrom(api.resposta('q1', 'cp-1'));
    const req = http.expectOne((r) => r.url === `${API}respostacandidato/search/find-resposta-por-questao`);
    expect(req.request.params.get('oidQuestao')).toBe('q1');
    expect(req.request.params.get('oidCandidato')).toBe('cp-1');
    req.flush({ oidAlternativa: 'a2', respostaTextual: null });
    expect((await p)?.oidAlternativa).toBe('a2');
  });

  it('responde questão objetiva com o corpo que o backend espera', async () => {
    const p = firstValueFrom(api.responder('cp-1', { oidQuestao: 'q1', oidAlternativa: 'a2', respostaTextual: null }));
    const req = http.expectOne(`${API}candidatoprova/cp-1/responderquestao`);
    expect(req.request.body).toEqual({ oidQuestao: 'q1', oidAlternativa: 'a2', respostaTextual: null });
    req.flush({});
    await p;
  });

  it('entrega, lista tipos e corrige a objetiva', async () => {
    const e = firstValueFrom(api.entregar('cp-1'));
    http.expectOne(`${API}candidatoprova/cp-1/finalizarprova`).flush({});
    await e;

    const t = firstValueFrom(api.tiposProva('cp-1'));
    http.expectOne(`${API}candidatoprova/cp-1/tipoprova`).flush(['PORTUGUES', 'REDACAO']);
    expect(await t).toContain('REDACAO');

    const c = firstValueFrom(api.corrigirObjetiva('cp-1'));
    http.expectOne(`${API}candidatoprova/cp-1/corrigir-prova-objetiva`).flush('APROVADO');
    expect(await c).toBe('APROVADO');
  });

  it('lê o tempo máximo', async () => {
    const p = firstValueFrom(api.tempoMaximo('cp-1'));
    http.expectOne(`${API}candidato/cp-1/tempo-maximo-prova`).flush({ tempomaximo: '02:00:00' });
    expect((await p).tempomaximo).toBe('02:00:00');
  });
});
```

Run → FAIL (módulo não encontrado).

- [ ] **Step 6: Implementar `ProvaApi`**

`src/app/core/api/prova.api.ts`:

```ts
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CandidatoProva } from '../model/candidato';
import { CadernoProva, RespostaCandidato, TempoMaximo } from '../model/prova';

export interface CorpoResposta {
  oidQuestao: string;
  oidAlternativa: string | null;
  respostaTextual: string | null;
}

@Injectable({ providedIn: 'root' })
export class ProvaApi {
  private readonly http = inject(HttpClient);
  private readonly api = environment.backendApi;

  iniciar(oidCandidatoProva: string): Observable<CandidatoProva> {
    return this.http.post<CandidatoProva>(`${this.api}candidatoprova/${oidCandidatoProva}/iniciarprova`, {});
  }

  cadernos(oidCandidatoProva: string): Observable<CadernoProva[]> {
    return this.http.get<CadernoProva[]>(`${this.api}candidatoprova/${oidCandidatoProva}/cadernoprova`);
  }

  tempoMaximo(oidCandidatoProva: string): Observable<TempoMaximo> {
    return this.http.get<TempoMaximo>(`${this.api}candidato/${oidCandidatoProva}/tempo-maximo-prova`);
  }

  resposta(oidQuestao: string, oidCandidatoProva: string): Observable<RespostaCandidato | null> {
    const params = new HttpParams().set('oidQuestao', oidQuestao).set('oidCandidato', oidCandidatoProva);
    return this.http
      .get<RespostaCandidato | null>(`${this.api}respostacandidato/search/find-resposta-por-questao`, { params })
      .pipe(map((r) => r ?? null));
  }

  responder(oidCandidatoProva: string, corpo: CorpoResposta): Observable<unknown> {
    return this.http.post(`${this.api}candidatoprova/${oidCandidatoProva}/responderquestao`, corpo);
  }

  entregar(oidCandidatoProva: string): Observable<unknown> {
    return this.http.post(`${this.api}candidatoprova/${oidCandidatoProva}/finalizarprova`, {});
  }

  tiposProva(oidCandidatoProva: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.api}candidatoprova/${oidCandidatoProva}/tipoprova`);
  }

  /** Devolve 'APROVADO' | 'REPROVADO' como texto. */
  corrigirObjetiva(oidCandidatoProva: string): Observable<string> {
    return this.http.post(`${this.api}candidatoprova/${oidCandidatoProva}/corrigir-prova-objetiva`, null, { responseType: 'text' });
  }
}
```

Run: `npx ng test --include src/app/core/api/prova.api.spec.ts` → PASS.

- [ ] **Step 7: Commit**

```bash
git add src/app/core
git commit -m "Modelos de domínio e APIs tipadas do candidato e da prova

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: `CandidatoStore` e `RelogioProva`

**Files:**
- Create: `src/app/core/store/candidato.store.ts`
- Create: `src/app/core/tempo/relogio-prova.ts`
- Test: `src/app/core/store/candidato.store.spec.ts`, `src/app/core/tempo/relogio-prova.spec.ts`

**Interfaces:**
- Produces: `CandidatoStore { candidato, oidFip, tentativas, erro; definir(c, oidFip); nome, cpf, curso, turno, unidade, situacao, oidCandidatoProva, podeTentarDeNovo, tipoUnidade, urlSite }`.
- Produces: funções puras `parseTempoMaximo(hms): number`, `calcularRestante(inicio, totalMs, agora): number`, `tomDoTempo(restanteMs, totalMs): UcamProgressTone`, `textoRestante(ms): string`, `formatarHms(ms): string`; serviço `RelogioProva { iniciar(inicio: Date, totalMs: number); parar(); restante; total; tom; texto; hms; esgotado; decorrido }`.

- [ ] **Step 1: Teste do store**

`src/app/core/store/candidato.store.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { CandidatoStore } from './candidato.store';
import { CandidatoProva } from '../model/candidato';

export function candidatoFake(extra: Partial<CandidatoProva> = {}): CandidatoProva {
  return {
    oid: 'cp-1',
    situacao: 'CADASTRADO',
    formaingressopessoa: {
      oid: 'fip-1',
      situacao: 'INSCRITO',
      pessoa: { oid: 'p-1', nome: 'Ana Souza', cpf: { numero: '12345678901' } },
      periodounidadecurso: {
        turnoLabel: 'N',
        unidadecurso: { curso: { nome: 'ENGENHARIA DE SOFTWARE' }, unidade: { oid: 'unid01', sigla: 'Campos', nome: 'Campos' } },
      },
    },
    ...extra,
  };
}

describe('CandidatoStore', () => {
  let store: CandidatoStore;
  beforeEach(() => (store = TestBed.inject(CandidatoStore)));

  it('expõe os dados da entrada em caixa natural', () => {
    store.definir(candidatoFake(), 'fip-1');
    expect(store.nome()).toBe('Ana Souza');
    expect(store.cpf()).toBe('123.456.789-01');
    expect(store.curso()).toBe('Engenharia de software');
    expect(store.turno()).toBe('Noturno');
    expect(store.oidCandidatoProva()).toBe('cp-1');
  });

  it('diz se pode tentar de novo', () => {
    store.tentativas.set({ tentativaAtual: 1, totalTentativasPossiveis: 3 });
    expect(store.podeTentarDeNovo()).toBe(true);
    store.tentativas.set({ tentativaAtual: 3, totalTentativasPossiveis: 3 });
    expect(store.podeTentarDeNovo()).toBe(false);
  });

  it('classifica a unidade e monta a URL do site', () => {
    store.definir(candidatoFake(), 'fip-1');
    expect(store.tipoUnidade()).toBe('PRESENCIAL');
    expect(store.urlSite()).toBe('https://eupossoestudarnacandido.com.br/campos');
    const c = candidatoFake();
    c.formaingressopessoa.periodounidadecurso.unidadecurso.unidade = { oid: 'polo19', sigla: 'Polo Niterói' };
    store.definir(c, 'fip-1');
    expect(store.tipoUnidade()).toBe('EAD');
  });
});
```

Run → FAIL.

- [ ] **Step 2: Implementar o store**

`src/app/core/store/candidato.store.ts`:

```ts
import { Injectable, computed, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { CandidatoProva, Tentativas } from '../model/candidato';

export type TipoUnidade = 'EAD' | 'SEMIPRESENCIAL' | 'PRESENCIAL';

const TURNOS: Record<string, string> = {
  MANHA: 'Manhã', TARDE: 'Tarde', NOITE: 'Noite', DIURNO: 'Diurno', NOTURNO: 'Noturno', M: 'Manhã', T: 'Tarde', N: 'Noturno',
};
const CONTRACOES: Record<string, string> = {
  ENGENHARIA: 'eng.', ANALISE: 'anal.', DESENVOLVIMENTO: 'dev.', SUPERIOR: 'sup.', TECNOLOGIA: 'tec.',
};

export function formatarCpf(n: string): string {
  const d = (n ?? '').replace(/\D/g, '').padStart(11, '0');
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9, 11)}`;
}

export function nomeCurso(nome: string): string {
  if (!nome) return '';
  const t = nome.split(' ').map((p) => CONTRACOES[p] ?? p.toLocaleLowerCase('pt-BR')).join(' ');
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export function slugUnidade(sigla: string): string {
  return sigla.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '-');
}

@Injectable({ providedIn: 'root' })
export class CandidatoStore {
  readonly candidato = signal<CandidatoProva | null>(null);
  readonly oidFip = signal<string | null>(null);
  readonly tentativas = signal<Tentativas | null>(null);
  readonly erro = signal<string | null>(null);

  definir(c: CandidatoProva, oidFip: string): void {
    this.candidato.set(c);
    this.oidFip.set(oidFip);
    this.erro.set(null);
  }

  readonly oidCandidatoProva = computed(() => this.candidato()?.oid ?? null);
  readonly situacao = computed(() => this.candidato()?.situacao ?? null);
  readonly pessoa = computed(() => this.candidato()?.formaingressopessoa.pessoa ?? null);
  readonly nome = computed(() => this.pessoa()?.nome ?? '');
  readonly cpf = computed(() => formatarCpf(this.pessoa()?.cpf.numero ?? ''));
  readonly curso = computed(() => nomeCurso(this.candidato()?.formaingressopessoa.periodounidadecurso.unidadecurso.curso.nome ?? ''));
  readonly turno = computed(() => {
    const t = this.candidato()?.formaingressopessoa.periodounidadecurso.turnoLabel ?? '';
    return TURNOS[t] ?? t;
  });
  readonly unidade = computed(() => this.candidato()?.formaingressopessoa.periodounidadecurso.unidadecurso.unidade ?? null);
  readonly podeTentarDeNovo = computed(() => {
    const t = this.tentativas();
    return !!t && t.tentativaAtual < t.totalTentativasPossiveis;
  });

  readonly tipoUnidade = computed<TipoUnidade>(() => {
    const oid = this.unidade()?.oid ?? '';
    if (oid.startsWith('polo') || oid.startsWith('hibri') || oid === 'unid32') return 'EAD';
    if (oid.startsWith('semi')) return 'SEMIPRESENCIAL';
    return 'PRESENCIAL';
  });

  readonly urlSite = computed(() => {
    if (environment.unidRef === 'unid32') return environment.siteEad;
    const sigla = this.unidade()?.sigla ?? this.unidade()?.nome ?? '';
    return environment.sitePresencialBase + slugUnidade(sigla);
  });

  readonly urlAreaDoInscrito = computed(() => `${environment.formUrl}/${this.pessoa()?.cpf.numero ?? ''}`);
}
```

Run: `npx ng test --include src/app/core/store/candidato.store.spec.ts` → PASS.

- [ ] **Step 3: Teste do relógio**

`src/app/core/tempo/relogio-prova.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { RelogioProva, calcularRestante, formatarHms, parseTempoMaximo, textoRestante, tomDoTempo } from './relogio-prova';

const H = 3_600_000, MIN = 60_000;

describe('funções do relógio', () => {
  it('converte HH:MM:SS em ms', () => {
    expect(parseTempoMaximo('02:00:00')).toBe(2 * H);
    expect(parseTempoMaximo('00:45:30')).toBe(45 * MIN + 30_000);
    expect(parseTempoMaximo('lixo')).toBeNaN();
  });
  it('nunca devolve restante negativo', () => {
    const inicio = new Date('2026-10-01T10:00:00Z');
    expect(calcularRestante(inicio, 2 * H, new Date('2026-10-01T11:00:00Z'))).toBe(H);
    expect(calcularRestante(inicio, 2 * H, new Date('2026-10-01T13:00:00Z'))).toBe(0);
  });
  it('troca de tom no último terço e nos últimos 10 minutos', () => {
    expect(tomDoTempo(90 * MIN, 2 * H)).toBe('neutral');
    expect(tomDoTempo(39 * MIN, 2 * H)).toBe('warning');
    expect(tomDoTempo(9 * MIN, 2 * H)).toBe('danger');
  });
  it('escreve o restante em palavra e em hh:mm:ss', () => {
    expect(textoRestante(42 * MIN + 10_000)).toBe('Faltam 42 min');
    expect(textoRestante(H + 5 * MIN)).toBe('Falta 1 h 5 min');
    expect(textoRestante(50_000)).toBe('Faltam 50 s');
    expect(textoRestante(0)).toBe('Tempo esgotado');
    expect(formatarHms(42 * MIN + 10_000)).toBe('00:42:10');
  });
});

describe('RelogioProva', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('conta a partir do início do servidor e dispara esgotado uma vez só', () => {
    vi.setSystemTime(new Date('2026-10-01T10:30:00Z'));
    const r = TestBed.inject(RelogioProva);
    r.iniciar(new Date('2026-10-01T10:00:00Z'), H);
    expect(r.restante()).toBe(30 * MIN);
    expect(r.esgotado()).toBe(false);
    vi.setSystemTime(new Date('2026-10-01T11:00:01Z')); // aba em segundo plano: salto grande
    vi.advanceTimersByTime(1000);
    expect(r.restante()).toBe(0);
    expect(r.esgotado()).toBe(true);
    vi.advanceTimersByTime(5000);
    expect(r.esgotado()).toBe(true);
    r.parar();
  });
});
```

Run → FAIL.

- [ ] **Step 4: Implementar o relógio**

`src/app/core/tempo/relogio-prova.ts`:

```ts
import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';

export type TomTempo = 'neutral' | 'warning' | 'danger';
const DEZ_MIN = 10 * 60_000;

export function parseTempoMaximo(hms: string): number {
  const m = /^(\d{1,2}):(\d{2}):(\d{2})$/.exec(hms ?? '');
  if (!m) return NaN;
  return (+m[1] * 3600 + +m[2] * 60 + +m[3]) * 1000;
}

export function calcularRestante(inicio: Date, totalMs: number, agora: Date): number {
  return Math.max(0, inicio.getTime() + totalMs - agora.getTime());
}

export function tomDoTempo(restanteMs: number, totalMs: number): TomTempo {
  if (restanteMs <= DEZ_MIN) return 'danger';
  if (restanteMs <= totalMs / 3) return 'warning';
  return 'neutral';
}

export function textoRestante(ms: number): string {
  if (ms <= 0) return 'Tempo esgotado';
  const totalMin = Math.floor(ms / 60_000);
  if (totalMin === 0) {
    const s = Math.floor(ms / 1000);
    return `${s === 1 ? 'Falta' : 'Faltam'} ${s} s`;
  }
  const h = Math.floor(totalMin / 60), min = totalMin % 60;
  const partes = [h ? `${h} h` : '', min ? `${min} min` : ''].filter(Boolean).join(' ');
  const plural = h === 1 && min === 0 ? false : h === 0 ? min !== 1 : true;
  return `${h === 1 ? 'Falta' : plural ? 'Faltam' : 'Falta'} ${partes}`;
}

export function formatarHms(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(Math.floor(s / 3600))}:${p(Math.floor((s % 3600) / 60))}:${p(s % 60)}`;
}

@Injectable({ providedIn: 'root' })
export class RelogioProva {
  private readonly inicio = signal<Date | null>(null);
  private readonly agora = signal<number>(Date.now());
  private intervalo: ReturnType<typeof setInterval> | null = null;

  readonly total = signal<number>(0);
  readonly restante = computed(() => {
    const i = this.inicio();
    return i ? calcularRestante(i, this.total(), new Date(this.agora())) : 0;
  });
  readonly decorrido = computed(() => this.total() - this.restante());
  readonly tom = computed(() => tomDoTempo(this.restante(), this.total()));
  readonly texto = computed(() => textoRestante(this.restante()));
  readonly hms = computed(() => formatarHms(this.restante()));
  readonly esgotado = computed(() => this.inicio() !== null && this.restante() === 0);

  constructor() {
    inject(DestroyRef).onDestroy(() => this.parar());
  }

  iniciar(inicio: Date, totalMs: number): void {
    this.parar();
    this.total.set(totalMs);
    this.inicio.set(inicio);
    this.agora.set(Date.now());
    this.intervalo = setInterval(() => this.agora.set(Date.now()), 1000);
  }

  parar(): void {
    if (this.intervalo) clearInterval(this.intervalo);
    this.intervalo = null;
  }
}
```

Run: `npx ng test --include src/app/core/tempo/relogio-prova.spec.ts` → PASS. (Se a regra de "Falta/Faltam" do `textoRestante` não bater com os quatro casos do teste, ajuste a função — os textos do teste são a referência.)

- [ ] **Step 5: Commit**

```bash
git add src/app/core
git commit -m "CandidatoStore e relógio da prova com tons e texto em palavra

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: `FilaRespostas` — gravação com fila offline

**Files:**
- Create: `src/app/core/offline/fila-respostas.ts`
- Test: `src/app/core/offline/fila-respostas.spec.ts`

**Interfaces:**
- Consumes: `ProvaApi.responder(oidCp, corpo)`.
- Produces: `FilaRespostas { carregar(oidCp); pendentes: Signal<RespostaPendente[]>; estado: Signal<'salvo'|'salvando'|'pendente'|'erro'>; enviar(oidCp, corpo): Promise<'enviada'|'pendente'>; reenviar(oidCp): Promise<number>; limpar(oidCp) }`.

- [ ] **Step 1: Teste**

`src/app/core/offline/fila-respostas.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { FilaRespostas } from './fila-respostas';
import { ProvaApi } from '../api/prova.api';

describe('FilaRespostas', () => {
  const responder = vi.fn();
  let fila: FilaRespostas;

  beforeEach(() => {
    localStorage.clear();
    responder.mockReset();
    TestBed.configureTestingModule({ providers: [{ provide: ProvaApi, useValue: { responder } }] });
    fila = TestBed.inject(FilaRespostas);
    fila.carregar('cp-1');
  });

  const corpo = { oidQuestao: 'q1', oidAlternativa: 'a1', respostaTextual: null };

  it('envia na hora quando a rede responde', async () => {
    responder.mockReturnValue(of({}));
    expect(await fila.enviar('cp-1', corpo)).toBe('enviada');
    expect(fila.pendentes()).toHaveLength(0);
    expect(fila.estado()).toBe('salvo');
  });

  it('enfileira em falha e persiste no localStorage', async () => {
    responder.mockReturnValue(throwError(() => new Error('rede')));
    expect(await fila.enviar('cp-1', corpo)).toBe('pendente');
    expect(fila.pendentes()).toHaveLength(1);
    expect(fila.estado()).toBe('pendente');
    expect(JSON.parse(localStorage.getItem('fila:cp-1')!)).toHaveLength(1);
  });

  it('substitui a resposta pendente da mesma questão', async () => {
    responder.mockReturnValue(throwError(() => new Error('rede')));
    await fila.enviar('cp-1', corpo);
    await fila.enviar('cp-1', { ...corpo, oidAlternativa: 'a3' });
    expect(fila.pendentes()).toHaveLength(1);
    expect(fila.pendentes()[0].oidAlternativa).toBe('a3');
  });

  it('reenvia o que ficou pendente e devolve quantas restam', async () => {
    responder.mockReturnValueOnce(throwError(() => new Error('rede')));
    await fila.enviar('cp-1', corpo);
    responder.mockReturnValue(of({}));
    expect(await fila.reenviar('cp-1')).toBe(0);
    expect(fila.estado()).toBe('salvo');
  });
});
```

Run → FAIL.

- [ ] **Step 2: Implementar**

`src/app/core/offline/fila-respostas.ts`:

```ts
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CorpoResposta, ProvaApi } from '../api/prova.api';

export interface RespostaPendente extends CorpoResposta { em: number; }
export type EstadoSalvamento = 'salvo' | 'salvando' | 'pendente' | 'erro';

@Injectable({ providedIn: 'root' })
export class FilaRespostas {
  private readonly api = inject(ProvaApi);
  private readonly salvando = signal(0);
  readonly pendentes = signal<RespostaPendente[]>([]);
  readonly estado = computed<EstadoSalvamento>(() =>
    this.salvando() > 0 ? 'salvando' : this.pendentes().length ? 'pendente' : 'salvo',
  );

  private chave(oidCp: string) { return `fila:${oidCp}`; }

  carregar(oidCp: string): void {
    try {
      this.pendentes.set(JSON.parse(localStorage.getItem(this.chave(oidCp)) ?? '[]'));
    } catch {
      this.pendentes.set([]);
    }
  }

  private persistir(oidCp: string, lista: RespostaPendente[]): void {
    this.pendentes.set(lista);
    try { localStorage.setItem(this.chave(oidCp), JSON.stringify(lista)); } catch { /* sem storage: fica só em memória */ }
  }

  async enviar(oidCp: string, corpo: CorpoResposta): Promise<'enviada' | 'pendente'> {
    this.salvando.update((n) => n + 1);
    try {
      await firstValueFrom(this.api.responder(oidCp, corpo));
      this.persistir(oidCp, this.pendentes().filter((p) => p.oidQuestao !== corpo.oidQuestao));
      return 'enviada';
    } catch {
      const semEsta = this.pendentes().filter((p) => p.oidQuestao !== corpo.oidQuestao);
      this.persistir(oidCp, [...semEsta, { ...corpo, em: Date.now() }]);
      return 'pendente';
    } finally {
      this.salvando.update((n) => n - 1);
    }
  }

  /** Tenta esvaziar a fila; devolve quantas continuam pendentes. */
  async reenviar(oidCp: string): Promise<number> {
    for (const p of [...this.pendentes()]) {
      const { em, ...corpo } = p;
      await this.enviar(oidCp, corpo);
    }
    return this.pendentes().length;
  }

  limpar(oidCp: string): void {
    this.persistir(oidCp, []);
  }
}
```

Run → PASS.

- [ ] **Step 3: Commit**

```bash
git add src/app/core/offline
git commit -m "Fila offline de respostas com reenvio e estado de salvamento

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5: Guard do candidato e redirecionamento por situação

**Files:**
- Create: `src/app/core/guards/destino-por-situacao.ts`, `src/app/core/guards/candidato.guard.ts`, `src/app/core/navegador.ts`
- Test: `src/app/core/guards/destino-por-situacao.spec.ts`, `src/app/core/guards/candidato.guard.spec.ts`

**Interfaces:**
- Consumes: `CandidatoApi`, `CandidatoStore`.
- Produces: `type Tela = 'entrada' | 'instrucoes' | 'prova' | 'resultado'`; `destinoPorSituacao(c: CandidatoProva, tela: Tela): 'ok' | 'externo' | Tela`; `candidatoGuard: CanActivateFn` (lê `route.paramMap.get('oid')`, `route.data['tela']`, `route.queryParamMap.get('tentativa')`); `Navegador { irParaExterno(url) }`; rota de erro `/candidato/:oid/erro`.

- [ ] **Step 1: Teste da função pura**

`src/app/core/guards/destino-por-situacao.spec.ts`:

```ts
import { destinoPorSituacao } from './destino-por-situacao';
import { candidatoFake } from '../store/candidato.store.spec';

describe('destinoPorSituacao', () => {
  it('CADASTRADO vê entrada e instruções; prova e resultado voltam à entrada', () => {
    const c = candidatoFake({ situacao: 'CADASTRADO' });
    expect(destinoPorSituacao(c, 'entrada')).toBe('ok');
    expect(destinoPorSituacao(c, 'instrucoes')).toBe('ok');
    expect(destinoPorSituacao(c, 'prova')).toBe('entrada');
    expect(destinoPorSituacao(c, 'resultado')).toBe('entrada');
  });
  it('PROVA_INICIADA só vê a prova', () => {
    const c = candidatoFake({ situacao: 'PROVA_INICIADA' });
    expect(destinoPorSituacao(c, 'prova')).toBe('ok');
    expect(destinoPorSituacao(c, 'entrada')).toBe('prova');
    expect(destinoPorSituacao(c, 'instrucoes')).toBe('prova');
  });
  it('PROVA_FINALIZADA vê entrada e resultado', () => {
    const c = candidatoFake({ situacao: 'PROVA_FINALIZADA' });
    expect(destinoPorSituacao(c, 'resultado')).toBe('ok');
    expect(destinoPorSituacao(c, 'entrada')).toBe('ok');
    expect(destinoPorSituacao(c, 'prova')).toBe('resultado');
  });
  it('PROVA_CORRIGIDA aprovado vai para fora; reprovado vê o resultado', () => {
    const ap = candidatoFake({ situacao: 'PROVA_CORRIGIDA' });
    ap.formaingressopessoa.situacao = 'APROVADO';
    expect(destinoPorSituacao(ap, 'entrada')).toBe('externo');
    const rep = candidatoFake({ situacao: 'PROVA_CORRIGIDA' });
    rep.formaingressopessoa.situacao = 'REPROVADO';
    expect(destinoPorSituacao(rep, 'entrada')).toBe('ok');
    expect(destinoPorSituacao(rep, 'resultado')).toBe('ok');
    expect(destinoPorSituacao(rep, 'prova')).toBe('resultado');
  });
});
```

- [ ] **Step 2: Implementar a função**

`src/app/core/guards/destino-por-situacao.ts`:

```ts
import { CandidatoProva } from '../model/candidato';

export type Tela = 'entrada' | 'instrucoes' | 'prova' | 'resultado';

const PERMITIDAS: Record<CandidatoProva['situacao'], Tela[]> = {
  CADASTRADO: ['entrada', 'instrucoes'],
  PROVA_INICIADA: ['prova'],
  PROVA_FINALIZADA: ['entrada', 'resultado'],
  PROVA_CORRIGIDA: ['entrada', 'resultado'],
};
const PADRAO: Record<CandidatoProva['situacao'], Tela> = {
  CADASTRADO: 'entrada',
  PROVA_INICIADA: 'prova',
  PROVA_FINALIZADA: 'resultado',
  PROVA_CORRIGIDA: 'resultado',
};

export function destinoPorSituacao(c: CandidatoProva, tela: Tela): 'ok' | 'externo' | Tela {
  if (c.situacao === 'PROVA_CORRIGIDA' && ['APROVADO', 'MATRICULADO'].includes(c.formaingressopessoa.situacao)) {
    return 'externo';
  }
  const permitidas = PERMITIDAS[c.situacao] ?? ['entrada'];
  return permitidas.includes(tela) ? 'ok' : (PADRAO[c.situacao] ?? 'entrada');
}
```

Run: `npx ng test --include src/app/core/guards/destino-por-situacao.spec.ts` → PASS.

- [ ] **Step 3: `Navegador` (para testar redirecionamento externo)**

`src/app/core/navegador.ts`:

```ts
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class Navegador {
  irParaExterno(url: string): void {
    window.location.href = url;
  }
}
```

- [ ] **Step 4: Teste do guard**

`src/app/core/guards/candidato.guard.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { candidatoGuard } from './candidato.guard';
import { CandidatoApi } from '../api/candidato.api';
import { CandidatoStore } from '../store/candidato.store';
import { Navegador } from '../navegador';
import { candidatoFake } from '../store/candidato.store.spec';

function rota(tela: string, tentativa?: string): ActivatedRouteSnapshot {
  return {
    paramMap: convertToParamMap({ oid: 'fip-1' }),
    queryParamMap: convertToParamMap(tentativa ? { tentativa } : {}),
    data: { tela },
  } as unknown as ActivatedRouteSnapshot;
}

describe('candidatoGuard', () => {
  const api = { buscar: vi.fn(), criar: vi.fn(), tentativas: vi.fn() };
  const navegador = { irParaExterno: vi.fn() };

  beforeEach(() => {
    Object.values(api).forEach((f) => f.mockReset());
    navegador.irParaExterno.mockReset();
    api.tentativas.mockReturnValue(of({ tentativaAtual: 1, totalTentativasPossiveis: 3 }));
    TestBed.configureTestingModule({
      providers: [{ provide: CandidatoApi, useValue: api }, { provide: Navegador, useValue: navegador }],
    });
  });

  const run = (tela: string, tentativa?: string) =>
    TestBed.runInInjectionContext(() => candidatoGuard(rota(tela, tentativa), {} as RouterStateSnapshot)) as Promise<boolean | UrlTree>;

  it('tenta criar com a tentativa, cai na busca e libera a tela permitida', async () => {
    api.criar.mockReturnValue(throwError(() => new Error('já existe')));
    api.buscar.mockReturnValue(of(candidatoFake({ situacao: 'CADASTRADO' })));
    expect(await run('entrada')).toBe(true);
    expect(api.criar).toHaveBeenCalledWith('fip-1', '1');
    expect(TestBed.inject(CandidatoStore).oidCandidatoProva()).toBe('cp-1');
  });

  it('cria o candidato quando a busca não encontra', async () => {
    api.criar.mockReturnValueOnce(throwError(() => new Error('x'))).mockReturnValueOnce(of(candidatoFake()));
    api.buscar.mockReturnValue(of(null));
    expect(await run('entrada')).toBe(true);
    expect(api.criar).toHaveBeenLastCalledWith('fip-1', undefined);
  });

  it('redireciona para a prova quando ela já começou', async () => {
    api.criar.mockReturnValue(throwError(() => new Error('x')));
    api.buscar.mockReturnValue(of(candidatoFake({ situacao: 'PROVA_INICIADA' })));
    const r = await run('entrada');
    expect(TestBed.inject(Router).serializeUrl(r as UrlTree)).toBe('/candidato/fip-1/prova');
  });

  it('manda o aprovado para a área do inscrito', async () => {
    const c = candidatoFake({ situacao: 'PROVA_CORRIGIDA' });
    c.formaingressopessoa.situacao = 'APROVADO';
    api.criar.mockReturnValue(throwError(() => new Error('x')));
    api.buscar.mockReturnValue(of(c));
    expect(await run('entrada')).toBe(false);
    expect(navegador.irParaExterno).toHaveBeenCalledWith(expect.stringContaining('12345678901'));
  });

  it('vai para a tela de erro quando o backend falha', async () => {
    api.criar.mockReturnValue(throwError(() => new Error('x')));
    api.buscar.mockReturnValue(throwError(() => new Error('rede')));
    const r = await run('entrada');
    expect(TestBed.inject(Router).serializeUrl(r as UrlTree)).toBe('/candidato/fip-1/erro');
    expect(TestBed.inject(CandidatoStore).erro()).toBeTruthy();
  });
});
```

Run → FAIL.

- [ ] **Step 5: Implementar o guard**

`src/app/core/guards/candidato.guard.ts`:

```ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { CandidatoApi } from '../api/candidato.api';
import { CandidatoProva } from '../model/candidato';
import { Navegador } from '../navegador';
import { CandidatoStore } from '../store/candidato.store';
import { Tela, destinoPorSituacao } from './destino-por-situacao';

export const candidatoGuard: CanActivateFn = async (route) => {
  const api = inject(CandidatoApi);
  const store = inject(CandidatoStore);
  const router = inject(Router);
  const navegador = inject(Navegador);

  const oid = route.paramMap.get('oid')!;
  const tela = route.data['tela'] as Tela;
  // O legado sempre tenta registrar a tentativa (1 por padrão) e, se o
  // backend recusar, busca o registro existente. Mantido igual.
  const tentativa = route.queryParamMap.get('tentativa') ?? '1';

  let candidato: CandidatoProva | null;
  try {
    candidato = await firstValueFrom(api.criar(oid, tentativa)).catch(() => null);
    candidato ??= await firstValueFrom(api.buscar(oid));
    candidato ??= await firstValueFrom(api.criar(oid));
  } catch {
    store.erro.set('Não conseguimos localizar sua inscrição.');
    return router.createUrlTree(['/candidato', oid, 'erro']);
  }

  store.definir(candidato, oid);
  firstValueFrom(api.tentativas(oid)).then((t) => store.tentativas.set(t)).catch(() => {});

  const destino = destinoPorSituacao(candidato, tela);
  if (destino === 'ok') return true;
  if (destino === 'externo') {
    navegador.irParaExterno(store.urlAreaDoInscrito());
    return false;
  }
  return router.createUrlTree(['/candidato', oid, ...(destino === 'entrada' ? [] : [destino])]);
};
```

Run: `npx ng test --include src/app/core/guards/candidato.guard.spec.ts` → PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/core
git commit -m "Guard do candidato: recupera pelo oid e redireciona pela situação

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 6: Rotas, moldura e telas de entrada, erro e sem link

**Files:**
- Modify: `src/app/app.routes.ts`
- Create: `src/app/layout/moldura.ts`
- Create: `src/app/candidato/entrada/entrada.ts`, `src/app/candidato/entrada/entrada.html`
- Create: `src/app/candidato/erro/erro.ts`, `src/app/candidato/sem-link/sem-link.ts`
- Test: `src/app/candidato/entrada/entrada.spec.ts`, `src/app/candidato/sem-link/sem-link.spec.ts`

**Interfaces:**
- Consumes: `CandidatoStore`, `candidatoGuard`, `Tela`.
- Produces: `Moldura` (`<app-moldura [titulo]>`: `ucam-app-shell` configurado; slot padrão para o conteúdo e `[ucamShellAcoes]` repassado); rotas finais: `''` (SemLinkPage), `candidato/:oid` (EntradaPage), `candidato/:oid/instrucoes`, `candidato/:oid/prova` (+ filhos `''`, `redacao`, `:caderno/:n`), `candidato/:oid/resultado`, `candidato/:oid/erro`.

- [ ] **Step 1: Rotas (com os componentes das Tasks 7, 9, 10, 12 e 13 por `loadComponent`, para que compile já)**

`src/app/app.routes.ts`:

```ts
import { Routes } from '@angular/router';
import { candidatoGuard } from './core/guards/candidato.guard';

export const routes: Routes = [
  {
    path: 'candidato/:oid',
    children: [
      { path: '', pathMatch: 'full', loadComponent: () => import('./candidato/entrada/entrada').then((m) => m.EntradaPage), canActivate: [candidatoGuard], data: { tela: 'entrada' } },
      { path: 'instrucoes', loadComponent: () => import('./candidato/instrucoes/instrucoes').then((m) => m.InstrucoesPage), canActivate: [candidatoGuard], data: { tela: 'instrucoes' } },
      {
        path: 'prova',
        loadComponent: () => import('./candidato/prova/prova').then((m) => m.ProvaPage),
        canActivate: [candidatoGuard],
        data: { tela: 'prova' },
        children: [
          { path: '', pathMatch: 'full', loadComponent: () => import('./candidato/prova/prova-inicio').then((m) => m.ProvaInicio) },
          { path: 'redacao', loadComponent: () => import('./candidato/prova/redacao/redacao').then((m) => m.RedacaoPage) },
          { path: ':caderno/:n', loadComponent: () => import('./candidato/prova/questao/questao').then((m) => m.QuestaoPage) },
        ],
      },
      { path: 'resultado', loadComponent: () => import('./candidato/resultado/resultado').then((m) => m.ResultadoPage), canActivate: [candidatoGuard], data: { tela: 'resultado' } },
      { path: 'erro', loadComponent: () => import('./candidato/erro/erro').then((m) => m.ErroPage) },
    ],
  },
  { path: '', pathMatch: 'full', loadComponent: () => import('./candidato/sem-link/sem-link').then((m) => m.SemLinkPage) },
  { path: '**', redirectTo: '' },
];
```

Até as tasks seguintes existirem, crie os arquivos citados com um componente vazio (`@Component({ template: '' }) export class XPage {}`) para o build passar; cada task substitui o seu.

- [ ] **Step 2: Moldura**

`src/app/layout/moldura.ts`:

```ts
import { Component, inject, input } from '@angular/core';
import { UcamAppShell } from '@ucam/ui';
import { CandidatoStore } from '../core/store/candidato.store';

/**
 * A moldura de toda tela depois da entrada: faixa com o nome do sistema, a
 * unidade como contexto e o nome do candidato. Sem navegação lateral — o
 * candidato tem um caminho só.
 */
@Component({
  selector: 'app-moldura',
  imports: [UcamAppShell],
  template: `
    <ucam-app-shell
      systemName="Vestibular Online"
      systemIcon="graduationCap"
      systemCategory="academico"
      [user]="usuario()"
      [homeHref]="home()"
      [navGroups]="[]"
      [navCollapsed]="true"
      maxContentWidth="72rem">
      <ng-content select="[ucamShellAcoes]" ucamShellAcoes />
      <ng-content />
    </ucam-app-shell>
  `,
})
export class Moldura {
  private readonly store = inject(CandidatoStore);
  readonly usuario = () => (this.store.nome() ? { name: this.store.nome() } : null);
  readonly home = () => `/candidato/${this.store.oidFip() ?? ''}`;
}
```

- [ ] **Step 3: Teste da entrada (falha)**

`src/app/candidato/entrada/entrada.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { EntradaPage } from './entrada';
import { CandidatoStore } from '../../core/store/candidato.store';
import { candidatoFake } from '../../core/store/candidato.store.spec';

describe('EntradaPage', () => {
  async function montar(situacao: 'CADASTRADO' | 'PROVA_FINALIZADA' = 'CADASTRADO', tentativas = { tentativaAtual: 1, totalTentativasPossiveis: 3 }) {
    await TestBed.configureTestingModule({ imports: [EntradaPage], providers: [provideRouter([])] }).compileComponents();
    const store = TestBed.inject(CandidatoStore);
    store.definir(candidatoFake({ situacao }), 'fip-1');
    store.tentativas.set(tentativas);
    const f = TestBed.createComponent(EntradaPage);
    await f.whenStable();
    return f.nativeElement as HTMLElement;
  }

  it('mostra os dados em lista de descrição e um h1 só', async () => {
    const el = await montar();
    expect(el.querySelectorAll('h1')).toHaveLength(1);
    expect(el.textContent).toContain('Ana Souza');
    expect(el.textContent).toContain('123.456.789-01');
    expect(el.textContent).toContain('Engenharia de software');
    expect(el.textContent).toContain('Noturno');
  });

  it('a ação nomeia o destino', async () => {
    expect((await montar('CADASTRADO')).querySelector('ucam-button')?.textContent).toContain('Entrar na prova');
    expect((await montar('PROVA_FINALIZADA')).querySelector('ucam-button')?.textContent).toContain('Ver resultado');
  });

  it('sem tentativas, explica e desabilita', async () => {
    const el = await montar('CADASTRADO', { tentativaAtual: 3, totalTentativasPossiveis: 3 });
    expect(el.querySelector('ucam-alert')?.textContent).toContain('3 tentativas');
    expect(el.querySelector('ucam-button button')?.matches('[disabled],[aria-disabled="true"]')).toBe(true);
  });
});
```

- [ ] **Step 4: Implementar a entrada**

`src/app/candidato/entrada/entrada.ts`:

```ts
import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { UcamAlert, UcamButton, UcamDescriptionList, UcamIcon } from '@ucam/ui';
import { CandidatoStore } from '../../core/store/candidato.store';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-entrada',
  imports: [UcamAlert, UcamButton, UcamDescriptionList, UcamIcon],
  templateUrl: './entrada.html',
})
export class EntradaPage {
  readonly store = inject(CandidatoStore);
  private readonly router = inject(Router);
  readonly contato = environment.contatoSecretaria;

  readonly itens = computed(() => [
    { label: 'Nome', value: this.store.nome() },
    { label: 'CPF', value: this.store.cpf() },
    { label: 'Curso', value: this.store.curso() },
    { label: 'Turno', value: this.store.turno() },
  ]);

  readonly jaEntregou = computed(() => ['PROVA_FINALIZADA', 'PROVA_CORRIGIDA'].includes(this.store.situacao() ?? ''));
  readonly rotulo = computed(() => (this.jaEntregou() ? 'Ver resultado' : 'Entrar na prova'));

  /** Só bloqueia quando a prova corrigida pede nova tentativa e ela não existe. */
  readonly semTentativas = computed(() => this.store.situacao() !== 'PROVA_INICIADA' && this.store.tentativas() !== null && !this.store.podeTentarDeNovo() && this.store.situacao() === 'PROVA_CORRIGIDA');
  readonly totalTentativas = computed(() => this.store.tentativas()?.totalTentativasPossiveis ?? 0);

  seguir(): void {
    const oid = this.store.oidFip();
    this.router.navigate(['/candidato', oid, this.jaEntregou() ? 'resultado' : 'instrucoes']);
  }
}
```

`src/app/candidato/entrada/entrada.html` (estrutura da tela de referência `portal/login`, classes do `@ucam/css`):

```html
<main class="ucam-login">
  <section class="ucam-login__acesso" aria-labelledby="t-entrada">
    <div class="ucam-login__miolo ucam-stack ucam-stack--lg">
      <div class="ucam-login__marca">
        <img class="ucam-login__logo" src="assets/logo-ucam.svg" alt="Universidade Candido Mendes" />
      </div>
      <div class="ucam-stack ucam-stack--sm">
        <h1 class="ucam-page-header__title" id="t-entrada">Confira seus dados</h1>
        <p class="ucam-lede">Se algo estiver errado, fale com a secretaria antes de começar.</p>
      </div>

      @if (semTentativas()) {
        <ucam-alert tone="warning">Você já usou as {{ totalTentativas() }} tentativas desta inscrição.</ucam-alert>
      }

      <ucam-description-list [items]="itens()" [columns]="1" layout="stacked" />

      <div class="ucam-stack ucam-stack--sm">
        <ucam-button variant="primary" size="lg" [disabled]="semTentativas()" (click)="seguir()">{{ rotulo() }}</ucam-button>
        @if (semTentativas()) {
          <p class="ucam-field__hint">Sem tentativa disponível, não há como entrar na prova. Fale com a secretaria.</p>
        }
      </div>

      <p class="ucam-login__apoio">
        <ucam-icon name="clock" size="sm" aria-hidden="true" />
        Esta prova tem tempo para ser feita. O relógio começa quando você clicar em Iniciar prova.
        <br />Dúvidas: <a class="ucam-link" href="mailto:{{ contato }}">{{ contato }}</a>
      </p>
    </div>
  </section>

  <aside class="ucam-login__institucional" aria-label="Sobre a prova">
    <div class="ucam-login__discurso">
      <p class="ucam-login__frase">O vestibular da Candido Mendes, no seu tempo e no seu aparelho.</p>
      <ul class="ucam-login__sistemas">
        <li class="ucam-login__sistema"><span class="ucam-login__sistema-nome">Prova com tempo</span><span class="ucam-login__sistema-apoio">O relógio fica à vista o tempo todo.</span></li>
        <li class="ucam-login__sistema"><span class="ucam-login__sistema-nome">Tudo salvo sozinho</span><span class="ucam-login__sistema-apoio">Cada resposta é gravada na hora.</span></li>
        <li class="ucam-login__sistema"><span class="ucam-login__sistema-nome">Resultado na tela</span><span class="ucam-login__sistema-apoio">Ao entregar, você vê o que vem depois.</span></li>
      </ul>
    </div>
  </aside>
</main>
```

Copie `processo-seletivo-frontend/src/assets/images/logo-ucam-cinza-horizontal.svg` para `public/assets/logo-ucam.svg`.

Run: `npx ng test --include src/app/candidato/entrada/entrada.spec.ts` → PASS. Se o `ucam-description-list` renderizar o valor em outro nó, ajuste o seletor do teste, não o template.

- [ ] **Step 5: Erro e sem link**

`src/app/candidato/erro/erro.ts`:

```ts
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { UcamButton, UcamEmptyState } from '@ucam/ui';
import { CandidatoStore } from '../../core/store/candidato.store';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-erro',
  imports: [UcamButton, UcamEmptyState],
  template: `
    <main class="ucam-content ucam-content--estreita">
      <ucam-empty-state reason="error" title="Não conseguimos localizar sua inscrição"
        [description]="'Confira o link que veio no e-mail de inscrição. Se o problema continuar, fale com a secretaria: ' + contato">
        <ucam-button variant="primary" (click)="tentar()">Tentar de novo</ucam-button>
      </ucam-empty-state>
    </main>
  `,
})
export class ErroPage {
  private readonly store = inject(CandidatoStore);
  private readonly router = inject(Router);
  readonly contato = environment.contatoSecretaria;
  tentar(): void { this.router.navigate(['/candidato', this.store.oidFip()]); }
}
```

`src/app/candidato/sem-link/sem-link.ts`:

```ts
import { Component } from '@angular/core';
import { UcamEmptyState } from '@ucam/ui';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-sem-link',
  imports: [UcamEmptyState],
  template: `
    <main class="ucam-content ucam-content--estreita">
      <h1 class="ucam-sr-only">Vestibular Online</h1>
      <ucam-empty-state reason="no-access" title="Use o link da sua inscrição"
        [description]="'Para fazer a prova, abra o link que a universidade enviou por e-mail. Dúvidas: ' + contato" />
    </main>
  `,
})
export class SemLinkPage { readonly contato = environment.contatoSecretaria; }
```

`src/app/candidato/sem-link/sem-link.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { SemLinkPage } from './sem-link';

it('explica como chegar à prova', async () => {
  await TestBed.configureTestingModule({ imports: [SemLinkPage] }).compileComponents();
  const f = TestBed.createComponent(SemLinkPage);
  await f.whenStable();
  expect(f.nativeElement.textContent).toContain('link');
  expect(f.nativeElement.textContent).toContain('secretaria');
});
```

- [ ] **Step 6: Build, testes, auditoria, commit**

Run: `npx ng build && npx ng test --include src/app/candidato && npm run ds:checar`
Esperado: tudo verde; a auditoria sem erros (avisos anotados no commit se ficarem).
Abra `http://localhost:4200/candidato/<oid real do ambiente>` com o backend local: a tela mostra nome, CPF, curso e turno.

```bash
git add -A
git commit -m "Rotas do candidato, moldura e telas de entrada, erro e sem link

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 7: Instruções

**Files:**
- Create: `src/app/candidato/instrucoes/instrucoes.ts`, `src/app/candidato/instrucoes/instrucoes.html`
- Test: `src/app/candidato/instrucoes/instrucoes.spec.ts`

**Interfaces:**
- Consumes: `ProvaApi.iniciar`, `ProvaApi.tempoMaximo`, `ProvaApi.cadernos`, `CandidatoStore`, `Moldura`, `parseTempoMaximo`, `rotuloTipoProva`, `ehRedacao`.

- [ ] **Step 1: Teste**

`src/app/candidato/instrucoes/instrucoes.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { InstrucoesPage } from './instrucoes';
import { ProvaApi } from '../../core/api/prova.api';
import { CandidatoStore } from '../../core/store/candidato.store';
import { candidatoFake } from '../../core/store/candidato.store.spec';

describe('InstrucoesPage', () => {
  const api = {
    iniciar: vi.fn(() => of(candidatoFake({ situacao: 'PROVA_INICIADA' }))),
    tempoMaximo: vi.fn(() => of({ tempomaximo: '02:00:00' })),
    cadernos: vi.fn(() => of([{ oid: 'c1', tipoprova: 'PORTUGUES', questoes: [] }, { oid: 'c2', tipoprova: 'REDACAO', questoes: [] }])),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [InstrucoesPage], providers: [provideRouter([]), { provide: ProvaApi, useValue: api }] }).compileComponents();
    TestBed.inject(CandidatoStore).definir(candidatoFake(), 'fip-1');
  });

  it('resume a prova com tempo, cadernos e redação', async () => {
    const f = TestBed.createComponent(InstrucoesPage);
    await f.whenStable();
    const t = f.nativeElement.textContent;
    expect(t).toContain('2 h');
    expect(t).toContain('Português');
    expect(t).toContain('Redação');
  });

  it('inicia e vai para a prova', async () => {
    const f = TestBed.createComponent(InstrucoesPage);
    await f.whenStable();
    const nav = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    f.componentInstance.iniciar();
    await f.whenStable();
    expect(api.iniciar).toHaveBeenCalledWith('cp-1');
    expect(nav).toHaveBeenCalledWith(['/candidato', 'fip-1', 'prova']);
  });
});
```

- [ ] **Step 2: Implementar**

`src/app/candidato/instrucoes/instrucoes.ts`:

```ts
import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { UcamAlert, UcamButton, UcamDescriptionList, UcamIcon, UcamPageHeader, UcamSkeleton } from '@ucam/ui';
import { ProvaApi } from '../../core/api/prova.api';
import { ehRedacao, rotuloTipoProva } from '../../core/model/prova';
import { CandidatoStore } from '../../core/store/candidato.store';
import { parseTempoMaximo, textoRestante } from '../../core/tempo/relogio-prova';
import { Moldura } from '../../layout/moldura';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-instrucoes',
  imports: [Moldura, UcamAlert, UcamButton, UcamDescriptionList, UcamIcon, UcamPageHeader, UcamSkeleton],
  templateUrl: './instrucoes.html',
})
export class InstrucoesPage {
  private readonly api = inject(ProvaApi);
  private readonly store = inject(CandidatoStore);
  private readonly router = inject(Router);

  readonly carregando = signal(true);
  readonly iniciando = signal(false);
  readonly erro = signal<string | null>(null);
  readonly tempoMs = signal(environment.duracaoPadraoMs);
  readonly tipos = signal<string[]>([]);

  readonly tempoTexto = computed(() => textoRestante(this.tempoMs()).replace(/^Faltam? /, ''));
  readonly resumo = computed(() => [
    { label: 'Tempo', value: this.tempoTexto() },
    { label: 'Cadernos', value: this.tipos().filter((t) => !ehRedacao(t)).map(rotuloTipoProva).join(', ') || null },
    { label: 'Redação', value: this.tipos().some(ehRedacao) ? 'Sim' : 'Não' },
  ]);

  constructor() {
    this.carregar();
  }

  private async carregar(): Promise<void> {
    const oid = this.store.oidCandidatoProva()!;
    try {
      const [tempo, cadernos] = await Promise.all([
        firstValueFrom(this.api.tempoMaximo(oid)).catch(() => ({ tempomaximo: '' })),
        firstValueFrom(this.api.cadernos(oid)),
      ]);
      const ms = parseTempoMaximo(tempo.tempomaximo);
      if (!Number.isNaN(ms)) this.tempoMs.set(ms);
      this.tipos.set(cadernos.map((c) => c.tipoprova));
    } catch {
      this.erro.set('Não conseguimos carregar os dados da prova.');
    } finally {
      this.carregando.set(false);
    }
  }

  async iniciar(): Promise<void> {
    if (this.iniciando()) return;
    this.iniciando.set(true);
    this.erro.set(null);
    try {
      const c = await firstValueFrom(this.api.iniciar(this.store.oidCandidatoProva()!));
      this.store.definir(c, this.store.oidFip()!);
      await this.router.navigate(['/candidato', this.store.oidFip(), 'prova']);
    } catch {
      this.erro.set('Não conseguimos iniciar a prova. Tente de novo.');
    } finally {
      this.iniciando.set(false);
    }
  }
}
```

`src/app/candidato/instrucoes/instrucoes.html`:

```html
<app-moldura>
  <ucam-page-header variante="pagina" title="Antes de começar" description="Leia com calma. A prova só começa quando você clicar em Iniciar prova." />

  <div class="ucam-content ucam-content--estreita ucam-stack ucam-stack--lg">
    <ul class="ucam-stack" aria-label="Como a prova funciona">
      <li class="ucam-cluster"><ucam-icon name="monitor" aria-hidden="true" /><span>Funciona no computador e no celular. Se a conexão cair, suas respostas ficam guardadas e são enviadas quando ela voltar.</span></li>
      <li class="ucam-cluster"><ucam-icon name="clock" aria-hidden="true" /><span>O tempo fica à vista no topo. A barra avisa quando faltar um terço e quando faltarem 10 minutos.</span></li>
      <li class="ucam-cluster"><ucam-icon name="circleCheck" aria-hidden="true" /><span>Cada resposta é salva na hora. Você pode mudar de ideia até entregar a prova.</span></li>
    </ul>

    @if (carregando()) {
      <ucam-skeleton variant="text" [lines]="3" />
    } @else {
      <ucam-description-list [items]="resumo()" layout="inline" [columns]="1" />
    }

    <ucam-alert tone="info">Ao clicar em Iniciar prova, o tempo de {{ tempoTexto() }} começa a contar e não para.</ucam-alert>

    @if (erro()) {
      <ucam-alert tone="danger" live="assertive">{{ erro() }}</ucam-alert>
    }

    <div class="ucam-cluster ucam-cluster--fim">
      <ucam-button variant="primary" size="lg" [loading]="iniciando()" (click)="iniciar()">Iniciar prova</ucam-button>
    </div>
  </div>
</app-moldura>
```

Run: `npx ng test --include src/app/candidato/instrucoes && npm run ds:checar` → PASS, sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/app/candidato/instrucoes
git commit -m "Tela de instruções com resumo da prova e início

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 8: `ProvaStore` — cadernos, posição, respostas e navegação

**Files:**
- Create: `src/app/core/store/prova.store.ts`
- Test: `src/app/core/store/prova.store.spec.ts`

**Interfaces:**
- Consumes: `ProvaApi.cadernos`, `ProvaApi.resposta`, `FilaRespostas`, tipos de `prova.ts`.
- Produces: `ProvaStore { carregar(oidCp): Promise<void>; estado: 'carregando'|'pronto'|'vazio'|'erro'; cadernos; objetivos (sem redação); redacao: CadernoProva|null; questaoRedacao; respostas: Signal<Record<oidQuestao, string|null>>; textoRedacao; posicao: {caderno: string(slug), n: number}|null; definirPosicao(slug, n); questaoAtual; cadernoAtual; totalObjetivas; respondidas; emBranco(): {slug, n, numeroGlobal}[]; primeiraEmBranco(): {slug,n}|null; proxima(): {slug,n}|'redacao'|'fim'; anterior(): {slug,n}|null; responder(oidQuestao, oidAlternativa): Promise<void>; salvarRedacao(texto): Promise<void>; caracteresRedacao: Signal<number>; redacaoAtingeMinimo }`.

- [ ] **Step 1: Teste**

`src/app/core/store/prova.store.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { ProvaStore } from './prova.store';
import { ProvaApi } from '../api/prova.api';
import { FilaRespostas } from '../offline/fila-respostas';

const q = (oid: string) => ({ oid, descricao: `<p>${oid}</p>`, alternativas: [{ oid: `${oid}-a`, descricao: 'A' }, { oid: `${oid}-b`, descricao: 'B' }] });
const cadernos = [
  { oid: 'c1', tipoprova: 'PORTUGUES', questoes: [q('p1'), q('p2')] },
  { oid: 'c2', tipoprova: 'MATEMATICA', questoes: [q('m1')] },
  { oid: 'c3', tipoprova: 'REDACAO', questoes: [{ oid: 'r1', descricao: 'Tema', alternativas: [] }] },
];

describe('ProvaStore', () => {
  const api = { cadernos: vi.fn(() => of(cadernos)), resposta: vi.fn() };
  const fila = { enviar: vi.fn(async () => 'enviada' as const), carregar: vi.fn() };
  let store: ProvaStore;

  beforeEach(async () => {
    api.resposta.mockImplementation((oid: string) => of(oid === 'p2' ? { oidAlternativa: 'p2-b', respostaTextual: null } : oid === 'r1' ? { oidAlternativa: null, respostaTextual: 'texto salvo' } : null));
    TestBed.configureTestingModule({ providers: [{ provide: ProvaApi, useValue: api }, { provide: FilaRespostas, useValue: fila }] });
    store = TestBed.inject(ProvaStore);
    await store.carregar('cp-1');
  });

  it('separa objetivas de redação e carrega as respostas existentes', () => {
    expect(store.estado()).toBe('pronto');
    expect(store.objetivos().map((c) => c.tipoprova)).toEqual(['PORTUGUES', 'MATEMATICA']);
    expect(store.redacao()?.tipoprova).toBe('REDACAO');
    expect(store.totalObjetivas()).toBe(3);
    expect(store.respondidas()).toBe(1);
    expect(store.textoRedacao()).toBe('texto salvo');
  });

  it('navega entre cadernos e termina na redação', () => {
    store.definirPosicao('portugues', 2);
    expect(store.questaoAtual()?.oid).toBe('p2');
    expect(store.proxima()).toEqual({ slug: 'matematica', n: 1 });
    store.definirPosicao('matematica', 1);
    expect(store.proxima()).toBe('redacao');
    expect(store.anterior()).toEqual({ slug: 'portugues', n: 2 });
    store.definirPosicao('portugues', 1);
    expect(store.anterior()).toBeNull();
  });

  it('lista as em branco com número global e acha a primeira', () => {
    expect(store.emBranco().map((e) => e.numeroGlobal)).toEqual([1, 3]);
    expect(store.primeiraEmBranco()).toEqual({ slug: 'portugues', n: 1 });
  });

  it('responder marca localmente e manda para a fila', async () => {
    await store.responder('p1', 'p1-a');
    expect(store.respostas()['p1']).toBe('p1-a');
    expect(store.respondidas()).toBe(2);
    expect(fila.enviar).toHaveBeenCalledWith('cp-1', { oidQuestao: 'p1', oidAlternativa: 'p1-a', respostaTextual: null });
  });

  it('conta caracteres não brancos da redação', async () => {
    await store.salvarRedacao('abc de  f\n');
    expect(store.caracteresRedacao()).toBe(6);
    expect(store.redacaoAtingeMinimo()).toBe(false);
    await store.salvarRedacao('x'.repeat(300));
    expect(store.redacaoAtingeMinimo()).toBe(true);
  });
});
```

- [ ] **Step 2: Implementar**

`src/app/core/store/prova.store.ts`:

```ts
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ProvaApi } from '../api/prova.api';
import { CadernoProva, Questao, ehRedacao, slugTipoProva } from '../model/prova';
import { FilaRespostas } from '../offline/fila-respostas';

export interface Posicao { slug: string; n: number; }
export interface EmBranco extends Posicao { numeroGlobal: number; }
export type EstadoProva = 'carregando' | 'pronto' | 'vazio' | 'erro';

export function contarCaracteres(texto: string): number {
  return (texto.match(/\S/g) ?? []).length;
}

@Injectable({ providedIn: 'root' })
export class ProvaStore {
  private readonly api = inject(ProvaApi);
  private readonly fila = inject(FilaRespostas);
  private oidCp = '';

  readonly estado = signal<EstadoProva>('carregando');
  readonly cadernos = signal<CadernoProva[]>([]);
  readonly respostas = signal<Record<string, string | null>>({});
  readonly textoRedacao = signal('');
  readonly posicao = signal<Posicao | null>(null);

  readonly objetivos = computed(() => this.cadernos().filter((c) => !ehRedacao(c.tipoprova)));
  readonly redacao = computed(() => this.cadernos().find((c) => ehRedacao(c.tipoprova)) ?? null);
  readonly questaoRedacao = computed(() => this.redacao()?.questoes[0] ?? null);
  readonly totalObjetivas = computed(() => this.objetivos().reduce((s, c) => s + c.questoes.length, 0));
  readonly respondidas = computed(() => this.objetivos().flatMap((c) => c.questoes).filter((q) => !!this.respostas()[q.oid]).length);
  readonly caracteresRedacao = computed(() => contarCaracteres(this.textoRedacao()));
  readonly redacaoAtingeMinimo = computed(() => !this.redacao() || this.caracteresRedacao() >= environment.redacaoMin);

  readonly cadernoAtual = computed(() => {
    const p = this.posicao();
    return p ? this.objetivos().find((c) => slugTipoProva(c.tipoprova) === p.slug) ?? null : null;
  });
  readonly questaoAtual = computed<Questao | null>(() => this.cadernoAtual()?.questoes[(this.posicao()?.n ?? 1) - 1] ?? null);

  async carregar(oidCp: string): Promise<void> {
    this.oidCp = oidCp;
    this.estado.set('carregando');
    this.fila.carregar(oidCp);
    try {
      const cadernos = await firstValueFrom(this.api.cadernos(oidCp));
      this.cadernos.set(cadernos ?? []);
      if (!cadernos?.length) { this.estado.set('vazio'); return; }
      const questoes = cadernos.flatMap((c) => c.questoes);
      const respostas = await Promise.all(
        questoes.map((q) => firstValueFrom(this.api.resposta(q.oid, oidCp)).catch(() => null)),
      );
      const mapa: Record<string, string | null> = {};
      questoes.forEach((q, i) => {
        const r = respostas[i];
        if (r?.oidAlternativa) mapa[q.oid] = r.oidAlternativa;
        if (r?.respostaTextual && ehRedacao(cadernos.find((c) => c.questoes.includes(q))!.tipoprova)) this.textoRedacao.set(r.respostaTextual);
      });
      this.respostas.set(mapa);
      this.estado.set('pronto');
    } catch {
      this.estado.set('erro');
    }
  }

  definirPosicao(slug: string, n: number): void {
    this.posicao.set({ slug, n });
  }

  private sequencia(): Posicao[] {
    return this.objetivos().flatMap((c) => c.questoes.map((_, i) => ({ slug: slugTipoProva(c.tipoprova), n: i + 1 })));
  }

  private indiceAtual(): number {
    const p = this.posicao();
    return p ? this.sequencia().findIndex((s) => s.slug === p.slug && s.n === p.n) : -1;
  }

  proxima(): Posicao | 'redacao' | 'fim' {
    const seq = this.sequencia(), i = this.indiceAtual();
    if (i >= 0 && i < seq.length - 1) return seq[i + 1];
    return this.redacao() ? 'redacao' : 'fim';
  }

  anterior(): Posicao | null {
    const i = this.indiceAtual();
    return i > 0 ? this.sequencia()[i - 1] : null;
  }

  emBranco(): EmBranco[] {
    const r = this.respostas();
    return this.objetivos()
      .flatMap((c) => c.questoes.map((q, i) => ({ q, slug: slugTipoProva(c.tipoprova), n: i + 1 })))
      .map((x, idx) => ({ ...x, numeroGlobal: idx + 1 }))
      .filter((x) => !r[x.q.oid])
      .map(({ slug, n, numeroGlobal }) => ({ slug, n, numeroGlobal }));
  }

  primeiraEmBranco(): Posicao | null {
    const b = this.emBranco()[0];
    return b ? { slug: b.slug, n: b.n } : this.sequencia()[0] ?? null;
  }

  async responder(oidQuestao: string, oidAlternativa: string): Promise<void> {
    this.respostas.update((r) => ({ ...r, [oidQuestao]: oidAlternativa }));
    await this.fila.enviar(this.oidCp, { oidQuestao, oidAlternativa, respostaTextual: null });
  }

  async salvarRedacao(texto: string): Promise<void> {
    this.textoRedacao.set(texto);
    const q = this.questaoRedacao();
    if (q) await this.fila.enviar(this.oidCp, { oidQuestao: q.oid, oidAlternativa: null, respostaTextual: texto });
  }
}
```

Run: `npx ng test --include src/app/core/store/prova.store.spec.ts` → PASS.

- [ ] **Step 3: Commit**

```bash
git add src/app/core/store
git commit -m "ProvaStore: cadernos, posição, respostas e navegação entre questões

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 9: Página da prova — cabeçalho com relógio e salvamento, mapa de questões, redirecionamento inicial

**Files:**
- Create: `src/app/candidato/prova/prova.ts`, `src/app/candidato/prova/prova.html`
- Create: `src/app/candidato/prova/cabecalho-prova.ts`
- Create: `src/app/candidato/prova/mapa-questoes.ts`
- Create: `src/app/candidato/prova/prova-inicio.ts`
- Test: `src/app/candidato/prova/mapa-questoes.spec.ts`, `src/app/candidato/prova/cabecalho-prova.spec.ts`

**Interfaces:**
- Consumes: `ProvaStore`, `RelogioProva`, `FilaRespostas`, `CandidatoStore`, `CandidatoApi.dados`, `ProvaApi.tempoMaximo`, `Moldura`.
- Produces: `ProvaPage` (carrega store + relógio, hospeda `<router-outlet>` dentro de `.ucam-split`, abre o `MapaQuestoes` em `ucam-drawer` abaixo de `lg`, emite `entregar` quando o relógio esgota — ligado ao `EntregaDialog` na Task 11); `CabecalhoProva` (inputs: nenhum; lê os serviços); `MapaQuestoes` (output `navegar: Posicao | 'redacao'`); `ProvaInicio` (redireciona para `primeiraEmBranco()`).

- [ ] **Step 1: Teste do mapa**

`src/app/candidato/prova/mapa-questoes.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { MapaQuestoes } from './mapa-questoes';
import { ProvaStore } from '../../core/store/prova.store';

describe('MapaQuestoes', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [MapaQuestoes] }).compileComponents();
    const store = TestBed.inject(ProvaStore);
    store.cadernos.set([
      { oid: 'c1', tipoprova: 'PORTUGUES', questoes: [{ oid: 'p1', descricao: '', alternativas: [] }, { oid: 'p2', descricao: '', alternativas: [] }] },
      { oid: 'c3', tipoprova: 'REDACAO', questoes: [{ oid: 'r1', descricao: '', alternativas: [] }] },
    ]);
    store.respostas.set({ p2: 'x' });
    store.definirPosicao('portugues', 1);
  });

  it('nomeia cada botão com o estado e marca a atual', async () => {
    const f = TestBed.createComponent(MapaQuestoes);
    await f.whenStable();
    const botoes = f.nativeElement.querySelectorAll('button[data-questao]') as NodeListOf<HTMLButtonElement>;
    expect(botoes).toHaveLength(2);
    expect(botoes[0].getAttribute('aria-label')).toBe('Questão 1, em branco');
    expect(botoes[0].getAttribute('aria-current')).toBe('page');
    expect(botoes[1].getAttribute('aria-label')).toBe('Questão 2, respondida');
    expect(f.nativeElement.textContent).toContain('1 de 2');
    expect(f.nativeElement.textContent).toContain('Redação');
  });

  it('emite a posição ao clicar', async () => {
    const f = TestBed.createComponent(MapaQuestoes);
    await f.whenStable();
    const emitidos: unknown[] = [];
    f.componentInstance.navegar.subscribe((p) => emitidos.push(p));
    (f.nativeElement.querySelectorAll('button[data-questao]')[1] as HTMLButtonElement).click();
    expect(emitidos).toEqual([{ slug: 'portugues', n: 2 }]);
  });
});
```

- [ ] **Step 2: Implementar o mapa**

`src/app/candidato/prova/mapa-questoes.ts`:

```ts
import { Component, computed, inject, output } from '@angular/core';
import { UcamIcon, UcamSectionBar } from '@ucam/ui';
import { rotuloTipoProva, slugTipoProva } from '../../core/model/prova';
import { Posicao, ProvaStore } from '../../core/store/prova.store';

interface ItemMapa { slug: string; n: number; respondida: boolean; atual: boolean; }
interface GrupoMapa { slug: string; rotulo: string; respondidas: number; itens: ItemMapa[]; }

/**
 * Navegação da prova. Estado por questão em cor E palavra (nome acessível),
 * alvo mínimo de 24px pela classe do DS, atual com aria-current.
 */
@Component({
  selector: 'app-mapa-questoes',
  imports: [UcamIcon, UcamSectionBar],
  template: `
    <nav class="ucam-stack ucam-stack--lg" aria-label="Questões da prova">
      @for (g of grupos(); track g.slug) {
        <section class="ucam-stack ucam-stack--sm">
          <ucam-section-bar [title]="g.rotulo" [level]="3" [count]="g.respondidas + ' de ' + g.itens.length" [rule]="true" />
          <ol class="ucam-choice-grid" data-mapa>
            @for (i of g.itens; track i.n) {
              <li>
                <button type="button" class="ucam-btn ucam-btn--sm" [class.ucam-btn--secondary]="i.respondida" [class.ucam-btn--ghost]="!i.respondida"
                  [attr.data-questao]="i.slug + '/' + i.n"
                  [attr.aria-current]="i.atual ? 'page' : null"
                  [attr.aria-label]="'Questão ' + i.n + ', ' + (i.respondida ? 'respondida' : 'em branco')"
                  (click)="navegar.emit({ slug: i.slug, n: i.n })">
                  {{ i.n }}
                </button>
              </li>
            }
          </ol>
        </section>
      }
      @if (store.redacao()) {
        <section class="ucam-stack ucam-stack--sm">
          <ucam-section-bar title="Redação" [level]="3" [count]="estadoRedacao()" [rule]="true" />
          <button type="button" class="ucam-btn ucam-btn--sm ucam-btn--ghost" [attr.aria-current]="naRedacao() ? 'page' : null" (click)="navegar.emit('redacao')">
            <ucam-icon name="pencil" size="sm" aria-hidden="true" /> Abrir a redação
          </button>
        </section>
      }
    </nav>
  `,
})
export class MapaQuestoes {
  readonly store = inject(ProvaStore);
  readonly navegar = output<Posicao | 'redacao'>();

  readonly naRedacao = computed(() => this.store.posicao() === null && !!this.store.redacao());
  readonly estadoRedacao = computed(() =>
    this.store.caracteresRedacao() === 0 ? 'em branco' : this.store.redacaoAtingeMinimo() ? 'mínimo atingido' : 'rascunho',
  );

  readonly grupos = computed<GrupoMapa[]>(() => {
    const r = this.store.respostas(), p = this.store.posicao();
    return this.store.objetivos().map((c) => {
      const slug = slugTipoProva(c.tipoprova);
      const itens = c.questoes.map((q, i) => ({ slug, n: i + 1, respondida: !!r[q.oid], atual: p?.slug === slug && p?.n === i + 1 }));
      return { slug, rotulo: rotuloTipoProva(c.tipoprova), respondidas: itens.filter((x) => x.respondida).length, itens };
    });
  });
}
```

Run: `npx ng test --include src/app/candidato/prova/mapa-questoes.spec.ts` → PASS.

- [ ] **Step 3: Teste do cabeçalho**

`src/app/candidato/prova/cabecalho-prova.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { CabecalhoProva } from './cabecalho-prova';
import { RelogioProva } from '../../core/tempo/relogio-prova';
import { FilaRespostas } from '../../core/offline/fila-respostas';
import { ProvaStore } from '../../core/store/prova.store';
import { signal } from '@angular/core';

describe('CabecalhoProva', () => {
  const fila = { estado: signal<'salvo' | 'salvando' | 'pendente'>('salvo'), pendentes: signal([{}, {}, {}]) };

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-01T10:00:00Z'));
    await TestBed.configureTestingModule({ imports: [CabecalhoProva], providers: [{ provide: FilaRespostas, useValue: fila }] }).compileComponents();
    TestBed.inject(RelogioProva).iniciar(new Date('2026-10-01T09:30:00Z'), 60 * 60_000);
    const store = TestBed.inject(ProvaStore);
    store.cadernos.set([{ oid: 'c1', tipoprova: 'PORTUGUES', questoes: [{ oid: 'p1', descricao: '', alternativas: [] }] }]);
  });
  afterEach(() => vi.useRealTimers());

  it('mostra o tempo em palavra, a barra com tom e o progresso', async () => {
    const f = TestBed.createComponent(CabecalhoProva);
    await f.whenStable();
    const t = f.nativeElement.textContent;
    expect(t).toContain('Faltam 30 min');
    expect(t).toContain('00:30:00');
    expect(t).toContain('0 de 1 respondidas');
    expect(t).toContain('Salvo');
  });

  it('diz quantas respostas estão pendentes', async () => {
    fila.estado.set('pendente');
    const f = TestBed.createComponent(CabecalhoProva);
    await f.whenStable();
    expect(f.nativeElement.textContent).toContain('3 respostas serão enviadas');
  });
});
```

- [ ] **Step 4: Implementar o cabeçalho**

`src/app/candidato/prova/cabecalho-prova.ts`:

```ts
import { Component, computed, effect, inject, signal } from '@angular/core';
import { UcamIcon, UcamProgress } from '@ucam/ui';
import { FilaRespostas } from '../../core/offline/fila-respostas';
import { ProvaStore } from '../../core/store/prova.store';
import { RelogioProva } from '../../core/tempo/relogio-prova';

/**
 * Barra fixa da prova: relógio em palavra e em barra, progresso e estado de
 * salvamento. O anúncio para leitor de tela acontece só nas trocas de tom e
 * no último minuto — nunca a cada segundo.
 */
@Component({
  selector: 'app-cabecalho-prova',
  imports: [UcamIcon, UcamProgress],
  template: `
    <header class="ucam-viewbar" aria-label="Andamento da prova">
      <div class="ucam-viewbar__fileira">
        <h1 class="ucam-page-header__title">Prova objetiva <span class="ucam-sr-only">, {{ progresso() }}</span></h1>
        <span class="ucam-viewbar__contagem" aria-hidden="true">{{ progresso() }}</span>
        <span class="ucam-viewbar__folga"></span>
        <p class="ucam-cluster" data-salvamento>
          @switch (fila.estado()) {
            @case ('salvando') { <ucam-icon name="loaderCircle" size="sm" aria-hidden="true" /> Salvando… }
            @case ('pendente') { <ucam-icon name="triangleAlert" size="sm" aria-hidden="true" /> Sem conexão. {{ fila.pendentes().length }} respostas serão enviadas quando ela voltar. }
            @default { <ucam-icon name="circleCheck" size="sm" aria-hidden="true" /> Salvo }
          }
        </p>
      </div>
      <div class="ucam-viewbar__fileira">
        <ucam-progress label="Tempo da prova" [value]="relogio.decorrido()" [max]="relogio.total()" [tone]="relogio.tom()"
          [valueText]="relogio.texto()" [legendStart]="relogio.texto()" [legendEnd]="relogio.hms()" />
        <p class="ucam-sr-only" aria-live="polite">{{ anuncio() }}</p>
      </div>
    </header>
  `,
})
export class CabecalhoProva {
  readonly relogio = inject(RelogioProva);
  readonly fila = inject(FilaRespostas);
  readonly store = inject(ProvaStore);

  readonly progresso = computed(() => `${this.store.respondidas()} de ${this.store.totalObjetivas()} respondidas`);
  readonly anuncio = signal('');

  constructor() {
    let tomAnterior = this.relogio.tom();
    let avisouUmMinuto = false;
    effect(() => {
      const tom = this.relogio.tom(), restante = this.relogio.restante();
      if (tom !== tomAnterior) {
        tomAnterior = tom;
        if (tom === 'warning') this.anuncio.set(`Atenção: ${this.relogio.texto()}.`);
        if (tom === 'danger') this.anuncio.set(`Atenção: faltam menos de 10 minutos. ${this.relogio.texto()}.`);
      }
      if (!avisouUmMinuto && restante > 0 && restante <= 60_000) {
        avisouUmMinuto = true;
        this.anuncio.set('Falta 1 minuto. A prova será entregue automaticamente no fim do tempo.');
      }
    });
  }
}
```

Run: `npx ng test --include src/app/candidato/prova/cabecalho-prova.spec.ts` → PASS.

- [ ] **Step 5: Página da prova e redirecionamento inicial**

`src/app/candidato/prova/prova.ts`:

```ts
import { Component, computed, effect, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { UcamAlert, UcamButton, UcamDrawer, UcamEmptyState, UcamSkeleton } from '@ucam/ui';
import { CandidatoApi } from '../../core/api/candidato.api';
import { ProvaApi } from '../../core/api/prova.api';
import { FilaRespostas } from '../../core/offline/fila-respostas';
import { CandidatoStore } from '../../core/store/candidato.store';
import { Posicao, ProvaStore } from '../../core/store/prova.store';
import { RelogioProva, parseTempoMaximo } from '../../core/tempo/relogio-prova';
import { Moldura } from '../../layout/moldura';
import { CabecalhoProva } from './cabecalho-prova';
import { MapaQuestoes } from './mapa-questoes';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-prova',
  imports: [RouterOutlet, Moldura, CabecalhoProva, MapaQuestoes, UcamAlert, UcamButton, UcamDrawer, UcamEmptyState, UcamSkeleton],
  templateUrl: './prova.html',
})
export class ProvaPage {
  readonly store = inject(ProvaStore);
  readonly candidato = inject(CandidatoStore);
  readonly relogio = inject(RelogioProva);
  readonly fila = inject(FilaRespostas);
  private readonly provaApi = inject(ProvaApi);
  private readonly candidatoApi = inject(CandidatoApi);
  private readonly router = inject(Router);

  readonly mapaAberto = signal(false);
  readonly contato = environment.contatoSecretaria;
  /** Ligado ao diálogo de entrega na Task 11. */
  readonly pedirEntrega = signal<'manual' | 'tempo' | null>(null);

  constructor() {
    const oidCp = this.candidato.oidCandidatoProva()!;
    this.store.carregar(oidCp);
    this.ligarRelogio(oidCp);
    window.addEventListener('online', () => this.fila.reenviar(oidCp));
    effect(() => {
      if (this.relogio.esgotado()) this.pedirEntrega.set('tempo');
    });
  }

  private async ligarRelogio(oidCp: string): Promise<void> {
    const inicioServidor = this.candidato.candidato()?.horarioinicio;
    const inicio = inicioServidor ? new Date(inicioServidor) : new Date();
    const tempo = await firstValueFrom(this.provaApi.tempoMaximo(oidCp)).catch(() => ({ tempomaximo: '' }));
    const ms = parseTempoMaximo(tempo.tempomaximo);
    this.relogio.iniciar(inicio, Number.isNaN(ms) ? environment.duracaoPadraoMs : ms);
  }

  irPara(destino: Posicao | 'redacao'): void {
    this.mapaAberto.set(false);
    const base = ['/candidato', this.candidato.oidFip(), 'prova'];
    this.router.navigate(destino === 'redacao' ? [...base, 'redacao'] : [...base, destino.slug, destino.n]);
  }

  recarregar(): void {
    this.store.carregar(this.candidato.oidCandidatoProva()!);
  }
}
```

`src/app/candidato/prova/prova.html`:

```html
<app-moldura>
  <a ucamShellAcoes class="ucam-link" [href]="'/candidato/' + candidato.oidFip() + '/instrucoes'" target="_blank" rel="noopener">Instruções</a>

  @switch (store.estado()) {
    @case ('carregando') {
      <div class="ucam-content ucam-stack"><ucam-skeleton variant="heading" /><ucam-skeleton variant="text" [lines]="6" /></div>
    }
    @case ('vazio') {
      <div class="ucam-content">
        <ucam-empty-state reason="error" title="Esta prova ainda não tem caderno cadastrado" [description]="'Fale com a secretaria: ' + contato" />
      </div>
    }
    @case ('erro') {
      <div class="ucam-content ucam-stack">
        <ucam-alert tone="danger" live="assertive">Não conseguimos carregar a prova. Confira sua conexão e tente de novo.</ucam-alert>
        <ucam-button variant="primary" (click)="recarregar()">Tentar de novo</ucam-button>
      </div>
    }
    @default {
      <app-cabecalho-prova />
      <div class="ucam-corpo">
        <div class="ucam-cluster ucam-cluster--fim lg:hidden">
          <ucam-button variant="secondary" size="sm" iconStart="listChecks" (click)="mapaAberto.set(true)">Questões</ucam-button>
        </div>
        <div class="ucam-split">
          <div class="ucam-stack ucam-stack--lg"><router-outlet /></div>
          <aside class="ucam-aside hidden lg:block" aria-label="Mapa de questões"><app-mapa-questoes (navegar)="irPara($event)" /></aside>
        </div>
      </div>
      <ucam-drawer [(open)]="mapaAberto" title="Questões" side="end" size="sm">
        <app-mapa-questoes (navegar)="irPara($event)" />
      </ucam-drawer>
    }
  }
</app-moldura>
```

`src/app/candidato/prova/prova-inicio.ts`:

```ts
import { Component, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CandidatoStore } from '../../core/store/candidato.store';
import { ProvaStore } from '../../core/store/prova.store';

/** `/prova` sem questão: vai para a primeira em branco assim que a prova carrega. */
@Component({ selector: 'app-prova-inicio', template: '' })
export class ProvaInicio {
  constructor() {
    const store = inject(ProvaStore), candidato = inject(CandidatoStore), router = inject(Router);
    effect(() => {
      if (store.estado() !== 'pronto') return;
      const p = store.primeiraEmBranco();
      const base = ['/candidato', candidato.oidFip(), 'prova'];
      router.navigate(p ? [...base, p.slug, p.n] : [...base, 'redacao'], { replaceUrl: true });
    });
  }
}
```

- [ ] **Step 6: Build, auditoria e commit**

Run: `npx ng build && npx ng test --include src/app/candidato/prova && npm run ds:checar`
Abra `/candidato/<oid>/prova` com um candidato em `PROVA_INICIADA`: cabeçalho com relógio, mapa à direita (ou botão "Questões" no celular); a 390px nada rola na horizontal.

```bash
git add -A
git commit -m "Página da prova: relógio, salvamento, mapa de questões e redirecionamento inicial

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 10: Questão objetiva e diretiva de proteção

**Files:**
- Create: `src/app/core/directives/prova-protegida.ts`
- Create: `src/app/candidato/prova/questao/questao.ts`, `src/app/candidato/prova/questao/questao.html`
- Test: `src/app/core/directives/prova-protegida.spec.ts`, `src/app/candidato/prova/questao/questao.spec.ts`

**Interfaces:**
- Consumes: `ProvaStore` (`definirPosicao`, `questaoAtual`, `cadernoAtual`, `respostas`, `responder`, `proxima`, `anterior`), `ProvaPage.pedirEntrega` (via `inject(ProvaPage)`), inputs de rota `caderno` e `n` (`withComponentInputBinding`).
- Produces: `QuestaoPage`; diretiva `[appProvaProtegida]`.

- [ ] **Step 1: Teste da diretiva**

`src/app/core/directives/prova-protegida.spec.ts`:

```ts
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ProvaProtegida } from './prova-protegida';

@Component({ imports: [ProvaProtegida], template: `<div appProvaProtegida>texto</div>` })
class Host {}

it('impede copiar, recortar, colar e menu de contexto dentro do elemento', async () => {
  await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
  const f = TestBed.createComponent(Host);
  await f.whenStable();
  const div = f.nativeElement.querySelector('div') as HTMLElement;
  for (const tipo of ['copy', 'cut', 'paste', 'contextmenu']) {
    const ev = new Event(tipo, { bubbles: true, cancelable: true });
    div.dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(true);
  }
});
```

- [ ] **Step 2: Implementar a diretiva**

`src/app/core/directives/prova-protegida.ts`:

```ts
import { Directive } from '@angular/core';

/** Bloqueio leve, só no elemento da questão ou da redação. Nada global, nada de teclas. */
@Directive({
  selector: '[appProvaProtegida]',
  host: {
    '(copy)': 'bloquear($event)',
    '(cut)': 'bloquear($event)',
    '(paste)': 'bloquear($event)',
    '(contextmenu)': 'bloquear($event)',
  },
})
export class ProvaProtegida {
  bloquear(e: Event): void { e.preventDefault(); }
}
```

Run → PASS.

- [ ] **Step 3: Teste da questão**

`src/app/candidato/prova/questao/questao.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { QuestaoPage } from './questao';
import { ProvaStore } from '../../../core/store/prova.store';
import { CandidatoStore } from '../../../core/store/candidato.store';
import { candidatoFake } from '../../../core/store/candidato.store.spec';
import { ProvaPage } from '../prova';

const alt = (oid: string, html: string) => ({ oid, descricao: html });
const cadernos = [
  { oid: 'c1', tipoprova: 'PORTUGUES', questoes: [
    { oid: 'p1', descricao: '<p>Enunciado 1</p>', textoreferencia: '<p>Texto base</p>', alternativas: [alt('a', '<em>um</em>'), alt('b', 'dois'), alt('c', 'três'), alt('d', 'quatro'), alt('e', 'cinco')] },
    { oid: 'p2', descricao: '<p>Enunciado 2</p>', alternativas: [alt('f', 'x'), alt('g', 'y')] },
  ] },
];

describe('QuestaoPage', () => {
  const pedirEntrega = signal<'manual' | 'tempo' | null>(null);
  let store: ProvaStore;

  async function montar(caderno = 'portugues', n = 1) {
    await TestBed.configureTestingModule({ imports: [QuestaoPage], providers: [provideRouter([]), { provide: ProvaPage, useValue: { pedirEntrega } }] }).compileComponents();
    TestBed.inject(CandidatoStore).definir(candidatoFake({ situacao: 'PROVA_INICIADA' }), 'fip-1');
    store = TestBed.inject(ProvaStore);
    store.cadernos.set(cadernos);
    store.estado.set('pronto');
    vi.spyOn(store, 'responder').mockResolvedValue();
    const f = TestBed.createComponent(QuestaoPage);
    f.componentRef.setInput('caderno', caderno);
    f.componentRef.setInput('n', n);
    await f.whenStable();
    return f;
  }

  it('mostra caderno, número, enunciado em HTML e cinco alternativas com letra', async () => {
    const f = await montar();
    const el = f.nativeElement as HTMLElement;
    expect(el.querySelector('h2')?.textContent).toContain('Português · Questão 1 de 2');
    expect(el.querySelector('[data-enunciado] p')?.textContent).toBe('Enunciado 1');
    const labels = el.querySelectorAll('label.ucam-choice-card');
    expect(labels).toHaveLength(5);
    expect(labels[0].textContent).toContain('A');
    expect(labels[0].querySelector('em')?.textContent).toBe('um');
    expect(el.querySelectorAll('input[type=radio][name="questao-p1"]')).toHaveLength(5);
  });

  it('grava ao escolher e marca a alternativa', async () => {
    const f = await montar();
    const radio = f.nativeElement.querySelector('input[value="b"]') as HTMLInputElement;
    radio.click();
    await f.whenStable();
    expect(store.responder).toHaveBeenCalledWith('p1', 'b');
  });

  it('anterior fica desabilitada na primeira, com o motivo; próxima navega', async () => {
    const f = await montar();
    const nav = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const botoes = f.nativeElement.querySelectorAll('ucam-button');
    expect(botoes[0].querySelector('button')?.matches('[disabled],[aria-disabled="true"]')).toBe(true);
    expect(f.nativeElement.textContent).toContain('primeira questão');
    f.componentInstance.proxima();
    expect(nav).toHaveBeenCalledWith(['/candidato', 'fip-1', 'prova', 'portugues', 2]);
  });

  it('na última questão a ação vira Entregar prova', async () => {
    const f = await montar('portugues', 2);
    expect(f.nativeElement.textContent).toContain('Entregar prova');
    f.componentInstance.proxima();
    expect(pedirEntrega()).toBe('manual');
  });
});
```

- [ ] **Step 4: Implementar a questão**

`src/app/candidato/prova/questao/questao.ts`:

```ts
import { Component, computed, effect, inject, input, numberAttribute } from '@angular/core';
import { Router } from '@angular/router';
import { UcamBadge, UcamButton, UcamIcon, UcamTooltip } from '@ucam/ui';
import { ProvaProtegida } from '../../../core/directives/prova-protegida';
import { rotuloTipoProva } from '../../../core/model/prova';
import { CandidatoStore } from '../../../core/store/candidato.store';
import { ProvaStore } from '../../../core/store/prova.store';
import { ProvaPage } from '../prova';

const LETRAS = 'ABCDEFG';

@Component({
  selector: 'app-questao',
  imports: [UcamBadge, UcamButton, UcamIcon, UcamTooltip, ProvaProtegida],
  templateUrl: './questao.html',
})
export class QuestaoPage {
  readonly caderno = input.required<string>();
  readonly n = input.required<number, string | number>({ transform: numberAttribute });

  readonly store = inject(ProvaStore);
  private readonly candidato = inject(CandidatoStore);
  private readonly router = inject(Router);
  private readonly pagina = inject(ProvaPage);

  readonly rotuloCaderno = computed(() => rotuloTipoProva(this.store.cadernoAtual()?.tipoprova ?? ''));
  readonly totalNoCaderno = computed(() => this.store.cadernoAtual()?.questoes.length ?? 0);
  readonly questao = this.store.questaoAtual;
  readonly escolhida = computed(() => this.store.respostas()[this.questao()?.oid ?? ''] ?? null);
  readonly alternativas = computed(() => (this.questao()?.alternativas ?? []).map((a, i) => ({ ...a, letra: LETRAS[i] })));
  readonly ehPrimeira = computed(() => this.store.anterior() === null);
  readonly proximaEhFim = computed(() => this.store.proxima() === 'fim');
  readonly proximaEhRedacao = computed(() => this.store.proxima() === 'redacao');
  readonly rotuloProxima = computed(() => (this.proximaEhFim() ? 'Entregar prova' : this.proximaEhRedacao() ? 'Ir para a redação' : 'Próxima'));

  constructor() {
    effect(() => this.store.definirPosicao(this.caderno(), this.n()));
  }

  escolher(oidAlternativa: string): void {
    const q = this.questao();
    if (q) this.store.responder(q.oid, oidAlternativa);
  }

  private base(): unknown[] { return ['/candidato', this.candidato.oidFip(), 'prova']; }

  anterior(): void {
    const p = this.store.anterior();
    if (p) this.router.navigate([...this.base(), p.slug, p.n]);
  }

  proxima(): void {
    const p = this.store.proxima();
    if (p === 'fim') { this.pagina.pedirEntrega.set('manual'); return; }
    if (p === 'redacao') { this.router.navigate([...this.base(), 'redacao']); return; }
    this.router.navigate([...this.base(), p.slug, p.n]);
  }
}
```

`src/app/candidato/prova/questao/questao.html`:

```html
@if (questao(); as q) {
  <article class="ucam-stack ucam-stack--lg" appProvaProtegida>
    <header class="ucam-cluster ucam-cluster--entre">
      <h2 class="ucam-section__title">{{ rotuloCaderno() }} · Questão {{ n() }} de {{ totalNoCaderno() }}</h2>
      @if (escolhida()) {
        <ucam-badge tone="success" variant="dot" label="Respondida" />
      }
    </header>

    @if (q.textoreferencia) {
      <div data-texto-referencia [innerHTML]="q.textoreferencia"></div>
    }
    <div data-enunciado [innerHTML]="q.descricao"></div>

    <fieldset class="ucam-stack ucam-stack--sm">
      <legend class="ucam-sr-only">Alternativas da questão {{ n() }}</legend>
      @for (a of alternativas(); track a.oid) {
        <label class="ucam-choice-card">
          <input type="radio" [name]="'questao-' + q.oid" [value]="a.oid" [checked]="escolhida() === a.oid" (change)="escolher(a.oid)" />
          <span class="ucam-choice-card__figura" aria-hidden="true">{{ a.letra }}</span>
          <span class="ucam-choice-card__titulo"><span class="ucam-sr-only">Alternativa {{ a.letra }}: </span><span [innerHTML]="a.descricao"></span></span>
          <span class="ucam-choice-card__marca" aria-hidden="true"><ucam-icon name="check" size="sm" /></span>
        </label>
      }
    </fieldset>

    <footer class="ucam-cluster ucam-cluster--entre">
      <span [ucamTooltip]="ehPrimeira() ? 'Esta é a primeira questão' : ''" [tooltipDisabled]="!ehPrimeira()">
        <ucam-button variant="secondary" iconStart="chevronLeft" [disabled]="ehPrimeira()" (click)="anterior()">Anterior</ucam-button>
      </span>
      @if (ehPrimeira()) { <span class="ucam-sr-only">Esta é a primeira questão.</span> }
      <ucam-button [variant]="'primary'" [iconEnd]="proximaEhFim() ? 'send' : 'chevronRight'" (click)="proxima()">{{ rotuloProxima() }}</ucam-button>
    </footer>
  </article>
}
```

Observações para o executor:
- As alternativas usam a anatomia do Trilho A (`label.ucam-choice-card` com `input` real) em vez de `<ucam-choice-card>` porque o texto da alternativa vem em HTML do backend (fórmulas, imagens) e a prop `label` do componente só aceita string. A anatomia é a do contrato: input real, título, marca de escolhido.
- O enunciado e o texto de referência vão em `div` sem classe: a tipografia de corpo vem do `.ucam` raiz; nunca adicione CSS próprio de tipografia.
- O texto "Esta é a primeira questão." visível só para leitor de tela cumpre a regra do botão desabilitado com motivo; a tooltip mostra o mesmo ao ponteiro.

Run: `npx ng test --include src/app/candidato/prova/questao && npm run ds:checar` → PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Questão objetiva com alternativas em cartão, gravação ao escolher e navegação

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 11: Entrega da prova (diálogo de confirmação e tempo esgotado)

**Files:**
- Create: `src/app/candidato/prova/entrega-dialog.ts`
- Modify: `src/app/candidato/prova/prova.ts` (método `entregar()`), `src/app/candidato/prova/prova.html` (incluir o diálogo)
- Test: `src/app/candidato/prova/entrega-dialog.spec.ts`

**Interfaces:**
- Consumes: `ProvaStore` (`emBranco`, `redacaoAtingeMinimo`, `redacao`), `FilaRespostas.reenviar`, `ProvaApi.entregar`, `ProvaPage.pedirEntrega`.
- Produces: `EntregaDialog` (inputs: `modo: 'manual' | 'tempo' | null`; outputs: `fechar`, `revisar: Posicao`, `entregue`).

- [ ] **Step 1: Teste**

`src/app/candidato/prova/entrega-dialog.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { EntregaDialog } from './entrega-dialog';
import { ProvaStore } from '../../core/store/prova.store';
import { FilaRespostas } from '../../core/offline/fila-respostas';
import { ProvaApi } from '../../core/api/prova.api';
import { CandidatoStore } from '../../core/store/candidato.store';
import { candidatoFake } from '../../core/store/candidato.store.spec';

describe('EntregaDialog', () => {
  const api = { entregar: vi.fn(() => of({})) };
  const fila = { reenviar: vi.fn(async () => 0), pendentes: () => [] };

  async function montar(modo: 'manual' | 'tempo', respostas: Record<string, string> = {}) {
    await TestBed.configureTestingModule({ imports: [EntregaDialog], providers: [{ provide: ProvaApi, useValue: api }, { provide: FilaRespostas, useValue: fila }] }).compileComponents();
    TestBed.inject(CandidatoStore).definir(candidatoFake({ situacao: 'PROVA_INICIADA' }), 'fip-1');
    const store = TestBed.inject(ProvaStore);
    store.cadernos.set([{ oid: 'c1', tipoprova: 'PORTUGUES', questoes: [{ oid: 'p1', descricao: '', alternativas: [] }, { oid: 'p2', descricao: '', alternativas: [] }, { oid: 'p3', descricao: '', alternativas: [] }] }]);
    store.respostas.set(respostas);
    const f = TestBed.createComponent(EntregaDialog);
    f.componentRef.setInput('modo', modo);
    await f.whenStable();
    return f;
  }

  it('nomeia quantas e quais questões estão em branco e oferece revisar', async () => {
    const f = await montar('manual', { p2: 'x' });
    expect(f.nativeElement.textContent).toContain('2 questões estão em branco');
    expect(f.nativeElement.textContent).toContain('1, 3');
    expect(f.nativeElement.textContent).toContain('Revisar');
  });

  it('entrega chama a API e emite entregue', async () => {
    const f = await montar('manual', { p1: 'a', p2: 'b', p3: 'c' });
    let entregue = false;
    f.componentInstance.entregue.subscribe(() => (entregue = true));
    await f.componentInstance.entregar();
    expect(api.entregar).toHaveBeenCalledWith('cp-1');
    expect(entregue).toBe(true);
  });

  it('não entrega com respostas pendentes e explica', async () => {
    fila.reenviar.mockResolvedValueOnce(2);
    const f = await montar('manual');
    await f.componentInstance.entregar();
    await f.whenStable();
    expect(api.entregar).not.toHaveBeenCalled();
    expect(f.nativeElement.textContent).toContain('2 respostas não foram enviadas');
  });

  it('com tempo esgotado entrega sozinho e diz isso', async () => {
    const f = await montar('tempo');
    await f.whenStable();
    expect(f.nativeElement.textContent).toContain('O tempo acabou');
    expect(api.entregar).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Implementar o diálogo**

`src/app/candidato/prova/entrega-dialog.ts`:

```ts
import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { UcamAlert, UcamButton, UcamDialog } from '@ucam/ui';
import { ProvaApi } from '../../core/api/prova.api';
import { FilaRespostas } from '../../core/offline/fila-respostas';
import { CandidatoStore } from '../../core/store/candidato.store';
import { Posicao, ProvaStore } from '../../core/store/prova.store';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-entrega-dialog',
  imports: [UcamAlert, UcamButton, UcamDialog],
  template: `
    <ucam-dialog [title]="titulo()" variant="confirm" size="sm" [open]="aberto()" (openChange)="!$event && fechar.emit()"
      [dismissible]="modo() === 'manual' && !entregando()" [loading]="entregando()" initialFocus="[data-foco]">
      <div class="ucam-stack">
        @if (modo() === 'tempo') {
          <p>O tempo acabou. Estamos entregando sua prova com as respostas que você já deu.</p>
        } @else {
          <p>Depois de entregar você não poderá alterar as respostas.</p>
          @if (emBranco().length) {
            <p><strong>{{ emBranco().length }} {{ emBranco().length === 1 ? 'questão está' : 'questões estão' }} em branco:</strong> {{ numeros() }}.</p>
          }
          @if (!store.redacaoAtingeMinimo()) {
            <ucam-alert tone="warning">A redação ainda não tem o mínimo de {{ minimo }} caracteres.</ucam-alert>
          }
        }
        @if (erro()) {
          <ucam-alert tone="danger" live="assertive">{{ erro() }}</ucam-alert>
        }
      </div>
      <footer class="ucam-cluster ucam-cluster--fim">
        @if (modo() === 'manual') {
          <ucam-button variant="secondary" data-foco (click)="revisarAgora()">Revisar</ucam-button>
          <ucam-button variant="primary" iconStart="send" [loading]="entregando()" [disabled]="!store.redacaoAtingeMinimo()" (click)="entregar()">Entregar prova</ucam-button>
        } @else if (erro()) {
          <ucam-button variant="primary" data-foco [loading]="entregando()" (click)="entregar()">Tentar de novo</ucam-button>
        }
      </footer>
    </ucam-dialog>
  `,
})
export class EntregaDialog {
  readonly modo = input.required<'manual' | 'tempo' | null>();
  readonly fechar = output<void>();
  readonly revisar = output<Posicao>();
  readonly entregue = output<void>();

  readonly store = inject(ProvaStore);
  private readonly fila = inject(FilaRespostas);
  private readonly api = inject(ProvaApi);
  private readonly candidato = inject(CandidatoStore);

  readonly minimo = environment.redacaoMin;
  readonly entregando = signal(false);
  readonly erro = signal<string | null>(null);
  readonly aberto = computed(() => this.modo() !== null);
  readonly titulo = computed(() => (this.modo() === 'tempo' ? 'Tempo esgotado' : 'Entregar a prova?'));
  readonly emBranco = computed(() => this.store.emBranco());
  readonly numeros = computed(() => this.emBranco().slice(0, 10).map((e) => e.numeroGlobal).join(', ') + (this.emBranco().length > 10 ? '…' : ''));

  constructor() {
    effect(() => {
      if (this.modo() === 'tempo') this.entregar();
    });
  }

  revisarAgora(): void {
    const p = this.store.primeiraEmBranco();
    if (p) this.revisar.emit(p);
    this.fechar.emit();
  }

  async entregar(): Promise<void> {
    if (this.entregando()) return;
    this.entregando.set(true);
    this.erro.set(null);
    const oidCp = this.candidato.oidCandidatoProva()!;
    try {
      const pendentes = await this.fila.reenviar(oidCp);
      if (pendentes > 0 && this.modo() === 'manual') {
        this.erro.set(`${pendentes} respostas não foram enviadas por falta de conexão. Confira a rede e tente de novo.`);
        return;
      }
      await firstValueFrom(this.api.entregar(oidCp));
      this.entregue.emit();
    } catch {
      this.erro.set('Não conseguimos registrar a entrega. Confira a conexão e tente de novo.');
    } finally {
      this.entregando.set(false);
    }
  }
}
```

- [ ] **Step 3: Ligar na página da prova**

Em `prova.ts`, adicionar `EntregaDialog` aos `imports` e:

```ts
  async entregue(): Promise<void> {
    this.relogio.parar();
    this.fila.limpar(this.candidato.oidCandidatoProva()!);
    localStorage.removeItem(`rascunho:${this.candidato.oidCandidatoProva()}`);
    this.pedirEntrega.set(null);
    await this.router.navigate(['/candidato', this.candidato.oidFip(), 'resultado']);
  }
```

Em `prova.html`, dentro do `@default`, após o `ucam-drawer`:

```html
      <app-entrega-dialog [modo]="pedirEntrega()" (fechar)="pedirEntrega.set(null)" (revisar)="irPara($event)" (entregue)="entregue()" />
```

O guard do resultado recarrega o candidato (agora `PROVA_FINALIZADA`), então a navegação passa.

Run: `npx ng test --include src/app/candidato/prova && npm run ds:checar` → PASS.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "Entrega da prova com revisão das em branco, pendências e tempo esgotado

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 12: Redação

**Files:**
- Create: `src/app/candidato/prova/redacao/redacao.ts`, `src/app/candidato/prova/redacao/redacao.html`
- Test: `src/app/candidato/prova/redacao/redacao.spec.ts`

**Interfaces:**
- Consumes: `ProvaStore` (`questaoRedacao`, `textoRedacao`, `caracteresRedacao`, `redacaoAtingeMinimo`, `salvarRedacao`, `definirPosicao`, `objetivos`), `ProvaPage.pedirEntrega`, `ProvaProtegida`.
- Produces: `RedacaoPage`.

- [ ] **Step 1: Teste**

`src/app/candidato/prova/redacao/redacao.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { RedacaoPage } from './redacao';
import { ProvaStore } from '../../../core/store/prova.store';
import { CandidatoStore } from '../../../core/store/candidato.store';
import { candidatoFake } from '../../../core/store/candidato.store.spec';
import { ProvaPage } from '../prova';

describe('RedacaoPage', () => {
  const pedirEntrega = signal<'manual' | 'tempo' | null>(null);
  let store: ProvaStore;

  async function montar(textoSalvo = '') {
    vi.useFakeTimers();
    localStorage.clear();
    await TestBed.configureTestingModule({ imports: [RedacaoPage], providers: [provideRouter([]), { provide: ProvaPage, useValue: { pedirEntrega } }] }).compileComponents();
    TestBed.inject(CandidatoStore).definir(candidatoFake({ situacao: 'PROVA_INICIADA' }), 'fip-1');
    store = TestBed.inject(ProvaStore);
    store.cadernos.set([
      { oid: 'c1', tipoprova: 'PORTUGUES', questoes: [{ oid: 'p1', descricao: '', alternativas: [] }] },
      { oid: 'c3', tipoprova: 'REDACAO', questoes: [{ oid: 'r1', descricao: '<p>Tema</p>', textoreferencia: '<p>Apoio</p>', alternativas: [] }] },
    ]);
    store.textoRedacao.set(textoSalvo);
    store.estado.set('pronto');
    vi.spyOn(store, 'salvarRedacao').mockImplementation(async (t) => { store.textoRedacao.set(t); });
    const f = TestBed.createComponent(RedacaoPage);
    await f.whenStable();
    return f;
  }
  afterEach(() => vi.useRealTimers());

  it('mostra tema, contador e quanto falta para o mínimo, ignorando espaços', async () => {
    const f = await montar('abc de');
    const t = f.nativeElement.textContent;
    expect(t).toContain('Tema');
    expect(t).toContain('5 de 3.000 caracteres');
    expect(t).toContain('Faltam 295 caracteres para o mínimo');
  });

  it('salva ao sair do campo e a cada 30 s quando houve mudança', async () => {
    const f = await montar();
    f.componentInstance.texto.set('novo texto');
    f.componentInstance.aoSair();
    expect(store.salvarRedacao).toHaveBeenCalledWith('novo texto');
    f.componentInstance.texto.set('novo texto 2');
    vi.advanceTimersByTime(30_000);
    expect(store.salvarRedacao).toHaveBeenLastCalledWith('novo texto 2');
  });

  it('bloqueia a entrega abaixo do mínimo com o motivo ao lado', async () => {
    const f = await montar('x'.repeat(299));
    const el = f.nativeElement as HTMLElement;
    const entregar = [...el.querySelectorAll('ucam-button')].find((b) => b.textContent?.includes('Entregar prova'))!;
    expect(entregar.querySelector('button')?.matches('[disabled],[aria-disabled="true"]')).toBe(true);
    expect(el.textContent).toContain('precisa de pelo menos 300 caracteres');
  });

  it('restaura o rascunho local quando é mais novo que o do servidor', async () => {
    localStorage.setItem('rascunho:cp-1', JSON.stringify({ texto: 'rascunho local', em: Date.now() }));
    const f = await montar('texto do servidor');
    expect(f.componentInstance.texto()).toBe('rascunho local');
  });
});
```

- [ ] **Step 2: Implementar**

`src/app/candidato/prova/redacao/redacao.ts`:

```ts
import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { UcamBadge, UcamButton, UcamTextarea } from '@ucam/ui';
import { ProvaProtegida } from '../../../core/directives/prova-protegida';
import { CandidatoStore } from '../../../core/store/candidato.store';
import { ProvaStore, contarCaracteres } from '../../../core/store/prova.store';
import { ProvaPage } from '../prova';
import { environment } from '../../../../environments/environment';

const INTERVALO_SALVAR = 30_000;

@Component({
  selector: 'app-redacao',
  imports: [UcamBadge, UcamButton, UcamTextarea, ProvaProtegida],
  templateUrl: './redacao.html',
})
export class RedacaoPage {
  readonly store = inject(ProvaStore);
  private readonly candidato = inject(CandidatoStore);
  private readonly router = inject(Router);
  private readonly pagina = inject(ProvaPage);

  readonly minimo = environment.redacaoMin;
  readonly maximo = environment.redacaoMax;
  readonly questao = this.store.questaoRedacao;
  readonly texto = signal('');
  private ultimoSalvo = '';

  readonly caracteres = computed(() => contarCaracteres(this.texto()));
  readonly faltam = computed(() => Math.max(0, this.minimo - this.caracteres()));
  readonly atingeMinimo = computed(() => this.faltam() === 0);
  readonly contador = computed(() => `${this.caracteres().toLocaleString('pt-BR')} de ${this.maximo.toLocaleString('pt-BR')} caracteres`);
  readonly temObjetiva = computed(() => this.store.objetivos().length > 0);

  private get chaveRascunho(): string { return `rascunho:${this.candidato.oidCandidatoProva()}`; }

  constructor() {
    // Na redação não há posição de questão objetiva: o mapa marca "Redação".
    this.store.posicao.set(null);
    this.texto.set(this.store.textoRedacao());
    this.ultimoSalvo = this.texto();
    this.restaurarRascunho();

    const timer = setInterval(() => { if (this.texto() !== this.ultimoSalvo) this.salvar(); }, INTERVALO_SALVAR);
    inject(DestroyRef).onDestroy(() => { clearInterval(timer); if (this.texto() !== this.ultimoSalvo) this.salvar(); });

    effect(() => {
      // Rascunho local a cada mudança: sobrevive a recarregar a página.
      try { localStorage.setItem(this.chaveRascunho, JSON.stringify({ texto: this.texto(), em: Date.now() })); } catch { /* sem storage */ }
    });
  }

  private restaurarRascunho(): void {
    try {
      const r = JSON.parse(localStorage.getItem(this.chaveRascunho) ?? 'null') as { texto: string; em: number } | null;
      if (r && r.texto !== this.texto() && r.texto.length > 0) this.texto.set(r.texto);
    } catch { /* rascunho inválido: ignora */ }
  }

  aoSair(): void {
    if (this.texto() !== this.ultimoSalvo) this.salvar();
  }

  private salvar(): void {
    const t = this.texto();
    this.ultimoSalvo = t;
    this.store.salvarRedacao(t);
  }

  voltarParaObjetiva(): void {
    const ultima = this.store.objetivos().at(-1);
    if (!ultima) return;
    this.router.navigate(['/candidato', this.candidato.oidFip(), 'prova', this.store.primeiraEmBranco()?.slug ?? '', 1]);
  }

  entregar(): void {
    this.aoSair();
    this.pagina.pedirEntrega.set('manual');
  }
}
```

Nota: `voltarParaObjetiva` deve levar à **primeira questão em branco** se houver, senão à primeira da prova — use `this.store.primeiraEmBranco()` inteiro (`slug` e `n`), não `1` fixo:

```ts
  voltarParaObjetiva(): void {
    const p = this.store.primeiraEmBranco();
    if (p) this.router.navigate(['/candidato', this.candidato.oidFip(), 'prova', p.slug, p.n]);
  }
```

`src/app/candidato/prova/redacao/redacao.html`:

```html
@if (questao(); as q) {
  <article class="ucam-stack ucam-stack--lg" appProvaProtegida>
    <header class="ucam-cluster ucam-cluster--entre">
      <h2 class="ucam-section__title">Redação</h2>
      @if (atingeMinimo()) {
        <ucam-badge tone="success" variant="dot" label="Mínimo atingido" />
      }
    </header>

    @if (q.textoreferencia) {
      <div data-texto-referencia [innerHTML]="q.textoreferencia"></div>
    }
    <div data-proposta [innerHTML]="q.descricao"></div>

    <ucam-textarea label="Seu texto" [rows]="14" autoGrow [maxLength]="maximo" [(value)]="texto"
      [hint]="'Mínimo de ' + minimo + ' caracteres, sem contar espaços. ' + contador()"
      (blur)="aoSair()" />
    <p class="ucam-field__hint" aria-live="polite">
      @if (faltam() > 0) { Faltam {{ faltam() }} caracteres para o mínimo. } @else { Mínimo atingido. Você pode continuar escrevendo até {{ maximo | number }} caracteres. }
    </p>

    <footer class="ucam-cluster ucam-cluster--entre">
      @if (temObjetiva()) {
        <ucam-button variant="secondary" iconStart="chevronLeft" (click)="voltarParaObjetiva()">Voltar para a prova objetiva</ucam-button>
      } @else { <span></span> }
      <span class="ucam-cluster">
        @if (!atingeMinimo()) { <span class="ucam-field__hint">A redação precisa de pelo menos {{ minimo }} caracteres para ser entregue.</span> }
        <ucam-button variant="primary" iconStart="send" [disabled]="!atingeMinimo()" (click)="entregar()">Entregar prova</ucam-button>
      </span>
    </footer>
  </article>
}
```

Ajustes que o executor deve fazer ao compilar: o `ucam-textarea` emite `blur` pelo elemento nativo interno — se `(blur)` no host não disparar, use `(focusout)="aoSair()"` num `div` envolvendo o campo. Importar `DecimalPipe` de `@angular/common` para o `number` com locale `pt-BR` (registrar `LOCALE_ID` em `app.config.ts`: `{ provide: LOCALE_ID, useValue: 'pt-BR' }` com `registerLocaleData(localePt)` em `main.ts`).

Run: `npx ng test --include src/app/candidato/prova/redacao && npm run ds:checar` → PASS.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "Redação em texto simples com contador, rascunho local e salvamento automático

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 13: Resultado

**Files:**
- Create: `src/app/candidato/resultado/resultado.ts`, `src/app/candidato/resultado/resultado.html`
- Test: `src/app/candidato/resultado/resultado.spec.ts`

**Interfaces:**
- Consumes: `ProvaApi.tiposProva`, `ProvaApi.corrigirObjetiva`, `CandidatoApi.dados`, `CandidatoApi.tentativas`, `CandidatoStore` (`urlSite`, `urlAreaDoInscrito`, `podeTentarDeNovo`, `tentativas`), `Navegador`, `formatarHms`, `Moldura`.

- [ ] **Step 1: Teste**

`src/app/candidato/resultado/resultado.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { ResultadoPage } from './resultado';
import { ProvaApi } from '../../core/api/prova.api';
import { CandidatoApi } from '../../core/api/candidato.api';
import { CandidatoStore } from '../../core/store/candidato.store';
import { Navegador } from '../../core/navegador';
import { candidatoFake } from '../../core/store/candidato.store.spec';

describe('ResultadoPage', () => {
  const prova = { tiposProva: vi.fn(), corrigirObjetiva: vi.fn(() => of('REPROVADO')) };
  const cand = { dados: vi.fn(() => of({ horarioinicio: '2026-10-01T10:00:00Z', horariofim: '2026-10-01T11:15:30Z' })) };
  const navegador = { irParaExterno: vi.fn() };

  async function montar(tipos: string[], correcao = 'REPROVADO', tentativas = { tentativaAtual: 1, totalTentativasPossiveis: 3 }) {
    prova.tiposProva.mockReturnValue(of(tipos));
    prova.corrigirObjetiva.mockReturnValue(of(correcao));
    await TestBed.configureTestingModule({ imports: [ResultadoPage], providers: [provideRouter([]), { provide: ProvaApi, useValue: prova }, { provide: CandidatoApi, useValue: cand }, { provide: Navegador, useValue: navegador }] }).compileComponents();
    const store = TestBed.inject(CandidatoStore);
    store.definir(candidatoFake({ situacao: 'PROVA_FINALIZADA' }), 'fip-1');
    store.tentativas.set(tentativas);
    const f = TestBed.createComponent(ResultadoPage);
    await f.whenStable();
    return f.nativeElement as HTMLElement;
  }

  it('com redação, diz que aguarda correção e leva ao site', async () => {
    const el = await montar(['PORTUGUES', 'REDACAO']);
    expect(el.textContent).toContain('corrigida pela banca');
    expect(el.textContent).toContain('Ir para o site');
    expect(el.textContent).toContain('01:15:30');
    expect(prova.corrigirObjetiva).not.toHaveBeenCalled();
  });

  it('sem redação, corrige na hora: aprovado leva à matrícula', async () => {
    const el = await montar(['PORTUGUES'], 'APROVADO');
    expect(el.querySelector('ucam-badge')?.textContent).toContain('Aprovado');
    expect(el.textContent).toContain('Concluir matrícula');
  });

  it('reprovado com tentativa oferece tentar de novo, em tom neutro', async () => {
    const el = await montar(['PORTUGUES'], 'REPROVADO');
    expect(el.querySelector('ucam-badge')?.textContent).toContain('Reprovado');
    expect(el.querySelector('ucam-badge')?.getAttribute('data-tone')).toBe('neutral');
    expect(el.textContent).toContain('Tentar novamente');
  });

  it('reprovado sem tentativa explica e leva ao site', async () => {
    const el = await montar(['PORTUGUES'], 'REPROVADO', { tentativaAtual: 3, totalTentativasPossiveis: 3 });
    expect(el.textContent).toContain('usou as 3 tentativas');
    expect(el.textContent).not.toContain('Tentar novamente');
  });
});
```

- [ ] **Step 2: Implementar**

`src/app/candidato/resultado/resultado.ts`:

```ts
import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { UcamAlert, UcamBadge, UcamButton, UcamDescriptionList, UcamPageHeader, UcamSkeleton } from '@ucam/ui';
import { CandidatoApi } from '../../core/api/candidato.api';
import { ProvaApi } from '../../core/api/prova.api';
import { ehRedacao, rotuloTipoProva } from '../../core/model/prova';
import { Navegador } from '../../core/navegador';
import { CandidatoStore } from '../../core/store/candidato.store';
import { formatarHms } from '../../core/tempo/relogio-prova';
import { Moldura } from '../../layout/moldura';

type Situacao = 'APROVADO' | 'REPROVADO' | null;

@Component({
  selector: 'app-resultado',
  imports: [Moldura, UcamAlert, UcamBadge, UcamButton, UcamDescriptionList, UcamPageHeader, UcamSkeleton],
  templateUrl: './resultado.html',
})
export class ResultadoPage {
  readonly store = inject(CandidatoStore);
  private readonly provaApi = inject(ProvaApi);
  private readonly candidatoApi = inject(CandidatoApi);
  private readonly navegador = inject(Navegador);
  private readonly router = inject(Router);

  readonly carregando = signal(true);
  readonly erro = signal<string | null>(null);
  readonly tipos = signal<string[]>([]);
  readonly situacao = signal<Situacao>(null);
  readonly entregueEm = signal<string | null>(null);
  readonly tempoUsado = signal<string | null>(null);

  readonly temRedacao = computed(() => this.tipos().some(ehRedacao));
  readonly totalTentativas = computed(() => this.store.tentativas()?.totalTentativasPossiveis ?? 0);
  readonly itens = computed(() => [
    { label: 'Entregue em', value: this.entregueEm() },
    { label: 'Tempo usado', value: this.tempoUsado() },
    { label: 'Cadernos', value: this.tipos().map(rotuloTipoProva).join(', ') || null },
  ]);

  constructor() {
    this.carregar();
  }

  private async carregar(): Promise<void> {
    const oidCp = this.store.oidCandidatoProva()!;
    try {
      const [tipos, dados] = await Promise.all([
        firstValueFrom(this.provaApi.tiposProva(oidCp)),
        firstValueFrom(this.candidatoApi.dados(oidCp)).catch(() => ({})),
      ]);
      this.tipos.set(tipos ?? []);
      if (dados.horariofim) {
        const fim = new Date(dados.horariofim);
        this.entregueEm.set(fim.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }));
        if (dados.horarioinicio) this.tempoUsado.set(formatarHms(fim.getTime() - new Date(dados.horarioinicio).getTime()));
      }
      if (!this.temRedacao()) {
        const s = (await firstValueFrom(this.provaApi.corrigirObjetiva(oidCp))).trim().toUpperCase();
        this.situacao.set(s === 'APROVADO' ? 'APROVADO' : 'REPROVADO');
      }
    } catch {
      this.erro.set('Não conseguimos carregar o resultado. Tente de novo em instantes.');
    } finally {
      this.carregando.set(false);
    }
  }

  irParaSite(): void { this.navegador.irParaExterno(this.store.urlSite()); }
  concluirMatricula(): void { this.navegador.irParaExterno(this.store.urlAreaDoInscrito()); }
  tentarNovamente(): void {
    const proxima = (this.store.tentativas()?.tentativaAtual ?? 1) + 1;
    this.router.navigate(['/candidato', this.store.oidFip()], { queryParams: { tentativa: proxima } });
  }
  recarregar(): void { this.carregando.set(true); this.erro.set(null); this.carregar(); }
}
```

`src/app/candidato/resultado/resultado.html`:

```html
<app-moldura>
  <ucam-page-header variante="pagina" title="Prova entregue" description="Suas respostas foram registradas." />

  <div class="ucam-content ucam-content--estreita ucam-stack ucam-stack--lg">
    @if (carregando()) {
      <ucam-skeleton variant="text" [lines]="4" />
    } @else if (erro()) {
      <ucam-alert tone="danger" live="assertive">{{ erro() }}</ucam-alert>
      <ucam-button variant="primary" (click)="recarregar()">Tentar de novo</ucam-button>
    } @else {
      <ucam-description-list [items]="itens()" layout="inline" [columns]="1" />

      @if (temRedacao()) {
        <ucam-alert tone="info">Sua redação será corrigida pela banca. Acompanhe a data do resultado no site da universidade.</ucam-alert>
        <div class="ucam-cluster ucam-cluster--fim">
          <ucam-button variant="primary" iconEnd="externalLink" (click)="irParaSite()">Ir para o site</ucam-button>
        </div>
      } @else {
        <div class="ucam-stack">
          <ucam-badge [tone]="situacao() === 'APROVADO' ? 'success' : 'neutral'" variant="soft" [label]="situacao() === 'APROVADO' ? 'Aprovado' : 'Reprovado'" />
          @if (situacao() === 'APROVADO') {
            <p>Parabéns! Você foi aprovado no vestibular. O próximo passo é concluir a matrícula.</p>
            <div class="ucam-cluster ucam-cluster--fim">
              <ucam-button variant="primary" iconEnd="externalLink" (click)="concluirMatricula()">Concluir matrícula</ucam-button>
            </div>
          } @else if (store.podeTentarDeNovo()) {
            <p>Você não atingiu a nota mínima nesta tentativa. Ainda há tentativa disponível nesta inscrição.</p>
            <div class="ucam-cluster ucam-cluster--fim">
              <ucam-button variant="secondary" iconEnd="externalLink" (click)="irParaSite()">Ir para o site</ucam-button>
              <ucam-button variant="primary" iconStart="refreshCw" (click)="tentarNovamente()">Tentar novamente</ucam-button>
            </div>
          } @else {
            <p>Você não atingiu a nota mínima e já usou as {{ totalTentativas() }} tentativas desta inscrição.</p>
            <div class="ucam-cluster ucam-cluster--fim">
              <ucam-button variant="primary" iconEnd="externalLink" (click)="irParaSite()">Ir para o site</ucam-button>
            </div>
          }
        </div>
      }
    }
  </div>
</app-moldura>
```

Run: `npx ng test --include src/app/candidato/resultado && npm run ds:checar` → PASS. O `ucam-badge` expõe o tom em `data-tone` no host.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "Resultado: aguardo da banca, correção imediata, matrícula e nova tentativa

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 14: Fechamento — auditoria do DS, acessibilidade, tema escuro e README

**Files:**
- Modify: `README.md`
- Modify: qualquer template apontado pela auditoria

- [ ] **Step 1: Auditoria completa e testes**

Run: `npm run ds:checar && npx ng test && npx ng build --configuration production`
Esperado: zero erros na auditoria; todos os specs PASS; build de produção sem avisos de budget (se o CSS passar do budget, aumente `anyComponentStyle`/`initial` em `angular.json` com justificativa no commit — o `ucam.css` é grande por desenho).

- [ ] **Step 2: Passagem manual nas duas larguras e nos dois temas**

Com o backend local e um candidato de teste, em `http://localhost:4200/candidato/<oid>`:

1. Entrada → Instruções → Iniciar → questão 1: o relógio conta a partir do horário do servidor; recarregue a página na questão 3 e confirme que volta à questão 3 com o mapa correto.
2. Desligue a rede (DevTools → Offline), escolha uma alternativa: o cabeçalho diz "Sem conexão. 1 respostas serão enviadas…"; religue: volta a "Salvo".
3. Última questão → "Entregar prova": o diálogo lista as em branco; "Revisar" vai à primeira em branco; "Entregar" leva ao resultado.
4. Em 390px de largura: nada rola na horizontal; o botão "Questões" abre a gaveta; alvos ≥ 24px.
5. `data-theme="dark"` no `<html>`: todas as telas legíveis; o selo "Reprovado" continua neutro.
6. Teclado: Tab percorre entrada → alternativas (setas trocam a alternativa) → Anterior/Próxima; no diálogo o foco entra, fica preso e volta ao botão ao fechar.

Anote qualquer desvio como issue no README (seção "Pendências") em vez de remendar com CSS próprio.

- [ ] **Step 3: README**

Substituir o `README.md` gerado pelo CLI por:

```markdown
# Vestibular Online · UCAM

Fluxo do candidato (entrada, prova objetiva, redação e resultado) construído com o UCAMDS (Trilho B).

## Rodar

- `npm install`
- `npm start` → http://localhost:4200/candidato/<oidFormaIngressoPessoa>
- `npm test` · `npm run ds:checar` · `npm run build`

Backend: `src/environments/environment.ts` (`backend`, `backendApi`). Em produção os marcadores `DEPLOY_PROCESSO_BACKEND` e `UNIDADE_REFERENCIA` são trocados no deploy.

## Design system

`@ucam/ui`, `@ucam/tokens` e `@ucam/css` entram por tarball (ver `package.json`). Para subir de versão, troque o número nas três URLs e rode `npm install`. Regras e contratos: `../AGENTS.ucam.md` e o servidor MCP `ucamds`.

## Documentos

- Spec: `docs/superpowers/specs/2026-10-01-candidato-prova-design.md`
- Plano: `docs/superpowers/plans/2026-10-01-candidato-prova.md`

## Pendências

(preencher ao fim da passagem manual)
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "Fechamento do fluxo do candidato: auditoria, passagem manual e README

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```
