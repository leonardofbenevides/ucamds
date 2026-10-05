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
    return this.http.get<DadosCandidato>(
      `${environment.backend}data-context/candidato/${oidCandidatoProva}?projection=candidato-inline`,
    );
  }
}
