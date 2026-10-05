import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { environment } from '../../environments/environment';

/** Uma unidade em que a pessoa atua, como o gerencial a devolve. */
export interface UnidadeUsuario {
  oidUnidade: string;
  sigla?: string | null;
  razaosocial?: string | null;
  nome?: string | null;
}

export interface Sessao {
  token: string;
  usuario: { oid: string; nome: string };
  oidPessoa: string | null;
  unidades: UnidadeUsuario[];
  /** A unidade em que a pessoa está trabalhando: a primeira das dela, como no legado. */
  unidade: UnidadeUsuario | null;
}

const CHAVE = 'sessao-banca';

function lerGuardada(): Sessao | null {
  try {
    const s = JSON.parse(localStorage.getItem(CHAVE) ?? 'null') as Sessao | null;
    return s?.token && s.usuario?.oid ? s : null;
  } catch {
    return null;
  }
}

/**
 * Quem está na área interna (banca e secretaria). O legado guarda o mesmo no
 * `AuthState` do navegador: o login único da universidade devolve um token e
 * o usuário pela URL, e o app busca nome e unidades no gerencial. Não há
 * papéis: quem tem sessão vê todos os destinos da área interna.
 *
 * Só estado e armazenamento — quem fala com o gerencial é `GerencialApi`,
 * usado apenas na volta do login.
 */
@Injectable({ providedIn: 'root' })
export class SessaoBanca {
  private readonly sessao = signal<Sessao | null>(lerGuardada());

  readonly autenticada = computed(() => this.sessao() !== null);
  readonly usuario = computed(() => this.sessao()?.usuario ?? null);
  readonly oidPessoa = computed(() => this.sessao()?.oidPessoa ?? null);
  readonly unidade = computed(() => this.sessao()?.unidade ?? null);
  /** O nome da unidade como a faixa o mostra; sem nome conhecido, nada — oid não é texto de tela. */
  readonly nomeUnidade = computed(() => {
    const u = this.unidade();
    return u?.sigla ?? u?.nome ?? u?.razaosocial ?? null;
  });

  abrir(sessao: Sessao): void {
    this.sessao.set(sessao);
    try {
      localStorage.setItem(CHAVE, JSON.stringify(sessao));
    } catch {
      /* sem storage: a sessão vale até recarregar */
    }
  }

  encerrar(): void {
    this.sessao.set(null);
    try {
      localStorage.removeItem(CHAVE);
    } catch {
      /* sem storage */
    }
  }
}

/** As três consultas que o legado faz na volta do login único (`TryTokenLogin`). */
@Injectable({ providedIn: 'root' })
export class GerencialApi {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiGerencial;
  private readonly headers = new HttpHeaders({ 'Unidade-Ref': environment.unidRef });

  sessao(token: string, oidUsuario: string): Observable<Sessao> {
    const opcoes = { headers: this.headers };
    return forkJoin({
      conta: this.http.get<{ oidPessoa?: string | null }>(`${this.api}/usuario/${oidUsuario}`, opcoes),
      unidades: this.http.get<{ _embedded?: { unidadesUsuarios?: UnidadeUsuario[] } }>(`${this.api}/unidadeUsuario/search/usuario`, {
        ...opcoes,
        params: new HttpParams().set('oidusuario', oidUsuario).set('size', 1000),
      }),
      pessoa: this.http.get<{ nome?: string | null }>(`${this.api}/usuario/${oidUsuario}/pessoa`, opcoes),
    }).pipe(
      map(({ conta, unidades, pessoa }) => {
        const lista = unidades._embedded?.unidadesUsuarios ?? [];
        return {
          token,
          usuario: { oid: oidUsuario, nome: pessoa.nome ?? '' },
          oidPessoa: conta.oidPessoa ?? null,
          unidades: lista,
          unidade: lista[0] ?? null,
        };
      }),
    );
  }
}
