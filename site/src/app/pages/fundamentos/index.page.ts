import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

import { fundamentos, meta } from '../../spec/spec';
import { PageHeaderComponent } from '../../docs/page-header.component';

/**
 * A porta das fundações.
 *
 * Eram quatro cartões — cor, tipografia, espaçamento e acessibilidade — e a
 * página de marca, que existia e não aparecia em nenhum deles. Elevação,
 * camadas, breakpoint, movimento, raio e o catálogo de ícones estavam no spec
 * e não tinham página: quem chegava aqui via um sistema com quatro fundações e
 * concluía, corretamente, que o resto não estava documentado.
 *
 * Cada cartão traz um NÚMERO lido do spec, nunca uma frase de vitrine. É o que
 * distingue um índice de um menu: daqui já se sabe se a fundação tem conteúdo.
 */
@Component({
  selector: 'ucam-fundamentos',
  imports: [RouterLink, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ucam-page-header
      secao="Fundamentos"
      [titulo]="'Fundamentos'"
      [lede]="f.descricao"
    />

    <div class="callout callout-warn">
      <p><strong>Origem da paleta.</strong> {{ aviso.origem }} {{ aviso.pendencia }}</p>
    </div>

    <div class="prose">
      <h2>Três camadas, uma regra</h2>
      <p>{{ f.regraCamadas }}</p>
    </div>

    <div class="scroller">
      <table>
        <thead>
          <tr>
            <th scope="col">Camada</th>
            <th scope="col">Exemplo</th>
            <th scope="col">Quem pode referenciar</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Primitiva</td>
            <td><code>wine.600</code> = <code>#8D293A</code></td>
            <td>apenas a camada semântica</td>
          </tr>
          <tr>
            <td>Semântica</td>
            <td><code>color.action.primary.default</code> → <code>{{ '{wine.600}' }}</code></td>
            <td>componentes e aplicações</td>
          </tr>
          <tr>
            <td>Marca / tema</td>
            <td><code>theme.dark.json</code> sobrescreve semânticos</td>
            <td>ninguém — é aplicada por contexto</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="prose">
      <h2>As fundações</h2>
    </div>

    <div class="grade-cartoes">
      @for (c of cartoes; track c.link) {
        <a class="card" [routerLink]="c.link">
          <h3>{{ c.titulo }}</h3>
          <p class="small muted">{{ c.resumo }}</p>
        </a>
      }
    </div>
  `,
  styles: `
    .card h3 {
      margin: 0 0 0.35rem;
      font-size: 1rem;
    }
    .card p {
      margin: 0;
    }
  `,
})
export default class FundamentosPage {
  protected readonly f = fundamentos;
  protected readonly m = meta;
  protected readonly aviso = meta.avisoCores;

  /**
   * A ordem é a de quem CHEGA, não a alfabética: identidade primeiro, depois o
   * que pinta, depois o que se lê, depois o que mede, depois o que se move, e o
   * portão de acessibilidade no fim porque atravessa todos os anteriores.
   *
   * Escrita e Formatos entram logo depois de Tipografia porque respondem à
   * mesma pergunta em camadas diferentes: a tipografia desenha as letras, a
   * escrita escolhe as palavras e o formato decide como o dado vira texto.
   * Visualização de dados fica no fim da fileira de representação, antes do
   * portão: ela DEPENDE de cor, de formato e de escrita ao mesmo tempo.
   */
  protected readonly cartoes = [
    {
      link: '/fundamentos/marca',
      titulo: 'Marca',
      resumo: 'Logo, símbolo, tamanhos mínimos e o que nunca fazer com a assinatura institucional.',
    },
    {
      link: '/fundamentos/cor',
      titulo: 'Cor',
      // As oito famílias, nomeadas em vez de contadas: o número teria de somar
      // três arrays separados (texto, ação, feedback) ao vetor de famílias, e
      // uma soma dessas envelhece calada quando uma família nasce.
      resumo: `${fundamentos.rampas.length} rampas primitivas e oito famílias semânticas — texto, ação, superfície, filete, interação, realce, feedback e gráfico — com contraste calculado no build, nos dois temas.`,
    },
    {
      link: '/fundamentos/tipografia',
      titulo: 'Tipografia',
      resumo: `${fundamentos.tipografia.length} papéis nomeados por função, ${fundamentos.fontes.tamanhos.length} degraus de tamanho e ${fundamentos.fontes.pesos.length} pesos. Nenhum papel usa caixa alta.`,
    },
    {
      link: '/fundamentos/escrita',
      titulo: 'Escrita',
      // A soma vem do agregado dos contratos, não de uma constante: é o número
      // que prova que a fundação não inventou regra nova, juntou as que já
      // existiam espalhadas.
      resumo: `${fundamentos.escrita.principios.length} princípios de voz, ${fundamentos.escrita.vocabulario.termos.length} termos de vocabulário e as ${fundamentos.escrita.totais.regras} regras de texto declaradas nos ${fundamentos.escrita.totais.contratos} contratos, somadas num lugar só.`,
    },
    {
      link: '/fundamentos/formatos',
      titulo: 'Formatos',
      resumo: `${fundamentos.formatos.formatos.length} formatos de dado com a forma na tela e a forma no modelo. Formatar é decisão de domínio: o componente recebe pronto.`,
    },
    {
      link: '/fundamentos/espacamento',
      titulo: 'Espaçamento',
      resumo: `Escala base 4px, ${fundamentos.espacoSemantico.length} tokens semânticos, tamanhos de controle e o anel de foco.`,
    },
    {
      link: '/fundamentos/densidade',
      titulo: 'Densidade e grade',
      resumo: `${fundamentos.densidade.larguras.papeis.length} papéis de largura, ${fundamentos.densidade.alturas.papeis.length} de altura e os dois patamares de alvo de ponteiro — a área clicável não é o desenho.`,
    },
    {
      link: '/fundamentos/raio',
      titulo: 'Raio',
      resumo: `${fundamentos.raioPapeis.length} papéis sobre uma escala de ${fundamentos.raio.length} degraus. Raio se escolhe por papel, nunca por degrau.`,
    },
    {
      link: '/fundamentos/elevacao',
      titulo: 'Elevação',
      resumo: `${fundamentos.elevacao.papeis.length} níveis de sombra por intenção e ${fundamentos.elevacao.camadas.length} camadas de empilhamento — o fim do z-index escolhido no olho.`,
    },
    {
      link: '/fundamentos/breakpoints',
      titulo: 'Breakpoints',
      resumo: `${fundamentos.breakpoints.papeis.length} papéis de viewport sobre ${fundamentos.breakpoints.escala.length} degraus, de ${fundamentos.breakpoints.escala[0].px} a ${
        fundamentos.breakpoints.escala.at(-1)!.px
      }px. Media query escolhe papel, não medida.`,
    },
    {
      link: '/fundamentos/movimento',
      titulo: 'Movimento',
      resumo: `${fundamentos.movimento.curvas.length} curvas e ${fundamentos.movimento.duracoes.length} durações, todas canceladas sob movimento reduzido.`,
    },
    {
      link: '/fundamentos/estados',
      titulo: 'Estados',
      resumo: `${fundamentos.estados.lista.length} estados com ordem de precedência declarada — qual vence quando dois se aplicam, e a única exceção à ordem.`,
    },
    {
      link: '/fundamentos/icones',
      titulo: 'Ícones',
      resumo: `${fundamentos.icones.total} ícones Lucide em ${fundamentos.icones.grupos.length} grupos, cada um com o uso declarado. Um desenho, um significado, em todo o parque.`,
    },
    {
      link: '/fundamentos/dados',
      titulo: 'Visualização de dados',
      resumo: `${fundamentos.dados.veiculos.length} perguntas de dado, cada uma com o componente que a responde, mais a paleta de ${fundamentos.dados.paleta.slots.length} séries verificada sob as três dicromacias.`,
    },
    {
      link: '/fundamentos/acessibilidade',
      titulo: 'Acessibilidade',
      resumo: `${meta.requisitosA11y} requisitos e ${meta.criteriosWcag} critérios WCAG, mapeados por componente.`,
    },
  ];
}
