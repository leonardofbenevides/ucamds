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
});
