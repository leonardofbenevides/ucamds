import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { SessaoBanca } from '../banca/sessao';
import { CursoFila, IsencaoAnalise, IsencaoCandidato, MatrizOpcao } from './isencao.model';

/**
 * Os endpoints da isenção de disciplinas, como o legado os chama: os do
 * candidato (`isencao/`) e os da secretaria (`admin/isencao`).
 */
@Injectable({ providedIn: 'root' })
export class IsencaoApi {
  private readonly http = inject(HttpClient);
  private readonly sessao = inject(SessaoBanca);
  private readonly base = environment.backend + 'isencao/';

  // ------------------------------------------------------------ candidato --

  doCandidato(oidFip: string): Observable<IsencaoCandidato> {
    return this.http.get<IsencaoCandidato>(this.base + oidFip);
  }

  /** Devolve a isenção já com o documento novo. */
  enviarDocumento(oidFip: string, arquivo: File, descricao: string): Observable<IsencaoCandidato> {
    const corpo = new FormData();
    corpo.append('file', arquivo);
    corpo.append('descricao', descricao);
    return this.http.post<IsencaoCandidato>(`${this.base}${oidFip}/upload`, corpo);
  }

  /** O endereço do arquivo: o download do legado é um GET sem cabeçalho de autenticação. */
  enderecoDoDocumento(oidFip: string, oidDocumento: string): string {
    return `${this.base}${oidFip}/download/${oidDocumento}`;
  }

  // ----------------------------------------------------------- secretaria --

  /** As solicitações ainda não concluídas da unidade, por curso. */
  emAnalise(): Observable<CursoFila[]> {
    return this.http.get<CursoFila[] | null>(`${this.base}${this.escopo()}/analize/courses`).pipe(map((c) => c ?? []));
  }

  concluidas(): Observable<CursoFila[]> {
    return this.http.get<CursoFila[] | null>(`${this.base}${this.escopo()}/analized/courses`).pipe(map((c) => c ?? []));
  }

  matrizes(oidFip: string): Observable<MatrizOpcao[]> {
    return this.http.get<MatrizOpcao[] | null>(`${this.base}${oidFip}/matrizes`).pipe(map((m) => m ?? []));
  }

  analise(oidFip: string, oidMatriz: string): Observable<IsencaoAnalise> {
    return this.http.get<IsencaoAnalise>(`${this.base}${oidFip}/matrizes/${oidMatriz}`);
  }

  /**
   * Grava as decisões. O corpo é a isenção inteira, como o legado manda, com a
   * matriz escolhida e a observação. `parcial` salva sem fechar.
   */
  avaliar(oidFip: string, isencao: IsencaoAnalise, oidMatriz: string, parcial: boolean): Observable<unknown> {
    const params = parcial ? new HttpParams().set('partial', 'true') : undefined;
    return this.http.post(`${this.base}${oidFip}/evaluate`, { ...isencao, matriz: oidMatriz }, { params });
  }

  /**
   * De quem é a fila, como o legado a pede: a unidade em que a pessoa do
   * login está trabalhando e a própria pessoa. Sem unidade na sessão, vale a
   * unidade de referência da instalação.
   */
  private escopo(): string {
    const unidade = this.sessao.unidade()?.oidUnidade ?? environment.unidRef;
    return `${unidade}/${this.sessao.oidPessoa() ?? 'sem-login'}`;
  }
}
