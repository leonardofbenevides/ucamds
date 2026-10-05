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
