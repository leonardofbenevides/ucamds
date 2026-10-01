import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { UcamButton, UcamField, UcamIcon, UcamIconTile, UcamListItem, describedBy, nextFieldIds } from '@ucam/ui';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CenaProva } from '../../layout/cena-prova';
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
 * o campo do código da inscrição (que também aceita o link inteiro colado)
 * e, no protótipo, os candidatos do backend de mentira como atalho. O botão
 * nunca desabilita (ADR-042): vazio, ele explica o que falta.
 */
@Component({
  selector: 'app-sem-link',
  imports: [UcamButton, UcamField, UcamIcon, UcamIconTile, UcamListItem, TemaToggle, CenaProva],
  template: `
    <div class="ucam-shell ucam-shell--sem-nav" data-nav="closed" data-sistema="pessoas">
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
                  <h1 class="ucam-page-header__title" id="t-sem-link">Entre com o código da inscrição</h1>
                  <p class="ucam-lede">A universidade enviou por e-mail um link só seu. Abra o link — ou informe aqui o código que vem no fim dele.</p>
                </div>

                <form class="ucam-stack" novalidate (submit)="entrar($event)">
                  <!-- Campo e ação na mesma altura (lg), como na entrada de
                       referência do DS: numa tela de tarefa única, alturas
                       diferentes leem como peças de sistemas diferentes. O
                       degrau lg do campo é a variante ucam-field--lg, e o
                       grupo é o do Trilho A — o <ucam-input-group> carimba a
                       mesma classe no host e desenha a moldura duas vezes. -->
                  <ucam-field
                    class="ucam-field--lg"
                    label="Código da inscrição"
                    hint="É o trecho final do link do e-mail. Colar o link inteiro também funciona."
                    [controlId]="ids.controlId"
                    [hintId]="ids.hintId"
                    [errorId]="ids.errorId"
                    [invalid]="!!erro()"
                    [errorMessage]="erro()"
                  >
                    <div class="ucam-input-group">
                      <span class="ucam-input-group__adorno" aria-hidden="true"><ucam-icon name="hash" size="sm" /></span>
                      <input
                        class="ucam-input-group__controle"
                        [id]="ids.controlId"
                        type="text"
                        autocomplete="off"
                        autocapitalize="off"
                        spellcheck="false"
                        [value]="texto()"
                        (input)="digitar($event)"
                        [attr.aria-invalid]="erro() ? 'true' : null"
                        [attr.aria-describedby]="descricao()"
                      />
                    </div>
                  </ucam-field>
                  <ucam-button variant="primary" size="lg" iconEnd="arrowRight" (click)="entrar($event)">Entrar</ucam-button>
                </form>

                @if (candidatosDeTeste.length) {
                  <section class="ucam-stack ucam-stack--sm" aria-labelledby="t-teste">
                    <h2 class="ucam-login__ou" id="t-teste">Candidatos de teste do protótipo</h2>
                    <!-- O clique passa pelo backend de mentira antes de entrar:
                         prova já entregue volta ao zero, prova em andamento
                         continua. O href fica para quem abre em outra aba. -->
                    <ul class="ucam-list">
                      @for (c of candidatosDeTeste; track c.oid) {
                        <ucam-list-item
                          [title]="c.nome"
                          [support]="c.apoio"
                          [name]="c.nome"
                          [href]="'/candidato/' + c.oid"
                          (click)="abrirTeste($event, c.oid)"
                        />
                      }
                    </ul>
                    <p class="ucam-section__hint">Cada atalho abre uma prova nova quando a anterior já foi entregue; prova em andamento continua de onde parou.</p>
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
                    <ucam-icon-tile icon="mail" />
                    <span class="ucam-login__sistema-texto">
                      <span class="ucam-login__sistema-nome">Um código, uma pessoa</span>
                      <span class="ucam-login__sistema-apoio">O código do e-mail já identifica você — não há senha.</span>
                    </span>
                  </li>
                  <li class="ucam-login__sistema">
                    <ucam-icon-tile icon="clock" />
                    <span class="ucam-login__sistema-texto">
                      <span class="ucam-login__sistema-nome">Prova com tempo</span>
                      <span class="ucam-login__sistema-apoio">O relógio só começa quando você clicar em Iniciar prova.</span>
                    </span>
                  </li>
                  <li class="ucam-login__sistema">
                    <ucam-icon-tile icon="circleCheck" />
                    <span class="ucam-login__sistema-texto">
                      <span class="ucam-login__sistema-nome">Tudo salvo sozinho</span>
                      <span class="ucam-login__sistema-apoio">Cada resposta é gravada na hora; se a conexão cair, nada se perde.</span>
                    </span>
                  </li>
                </ul>
              </div>
              <app-cena-prova />
            </aside>
          </div>
        </div>
      </main>
    </div>
  `,
})
export class SemLinkPage {
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  readonly contato = environment.contatoSecretaria;
  readonly candidatosDeTeste = environment.candidatosDeTeste;
  readonly ids = nextFieldIds('codigo-inscricao');
  readonly texto = signal('');
  readonly erro = signal<string | null>(null);
  readonly descricao = computed(() => describedBy(this.ids, true, !!this.erro()));

  digitar(evento: Event): void {
    this.texto.set((evento.target as HTMLInputElement).value);
  }

  entrar(evento?: Event): void {
    evento?.preventDefault();
    const destino = destinoDoLink(this.texto());
    if (!destino) {
      this.erro.set('Falta o código da inscrição. Cole o código ou o link que veio no e-mail.');
      return;
    }
    this.erro.set(null);
    void this.router.navigate(['/candidato', destino.oid], {
      queryParams: destino.tentativa ? { tentativa: destino.tentativa } : {},
    });
  }

  /**
   * Atalho de teste: pede ao backend de mentira uma prova nova e entra. Se
   * ele não responder, entra do mesmo jeito — o atalho não pode depender de
   * uma rota que só existe no protótipo.
   */
  async abrirTeste(evento: Event, oid: string): Promise<void> {
    evento.preventDefault();
    if (environment.mockNovaProva) {
      await firstValueFrom(this.http.post(environment.mockNovaProva + oid, null)).catch(() => null);
    }
    void this.router.navigate(['/candidato', oid]);
  }
}
