import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Opcao {
  oid: string;
  rotulo: string;
}

/** Uma questão como o cadastro a guarda. Na redação ela é a proposta: texto de apoio e enunciado. */
export interface QuestaoCadastro {
  oid: string;
  descricao: string;
  textoreferencia?: string | null;
  pontuacao?: number | null;
  ordem?: number | null;
}

export interface CadernoCadastro {
  oid: string;
  tipoprova: string;
  questoes: QuestaoCadastro[];
}

/** Processo seletivo, forma de ingresso e captação: juntos apontam a vigência a que os cadernos pertencem. */
export interface EscopoProvas {
  processo: string;
  forma: string;
  captacao: string;
}

export interface CamposQuestao {
  textoreferencia: string;
  descricao: string;
  pontuacao: number;
  ordem: number;
}

interface ProcessoBruto {
  oid: string;
  periodoletivo: { ano: number; semestre: number };
}

/** Os endpoints do cadastro de provas, como o legado os chama (`admin/cadastro`). */
@Injectable({ providedIn: 'root' })
export class ProvasApi {
  private readonly http = inject(HttpClient);
  private readonly api = environment.backendApi;
  private readonly dados = environment.backend + 'data-context/';

  /** Na ordem em que o backend devolve, como no legado. */
  processos(): Observable<Opcao[]> {
    const params = new HttpParams().set('oidUnidade', environment.unidRef);
    return this.http
      .get<{ _embedded?: { periodoprocessoseletivo?: ProcessoBruto[] } }>(`${this.dados}periodoprocessoseletivo/search/findByUnidade`, { params })
      .pipe(
        map((r) =>
          (r._embedded?.periodoprocessoseletivo ?? []).map((p) => ({
            oid: p.oid,
            rotulo: `${p.periodoletivo.ano}/${p.periodoletivo.semestre}`,
          })),
        ),
      );
  }

  formas(): Observable<Opcao[]> {
    return this.http
      .get<{ oid: string; descricao: string }[]>(`${this.api}formaingresso/search/find-formaingresso-vestibularonline/`)
      .pipe(map((l) => (l ?? []).map((f) => ({ oid: f.oid, rotulo: f.descricao }))));
  }

  captacoes(): Observable<Opcao[]> {
    return this.http
      .get<{ oid: string; label: string }[]>(`${this.api}captacao/search/findall`)
      .pipe(map((l) => (l ?? []).map((c) => ({ oid: c.oid, rotulo: c.label }))));
  }

  /** A vigência do escopo; null quando o processo seletivo não oferece essa forma com essa captação. */
  vigencia(e: EscopoProvas): Observable<string | null> {
    const params = new HttpParams()
      .set('oidPeriodoProcessoSeletivo', e.processo)
      .set('oidFormaIngresso', e.forma)
      .set('captacao', e.captacao);
    return this.http
      .get<{ oid?: string } | null>(`${this.dados}formaingressovigencia/search/findByProcessoSeletivo`, { params })
      .pipe(map((r) => r?.oid ?? null));
  }

  cadernos(e: EscopoProvas): Observable<CadernoCadastro[]> {
    const params = new HttpParams()
      .set('oidPeriodoProcessoSeletivo', e.processo)
      .set('oidFormaIngresso', e.forma)
      .set('oidCaptacao', e.captacao);
    return this.http
      .get<CadernoCadastro[] | null>(`${this.api}cadernoprova/search/find-cadernoprova-by-processoseletivo`, { params })
      .pipe(map((l) => l ?? []));
  }

  criarCaderno(oidVigencia: string, tipoprova: string): Observable<unknown> {
    return this.http.post(`${this.api}cadernoprova/`, { formaingressovigencia: { oid: oidVigencia }, tipoprova });
  }

  excluirCaderno(oidCaderno: string): Observable<unknown> {
    return this.http.delete(`${this.api}cadernoprova/${oidCaderno}`);
  }

  criarQuestao(oidCaderno: string, campos: CamposQuestao): Observable<unknown> {
    return this.http.post(`${this.api}questao/`, { cadernoprova: { oid: oidCaderno }, ...campos });
  }

  /** `status: 'A'` (ativa) vai junto, como o legado manda. */
  salvarQuestao(oidCaderno: string, oidQuestao: string, campos: CamposQuestao): Observable<unknown> {
    return this.http.put(`${this.api}questao/`, { oid: oidQuestao, status: 'A', cadernoprova: { oid: oidCaderno }, ...campos });
  }

  excluirQuestao(oidQuestao: string): Observable<unknown> {
    return this.http.delete(`${this.api}questao/${oidQuestao}`);
  }
}
