import { Routes } from '@angular/router';
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
  { path: '', pathMatch: 'full', loadComponent: () => import('./candidato/sem-link/sem-link').then((m) => m.SemLinkPage) },
  { path: '**', redirectTo: '' },
];
