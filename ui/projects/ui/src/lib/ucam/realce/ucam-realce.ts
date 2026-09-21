import { ChangeDetectionStrategy, Component, computed, input, ViewEncapsulation } from '@angular/core';

/**
 * Contrato: spec/components/realce.json
 *
 * O trecho que casou com o termo buscado, pintado dentro da própria frase.
 * Responde a uma pergunta que a lista filtrada não responde sozinha: POR QUE
 * este item ficou.
 *
 * NÃO É PIPE, e o contrato já dizia por quê: um pipe que devolvesse HTML
 * exigiria innerHTML na tela, e aí o texto de um registro passaria a ser
 * interpretado como marcação. Nome de setor com "<" viraria tag. Aqui a
 * fatia vira nós de TEXTO por interpolação, que o Angular escapa sozinho — o
 * conteúdo do banco nunca chega a ser markup.
 *
 * O realce NUNCA reescreve o texto que exibe: ele só decide onde abrir e
 * fechar a marca. Acento, caixa e pontuação saem como entraram.
 */
export type UcamRealceModo = 'trecho' | 'palavras';

interface Fatia {
  t: string;
  marcado: boolean;
}

/**
 * Comparação SEM acento e SEM caixa, mas o recorte é aplicado no texto
 * original. É o que faz "pos" achar "PÓS-GRADUAÇÃO" e ainda assim exibir o
 * acento — normalizar para exibir seria reescrever o dado.
 *
 * NFD separa a letra do diacrítico; U+0300..U+036F é o bloco de
 * diacríticos combinantes. O mapa de posições sobrevive porque a remoção
 * acontece caractere a caractere sobre a forma decomposta, e cada posição
 * guarda de qual índice ORIGINAL ela veio.
 */
function dobrar(texto: string): { plano: string; origem: number[] } {
  const plano: string[] = [];
  const origem: number[] = [];
  for (let i = 0; i < texto.length; i++) {
    const sem = texto[i]
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase();
    // Um caractere pode virar zero (diacrítico solto) ou mais de um (ligadura).
    for (const c of sem) {
      plano.push(c);
      origem.push(i);
    }
  }
  return { plano: plano.join(''), origem };
}

@Component({
  selector: 'ucam-realce',
  exportAs: 'ucamRealce',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'contents' },
  template: `@for (f of fatias(); track $index) {@if (f.marcado) {<mark
        class="ucam-realce"
        >{{ f.t }}</mark
      >} @else {{{ f.t }}}}`,
  styles: `
    /* Espelho EXATO do bloco .ucam-realce de tools/build-css.mjs. Escrevi este
       bloco com padding-inline antes de conferir o Trilho A, que já existia e
       já rejeitava o recuo por escrito: a marca cai no MEIO de uma palavra —
       "diplo" dentro de "diplomas" — e qualquer recuo horizontal empurra as
       letras seguintes, partindo a palavra em duas. O respiro vem do SPREAD da
       sombra, que pinta 2px em volta sem ocupar espaço de layout. */
    ucam-realce .ucam-realce {
      background: var(--ucam-color-realce-background);
      color: var(--ucam-color-realce-foreground);
      padding: 0;
      margin: 0;
      box-shadow: 0 0 0 0.125rem var(--ucam-color-realce-background);
      /* Raio de grifo, não de controle: cantos de 8px numa mancha de cinco
         letras devolvem a pastilha que o padding zero acabou de eliminar. */
      border-radius: 0.125rem;
      /* A marca herda o peso do texto em volta. Engrossar o trecho realçado
         remede a linha a cada tecla digitada, e o nome do módulo dança
         enquanto a pessoa busca. */
      font-weight: inherit;
    }
  `,
})
export class UcamRealce {
  /** O texto completo, como deve aparecer. Com acento, com caixa, com pontuação. */
  readonly texto = input.required<string>();
  /**
   * O que a pessoa digitou. null e string vazia devolvem o texto INTACTO, sem
   * marca alguma — condição que precisa ser explícita, porque campo de busca
   * vazio percorrendo a lista inteira era a origem do custo por tecla.
   */
  readonly termo = input<string | null>(null);
  /**
   * `palavras` quebra o termo nos espaços e procura cada pedaço, o que faz
   * "acad pos" achar "ACADÊMICO PÓS-GRADUAÇÃO". É o padrão porque quem busca
   * digita o que lembra, não o que está escrito. `trecho` procura a sequência
   * contígua — código, matrícula, número de requerimento.
   */
  readonly modo = input<UcamRealceModo>('palavras');

  protected readonly fatias = computed<readonly Fatia[]>(() => {
    const texto = this.texto();
    const termo = this.termo()?.trim();
    if (!termo) return [{ t: texto, marcado: false }];

    // PISO DE DUAS LETRAS, que o contrato fixa: uma tela em que cada nome tem
    // uma letra pintada não informa nada e parece defeito. Vale por PEDAÇO e
    // não pelo termo inteiro — "acad p" realça "acad" e ignora o "p", que é o
    // estado natural de quem ainda está digitando a segunda palavra.
    const pedacos = (this.modo() === 'trecho' ? [termo] : termo.split(/\s+/)).filter(
      (p) => p.length >= 2,
    );
    if (!pedacos.length) return [{ t: texto, marcado: false }];

    const { plano, origem } = dobrar(texto);

    // Intervalos em índices do texto ORIGINAL. Coletados de todos os pedaços e
    // depois fundidos: "aca acad" produziria duas marcas sobrepostas na mesma
    // palavra, e duas <mark> encostadas viram dois retângulos com um vinco no
    // meio — além de o leitor de tela anunciar entrada e saída duas vezes.
    const faixas: [number, number][] = [];
    for (const pedaco of pedacos) {
      const alvo = dobrar(pedaco).plano;
      if (!alvo) continue;
      let de = plano.indexOf(alvo);
      while (de !== -1) {
        const ate = de + alvo.length - 1;
        faixas.push([origem[de], origem[ate] + 1]);
        de = plano.indexOf(alvo, de + alvo.length);
      }
    }
    if (!faixas.length) return [{ t: texto, marcado: false }];

    faixas.sort((a, b) => a[0] - b[0]);
    const fundidas: [number, number][] = [faixas[0]];
    for (const [de, ate] of faixas.slice(1)) {
      const ultima = fundidas[fundidas.length - 1];
      if (de <= ultima[1]) ultima[1] = Math.max(ultima[1], ate);
      else fundidas.push([de, ate]);
    }

    const saida: Fatia[] = [];
    let cursor = 0;
    for (const [de, ate] of fundidas) {
      if (de > cursor) saida.push({ t: texto.slice(cursor, de), marcado: false });
      saida.push({ t: texto.slice(de, ate), marcado: true });
      cursor = ate;
    }
    if (cursor < texto.length) saida.push({ t: texto.slice(cursor), marcado: false });
    return saida;
  });
}
