import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { CandidatoApi } from '../api/candidato.api';
import { CandidatoProva } from '../model/candidato';
import { Navegador } from '../navegador';
import { CandidatoStore } from '../store/candidato.store';
import { Tela, destinoPorSituacao } from './destino-por-situacao';

/**
 * Recupera o candidato pelo oid da forma de ingresso (o link que ele recebe)
 * e manda cada tela para onde a situação da prova permite.
 */
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
  firstValueFrom(api.tentativas(oid))
    .then((t) => store.tentativas.set(t))
    .catch(() => {});

  const destino = destinoPorSituacao(candidato, tela);
  if (destino === 'ok') return true;
  if (destino === 'externo') {
    navegador.irParaExterno(store.urlAreaDoInscrito());
    return false;
  }
  return router.createUrlTree(['/candidato', oid, ...(destino === 'entrada' ? [] : [destino])]);
};
