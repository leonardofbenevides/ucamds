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
});
