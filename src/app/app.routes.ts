import { Routes } from '@angular/router';
import { bancaGuard } from './banca/banca.guard';
import { candidatoGuard } from './core/guards/candidato.guard';

export const routes: Routes = [
  {
    path: 'candidato/:oid',
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./candidato/entrada/entrada').then((m) => m.EntradaPage),
        canActivate: [candidatoGuard],
        data: { tela: 'entrada' },
      },
      {
        path: 'instrucoes',
        loadComponent: () => import('./candidato/instrucoes/instrucoes').then((m) => m.InstrucoesPage),
        canActivate: [candidatoGuard],
        data: { tela: 'instrucoes' },
      },
      {
        path: 'prova',
        loadComponent: () => import('./candidato/prova/prova').then((m) => m.ProvaPage),
        canActivate: [candidatoGuard],
        data: { tela: 'prova' },
        children: [
          {
            path: '',
            pathMatch: 'full',
            loadComponent: () => import('./candidato/prova/prova-inicio').then((m) => m.ProvaInicio),
          },
          {
            path: 'redacao',
            loadComponent: () => import('./candidato/prova/redacao/redacao').then((m) => m.RedacaoPage),
          },
          {
            path: ':caderno/:n',
            loadComponent: () => import('./candidato/prova/questao/questao').then((m) => m.QuestaoPage),
          },
        ],
      },
      {
        path: 'resultado',
        loadComponent: () => import('./candidato/resultado/resultado').then((m) => m.ResultadoPage),
        canActivate: [candidatoGuard],
        data: { tela: 'resultado' },
      },
      { path: 'erro', loadComponent: () => import('./candidato/erro/erro').then((m) => m.ErroPage) },
    ],
  },
  // A ÁREA INTERNA: banca e secretaria. Só abre com sessão (bancaGuard): a
  // pessoa entra pelo login único da universidade, que devolve no endereço
  // que o legado registrou lá — admin/login/:token/:usuario.
  { path: 'admin/login/:token/:usuario', loadComponent: () => import('./banca/entrar').then((m) => m.EntrarBancaPage) },
  // Os endereços da área interna do legado continuam valendo.
  { path: 'admin', pathMatch: 'full', redirectTo: 'banca' },
  { path: 'admin/correcao/redacao', redirectTo: 'banca/redacoes' },
  { path: 'admin/cadastro', redirectTo: 'banca/provas' },
  {
    path: 'banca',
    canActivate: [bancaGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'redacoes' },
      { path: 'redacoes', loadComponent: () => import('./banca/correcao/correcao').then((m) => m.CorrecaoPage) },
      { path: 'isencao', loadComponent: () => import('./banca/isencao/fila').then((m) => m.FilaIsencaoPage) },
      { path: 'isencao/:oid', loadComponent: () => import('./banca/isencao/analise').then((m) => m.AnaliseIsencaoPage) },
      { path: 'provas', loadComponent: () => import('./banca/provas/provas').then((m) => m.ProvasPage) },
      {
        path: 'provas/:caderno/questao/nova',
        loadComponent: () => import('./banca/provas/questao-form').then((m) => m.QuestaoFormPage),
      },
      {
        path: 'provas/:caderno/questao/:questao',
        loadComponent: () => import('./banca/provas/questao-form').then((m) => m.QuestaoFormPage),
      },
    ],
  },
  // O candidato acompanha a isenção de disciplinas: o mesmo endereço do legado, sem guarda como lá.
  { path: 'isencao/:oid', loadComponent: () => import('./isencao/acompanhamento').then((m) => m.AcompanhamentoIsencaoPage) },
  // O link que o legado mandou por e-mail continua valendo (a query ?tentativa é preservada).
  { path: 'vestibularonline/:oid', redirectTo: 'candidato/:oid' },
  { path: '', pathMatch: 'full', loadComponent: () => import('./candidato/sem-link/sem-link').then((m) => m.SemLinkPage) },
  { path: '**', redirectTo: '' },
];
