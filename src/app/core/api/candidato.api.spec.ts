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
