import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { CandidatoProva } from '../core/model/candidato';

/** Uma prova na fila da banca: o `candidatoprova` do legado com a data da prova e a nota da redação. */
export type RedacaoNaFila = CandidatoProva & {
  dataprova?: string | null;
  formaingressopessoa: CandidatoProva['formaingressopessoa'] & { notaredacao?: number | null };
};

export interface Pagina<T> {
  content: T[];
  totalElements: number;
  number: number;
  size: number;
}

/** O que a banca lê: o texto do candidato e a proposta a que ele responde. */
export interface RespostaRedacao {
  respostaTextual: string | null;
  textoReferencia?: string | null;
  descricaoQuestao?: string | null;
}

export interface PeriodoIngresso {
  oid: string;
  rotulo: string;
  /** Datas ISO (aaaa-mm-dd) do período letivo: o legado exige o intervalo na consulta. */
  inicio: string;
  fim: string;
}

export interface FormaIngresso {
  oid: string;
  descricao: string;
}

export interface RecorteFila {
  periodo: PeriodoIngresso;
  forma: FormaIngresso;
  pesquisa: string;
  pagina: number;
  tamanho: number;
}

interface PeriodoBruto {
  oid: string;
  periodoletivo: { ano: number; semestre: number; datainicio: string; datafim: string };
}

/**
 * Os endpoints da correção de redação, como o legado os chama
 * (`admin/correcao/redacao`): a fila em espera, as corrigidas, o texto do
 * candidato e a gravação da nota.
 */
@Injectable({ providedIn: 'root' })
export class BancaApi {
  private readonly http = inject(HttpClient);
  private readonly api = environment.backendApi;
  private readonly dados = environment.backend + 'data-context/';

  /** Do mais recente para o mais antigo: o período corrente é o primeiro. */
  periodos(): Observable<PeriodoIngresso[]> {
    const params = new HttpParams().set('oidUnidade', environment.unidRef);
    return this.http
      .get<{ _embedded?: { periodoingresso?: PeriodoBruto[] } }>(
        `${this.dados}periodoingresso/search/findPeriodoingressoComCandidatosProvaOnline`,
        { params },
      )
      .pipe(
        map((r) =>
          (r._embedded?.periodoingresso ?? [])
            .map((p) => ({
              oid: p.oid,
              rotulo: `${p.periodoletivo.ano}-${p.periodoletivo.semestre}`,
              inicio: p.periodoletivo.datainicio.slice(0, 10),
              fim: p.periodoletivo.datafim.slice(0, 10),
            }))
            .sort((a, b) => b.rotulo.localeCompare(a.rotulo)),
        ),
      );
  }

  formas(): Observable<FormaIngresso[]> {
    const params = new HttpParams().set('oidUnidade', environment.unidRef);
    return this.http
      .get<{ _embedded?: { formaingresso?: FormaIngresso[] } }>(
        `${this.dados}formaingresso/search/findFormaingressoComCandidatosProvaOnline`,
        { params },
      )
      .pipe(map((r) => r._embedded?.formaingresso ?? []));
  }

  emEspera(recorte: RecorteFila): Observable<Pagina<RedacaoNaFila>> {
    return this.fila('find-candidatos-para-correcao', recorte);
  }

  corrigidas(recorte: RecorteFila): Observable<Pagina<RedacaoNaFila>> {
    return this.fila('find-candidatos-prova-corrigida', recorte);
  }

  private fila(busca: string, r: RecorteFila): Observable<Pagina<RedacaoNaFila>> {
    const params = new HttpParams()
      .set('oidPeriodoIngresso', r.periodo.oid)
      .set('oidFormaIngresso', r.forma.oid)
      .set('dataInicio', r.periodo.inicio)
      .set('dataFim', r.periodo.fim)
      // No EAD a banca corrige todas as unidades, como no legado.
      .set('todasUnidades', String(environment.unidRef === 'unid32'))
      .set('size', r.tamanho)
      .set('page', r.pagina)
      .set('pesquisa', r.pesquisa);
    return this.http.get<Pagina<RedacaoNaFila>>(`${this.api}candidatoprova/search/${busca}`, { params });
  }

  texto(oidCandidatoProva: string): Observable<RespostaRedacao | null> {
    const params = new HttpParams().set('oidCandidato', oidCandidatoProva);
    return this.http
      .get<RespostaRedacao | null>(`${this.api}respostacandidato/search/find-resposta-redacao`, { params })
      .pipe(map((r) => r ?? null));
  }

  darNota(oidCandidatoProva: string, nota: number): Observable<unknown> {
    return this.http.post(`${this.api}candidatoprova/${oidCandidatoProva}/notaredacao`, { nota });
  }
}
