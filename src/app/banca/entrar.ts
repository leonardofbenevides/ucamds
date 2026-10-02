import { Component, OnInit, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { UcamButton, UcamEmptyState, UcamSkeleton } from '@ucam/ui';
import { firstValueFrom } from 'rxjs';
import { Navegador } from '../core/navegador';
import { environment } from '../../environments/environment';
import { GerencialApi, SessaoBanca } from './sessao';

/**
 * A volta do login único: `admin/login/:token/:usuario`, o endereço que o
 * legado registrou lá. Busca quem é a pessoa, abre a sessão e segue para a
 * área interna trocando a entrada do histórico — o token não fica na barra de
 * endereço nem no "voltar".
 */
@Component({
  selector: 'app-entrar-banca',
  imports: [UcamButton, UcamEmptyState, UcamSkeleton],
  template: `
    <main class="ucam-content ucam-content--estreita">
      <h1 class="ucam-sr-only">Vestibular Online</h1>
      @if (erro()) {
        <ucam-empty-state
          reason="error"
          title="Não foi possível abrir sua sessão"
          description="O login foi aceito, mas não conseguimos buscar seus dados de acesso. Confira sua conexão e tente de novo."
        >
          <ucam-button variant="primary" (click)="entrar()">Tentar de novo</ucam-button>
          @if (temLogin) {
            <ucam-button variant="ghost" (click)="refazerLogin()">Fazer login de novo</ucam-button>
          }
        </ucam-empty-state>
      } @else {
        <div class="ucam-stack" aria-busy="true">
          <p role="status">Abrindo sua sessão…</p>
          <ucam-skeleton variant="text" [lines]="3" />
        </div>
      }
    </main>
  `,
})
export class EntrarBancaPage implements OnInit {
  /** Parâmetros da rota. */
  readonly token = input.required<string>();
  readonly usuario = input.required<string>();

  private readonly api = inject(GerencialApi);
  private readonly sessao = inject(SessaoBanca);
  private readonly router = inject(Router);
  private readonly navegador = inject(Navegador);

  readonly erro = signal(false);
  readonly temLogin = !!environment.loginUrl;

  ngOnInit(): void {
    void this.entrar();
  }

  async entrar(): Promise<void> {
    this.erro.set(false);
    try {
      this.sessao.abrir(await firstValueFrom(this.api.sessao(this.token(), this.usuario())));
      await this.router.navigate(['/banca'], { replaceUrl: true });
    } catch {
      this.erro.set(true);
    }
  }

  refazerLogin(): void {
    if (environment.loginUrl) this.navegador.irParaExterno(environment.loginUrl);
  }
}
