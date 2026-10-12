import { contratoDe } from './contrato';
import { mesmaArvore, normalizar } from './paridade';

const no = (html: string) => {
  const d = document.createElement('div');
  d.innerHTML = html;
  return d;
};

describe('paridade', () => {
  it('ignora a ordem das classes, comentários do Angular e atributos de diretiva', () => {
    const a = no('<a class="ucam-site-btn ucam-site-btn--primary" href="/x">Ver</a>');
    const b = no('<!--container--><a ucamsitebutton variant="primary" _ngcontent-c1 class="ucam-site-btn--primary ucam-site-btn" href="/x"> Ver </a>');
    expect(mesmaArvore(a, b).igual).toBe(true);
  });
  it('reprova classe a mais', () => {
    const r = mesmaArvore(no('<span class="ucam-site-tag"></span>'), no('<span class="ucam-site-tag ucam-site-tag--brand"></span>'));
    expect(r.igual).toBe(false);
    expect(r.diferenca).toContain('ucam-site-tag--brand');
  });
  it('reprova elemento a menos', () => {
    expect(mesmaArvore(no('<header><p>a</p><h2>b</h2></header>'), no('<header><h2>b</h2></header>')).igual).toBe(false);
  });
  it('reprova aria diferente e texto diferente', () => {
    expect(mesmaArvore(no('<span role="img" aria-label="Ana"></span>'), no('<span role="img" aria-label="Bia"></span>')).igual).toBe(false);
    expect(mesmaArvore(no('<p>um</p>'), no('<p>dois</p>')).igual).toBe(false);
  });
  it('reprova tag diferente', () => {
    expect(mesmaArvore(no('<a class="ucam-site-btn"></a>'), no('<button class="ucam-site-btn"></button>')).igual).toBe(false);
  });
  it('reprova elemento na profundidade errada', () => {
    expect(mesmaArvore(no('<div><p>a</p></div><p>b</p>'), no('<div><p>a</p><p>b</p></div>')).igual).toBe(false);
  });
  it('conta o href do <use> do ícone', () => {
    const a = no('<svg class="ic" aria-hidden="true"><use href="#i-check"/></svg>');
    const b = no('<svg class="ic" aria-hidden="true"><use href="#i-x"/></svg>');
    expect(mesmaArvore(a, b).igual).toBe(false);
  });
  it('aceita string de HTML no lugar de elemento', () => {
    expect(normalizar('<span class="b a">x</span>')).toBe(normalizar(no('<span class="a b"> x </span>')));
  });
  it('lê a raiz da peça no contrato', () => {
    expect(contratoDe('button').raiz).toBe('ucam-site-btn');
  });

  // A lista era de atributos que CONTAM, e escondia o que as próximas peças
  // têm de acertar: target e rel no link externo, required e placeholder no
  // campo, loading na imagem (revisão de 10/10/2026). Agora conta tudo, menos
  // o andaime do Angular e as entradas da própria peça.
  it('reprova qualquer atributo diferente, não só os de uma lista', () => {
    for (const [a, b] of [
      ['<a href="/x" target="_blank" rel="noopener">x</a>', '<a href="/x">x</a>'],
      ['<input required placeholder="E-mail">', '<input placeholder="E-mail">'],
      ['<img src="a.jpg" alt="" loading="lazy">', '<img src="a.jpg" alt="">'],
      ['<p lang="en">x</p>', '<p>x</p>'],
      ['<div hidden>x</div>', '<div>x</div>'],
      ['<span data-estado="a">x</span>', '<span data-estado="b">x</span>'],
    ]) {
      expect(mesmaArvore(no(a), no(b)).igual, `${a} × ${b}`).toBe(false);
    }
  });
  it('ignora a entrada só no elemento que leva o seletor da peça', () => {
    // No botão, `variant` e `size` são entradas: não contam.
    expect(mesmaArvore(no('<a class="ucam-site-btn"></a>'), no('<a ucamsitebutton variant="ghost" size="lg" class="ucam-site-btn"></a>')).igual).toBe(true);
    // Num elemento que não é a peça, o mesmo atributo é um atributo de verdade.
    expect(mesmaArvore(no('<a class="ucam-site-btn"></a>'), no('<a size="lg" class="ucam-site-btn"></a>')).igual).toBe(false);
    // `name` é entrada do avatar e atributo de verdade num campo.
    expect(mesmaArvore(no('<span class="ucam-site-avatar"></span>'), no('<span ucamsiteavatar name="Ana" class="ucam-site-avatar"></span>')).igual).toBe(true);
    expect(mesmaArvore(no('<input>'), no('<input name="email">')).igual).toBe(false);
  });
  it('o valor do seletor do ícone é entrada; o href do <use> conta', () => {
    const a = no('<svg class="ic" aria-hidden="true"><use href="#i-check"></use></svg>');
    const b = no('<svg ucamSiteIcon="check" class="ic" aria-hidden="true"><use href="#i-check"></use></svg>');
    expect(mesmaArvore(a, b).igual).toBe(true);
  });

  // A página de cada peça renderiza a demo três vezes, e ids iguais fariam o
  // rótulo de uma cópia apontar para o campo de outra. As demos Angular usam
  // ids próprios; o que se compara é a LIGAÇÃO, não o nome (fatia 3a-2).
  it('ids diferentes com a mesma ligação são iguais', () => {
    const a = no('<label for="a">E-mail</label><input id="a" aria-describedby="a-h a-e"><p id="a-h">x</p><p id="a-e">y</p><a href="#a">ir</a>');
    const b = no('<label for="b-ng">E-mail</label><input id="b-ng" aria-describedby="b-ng-h b-ng-e"><p id="b-ng-h">x</p><p id="b-ng-e">y</p><a href="#b-ng">ir</a>');
    expect(mesmaArvore(a, b).igual).toBe(true);
  });
  it('ligação quebrada reprova: rótulo que aponta para um id que não existe', () => {
    const certo = no('<label for="a">E-mail</label><input id="a">');
    const quebrado = no('<label for="a">E-mail</label><input id="b">');
    expect(mesmaArvore(certo, quebrado).igual).toBe(false);
  });
  it('descrição que aponta para outro elemento reprova', () => {
    const a = no('<input id="c" aria-describedby="h"><p id="h">apoio</p><p id="e">erro</p>');
    const b = no('<input id="c" aria-describedby="e"><p id="h">apoio</p><p id="e">erro</p>');
    expect(mesmaArvore(a, b).igual).toBe(false);
  });
  it('o grupo do acordeão é comparado pela ligação: mesmo name contra names diferentes reprova', () => {
    const grupo = no('<details name="faq"></details><details name="faq"></details>');
    const outroNome = no('<details name="faq-ng"></details><details name="faq-ng"></details>');
    const soltos = no('<details name="a"></details><details name="b"></details>');
    expect(mesmaArvore(grupo, outroNome).igual).toBe(true);
    expect(mesmaArvore(grupo, soltos).igual).toBe(false);
  });
  it('href de âncora que não aponta para dentro do trecho continua literal', () => {
    // O ícone aponta para o sprite, fora do trecho: #i-check contra #i-x é diferença de verdade.
    expect(mesmaArvore(no('<use href="#i-check"></use>'), no('<use href="#i-x"></use>')).igual).toBe(false);
    expect(mesmaArvore(no('<a href="/x">x</a>'), no('<a href="/y">x</a>')).igual).toBe(false);
  });
});
