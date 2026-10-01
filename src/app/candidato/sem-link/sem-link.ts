import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { UcamButton, UcamCard, UcamIcon, UcamTextField } from '@ucam/ui';
import { environment } from '../../../environments/environment';
import { TemaToggle } from '../../layout/tema-toggle';

/**
 * De onde vem o "código": o legado só conhece o link
 * `/vestibularonline/<oid da inscrição>` que vai por e-mail — não há senha
 * nem código à parte. Esta função aceita o link inteiro, só o trecho final
 * ou o link já no formato novo (`/candidato/<oid>`), e preserva a tentativa
 * da consulta, que o legado também passa pela URL.
 */
export function destinoDoLink(texto: string): { oid: string; tentativa: string | null } | null {
  const t = texto.trim();
  if (!t) return null;
  let caminho = t;
  let consulta = '';
  try {
    const u = new URL(t);
    caminho = u.pathname;
    consulta = u.search;
  } catch {
    const i = t.indexOf('?');
    if (i >= 0) {
      caminho = t.slice(0, i);
      consulta = t.slice(i);
    }
  }
  const partes = caminho.split('/').filter(Boolean);
  const marco = partes.findIndex((p) => p === 'vestibularonline' || p === 'candidato');
  const oid = marco >= 0 ? partes[marco + 1] : partes.at(-1);
  if (!oid) return null;
  return { oid, tentativa: new URLSearchParams(consulta).get('tentativa') };
}

/**
 * A porta de quem chegou sem o link: a mesma moldura de entrada do DS, com
 * um campo para colar o link (ou só o código do fim dele) e, no protótipo,
 * os candidatos do backend de mentira como atalho. O botão nunca desabilita
 * (ADR-042): vazio, ele explica o que falta.
 */
@Component({
  selector: 'app-sem-link',
  imports: [UcamButton, UcamCard, UcamIcon, UcamTextField, TemaToggle],
  template: `
    <div class="ucam-shell ucam-shell--sem-nav" data-nav="closed" data-sistema="academico">
      <a class="ucam-skip" href="#conteudo">Pular para o conteúdo</a>
      <main class="ucam-main" id="conteudo" tabindex="-1">
        <div class="ucam-content ucam-content--pleno">
          <div class="ucam-login">
            <section class="ucam-login__acesso" aria-labelledby="t-sem-link">
              <div class="ucam-login__miolo ucam-stack ucam-stack--lg">
                <div class="ucam-login__marca">
                  <span class="ucam-login__logo" aria-hidden="true"></span>
                  <span class="ucam-sr-only">Universidade Candido Mendes</span>
                </div>
                <div class="ucam-stack ucam-stack--sm">
                  <h1 class="ucam-page-header__title" id="t-sem-link">Entre com o link da inscrição</h1>
                  <p class="ucam-lede">A universidade enviou por e-mail um link só seu. Abra-o — ou cole-o aqui.</p>
                </div>

                <form class="ucam-stack ucam-stack--md" novalidate (submit)="entrar($event)">
                  <ucam-text-field
                    label="Link ou código da inscrição"
                    [(value)]="texto"
                    placeholder="https://…/vestibularonline/…"
                    hint="O código é o trecho depois de /vestibularonline/ no link do e-mail."
                    autocomplete="off"
                    width="full"
                    [invalid]="!!erro()"
                    [errorMessage]="erro()"
                  />
                  <ucam-button variant="primary" size="lg" iconEnd="chevronRight" (click)="entrar($event)">Entrar</ucam-button>
                </form>

                @if (candidatosDeTeste.length) {
                  <section class="ucam-stack ucam-stack--sm" aria-labelledby="t-teste">
                    <h2 class="ucam-section__title" id="t-teste">Candidatos de teste</h2>
                    <p class="ucam-section__hint">Só no protótipo, com o backend de mentira (npm run mock).</p>
                    <div class="ucam-grid" role="list">
                      @for (c of candidatosDeTeste; track c.oid) {
                        <ucam-card role="listitem" [titulo]="c.nome" [apoio]="c.apoio" icone="user" [acionavel]="true" [href]="'/candidato/' + c.oid" />
                      }
                    </div>
                  </section>
                }
              </div>

              <p class="ucam-login__apoio">
                <ucam-icon name="mail" size="sm" aria-hidden="true" />
                <span>Não recebeu o link? Fale com a secretaria:</span>
                <a class="ucam-link" href="mailto:{{ contato }}">{{ contato }}</a>
                <span aria-hidden="true">·</span>
                <app-tema-toggle />
              </p>
            </section>

            <aside class="ucam-login__institucional" aria-label="Como funciona">
              <div class="ucam-login__discurso">
                <p class="ucam-login__frase">O vestibular da Candido Mendes, no seu tempo e no seu aparelho.</p>
                <ul class="ucam-login__sistemas">
                  <li class="ucam-login__sistema">
                    <span class="ucam-login__sistema-nome">Um link, uma pessoa</span>
                    <span class="ucam-login__sistema-apoio">O link do e-mail já identifica você — não há senha.</span>
                  </li>
                  <li class="ucam-login__sistema">
                    <span class="ucam-login__sistema-nome">Prova com tempo</span>
                    <span class="ucam-login__sistema-apoio">O relógio só começa quando você clicar em Iniciar prova.</span>
                  </li>
                  <li class="ucam-login__sistema">
                    <span class="ucam-login__sistema-nome">Tudo salvo sozinho</span>
                    <span class="ucam-login__sistema-apoio">Cada resposta é gravada na hora; se a conexão cair, nada se perde.</span>
                  </li>
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  `,
})
export class SemLinkPage {
  private readonly router = inject(Router);
  readonly contato = environment.contatoSecretaria;
  readonly candidatosDeTeste = environment.candidatosDeTeste;
  readonly texto = signal('');
  readonly erro = signal<string | null>(null);

  entrar(evento?: Event): void {
    evento?.preventDefault();
    const destino = destinoDoLink(this.texto());
    if (!destino) {
      this.erro.set('Cole o link do e-mail ou o código que vem no fim dele.');
      return;
    }
    this.erro.set(null);
    void this.router.navigate(['/candidato', destino.oid], {
      queryParams: destino.tentativa ? { tentativa: destino.tentativa } : {},
    });
  }
}
