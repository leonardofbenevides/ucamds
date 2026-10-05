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
    return this.http.post(`${this.api}candidatoprova/${oidCandidatoProva}/corrigir-prova-objetiva`, null, {
      responseType: 'text',
    });
  }
}
