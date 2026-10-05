import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Navegador } from '../core/navegador';
import { environment } from '../../environments/environment';
import { SessaoBanca } from './sessao';

/**
 * A área interna só abre com sessão. Sem ela, a pessoa vai para o login único
 * da universidade, que devolve em `admin/login/:token/:usuario`. No protótipo
 * não há login único (`loginUrl` nulo): volta para a porta de entrada, onde
 * está o atalho do perfil de teste.
 *
 * MUDA EM RELAÇÃO AO LEGADO: lá a correção de redação está com o guarda
 * comentado e abre para quem tiver o endereço. Aqui a fila mostra nome, CPF e
 * texto de candidato, e por isso pede sessão como o resto da área interna.
 */
export const bancaGuard: CanActivateFn = () => {
  if (inject(SessaoBanca).autenticada()) return true;
  if (environment.loginUrl) {
    inject(Navegador).irParaExterno(environment.loginUrl);
    return false;
  }
  return inject(Router).createUrlTree(['/']);
};
