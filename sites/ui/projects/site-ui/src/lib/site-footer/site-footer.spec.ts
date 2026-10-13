import { Component, signal } from '@angular/core';
import { blocosComuns, monta } from '../../testing/peca';
import { UcamSiteButton } from '../button/button';
import { UcamSiteFooter, UcamSiteFooterMarca, type UcamSiteFooterColumn } from './site-footer';

const COLUNAS: UcamSiteFooterColumn[] = [
  { title: 'Aluno e egresso', links: [{ label: 'Estágio', href: '/estagio' }, { label: 'Currículo', href: '/curriculo' }] },
  { title: 'Empresa', links: [{ label: 'Cadastro de convênio', href: '/convenio' }] },
];
const CONTATO = { title: 'Contato', items: [{ label: 'cenpre@ucam.edu.br', href: 'mailto:cenpre@ucam.edu.br' }, { label: '(21) 2531-2000' }] };

@Component({
  imports: [UcamSiteFooter, UcamSiteFooterMarca, UcamSiteButton],
  template: `<footer ucamSiteFooter data-peca class="minha" brand="Universidade Candido Mendes" legal="© 2026 Universidade Candido Mendes."
    [columns]="$any(e()['columns'])" [contact]="$any(e()['contact'])" [social]="$any(e()['social'])">
    @if (e()['portal']) { <a ucamSiteFooterMarca ucamSiteButton variant="secondary" inverse href="/portal">Acessar o portal</a> }
  </footer>`,
})
class Hospede {
  readonly e = signal<Record<string, unknown>>({});
}

/** O rodapé como texto: uma linha por bloco da grade, e a faixa de baixo. */
const desenho = (el: HTMLElement) => ({
  grade: [...el.querySelector('.ucam-site-footer__grid')!.children].map((b) =>
    b.classList.contains('ucam-site-footer__brand')
      ? `marca: ${[...b.children].map((c) => c.textContent!.trim()).join(' | ')}`
      : `${b.querySelector('h2')!.textContent}: ${[...b.querySelectorAll('li a, address > *')].map((c) => `${c.localName} ${c.textContent}`).join(', ')}`,
  ),
  baixo: [...el.querySelector('.ucam-site-footer__bottom')!.children].map((c) => `${c.localName}.${c.className}`),
});

describe('footer[ucamSiteFooter]', () => {
  blocosComuns('site-footer', Hospede);

  it('só com o obrigatório: a marca e a linha de direitos, sem lista vazia nem título órfão', () => {
    const { el } = monta(Hospede);
    expect(desenho(el)).toEqual({ grade: ['marca: Universidade Candido Mendes'], baixo: ['p.ucam-site-footer__legal'] });
    expect(el.querySelector('ul')).toBeNull();
    expect(el.querySelector('h2')).toBeNull();
    expect(el.querySelector('address')).toBeNull();
    expect(el.querySelector('.ucam-site-footer__legal')!.textContent).toBe('© 2026 Universidade Candido Mendes.');
  });

  it('colunas, contato e redes entram na ordem do contrato', () => {
    const { el } = monta(Hospede, { columns: COLUNAS, contact: CONTATO, social: [{ label: 'Instagram', href: 'https://instagram.com/ucam' }], portal: true });
    expect(desenho(el)).toEqual({
      grade: [
        'marca: Universidade Candido Mendes | Acessar o portal',
        'Aluno e egresso: a Estágio, a Currículo',
        'Empresa: a Cadastro de convênio',
        'Contato: a cenpre@ucam.edu.br, span (21) 2531-2000',
      ],
      baixo: ['p.ucam-site-footer__legal', 'ul.ucam-site-footer__social'],
    });
    expect(el.querySelectorAll('.ucam-site-footer__col').length).toBe(2);
    expect([...el.querySelectorAll('a.ucam-site-footer__link')].every((a) => a.getAttribute('href'))).toBe(true);
    expect(el.querySelector('address a')!.getAttribute('href')).toBe('mailto:cenpre@ucam.edu.br');
  });

  it('o conteúdo marcado vai para o bloco da marca, com as classes da peça que ele já é', () => {
    const { el } = monta(Hospede, { portal: true });
    const botao = el.querySelector('.ucam-site-footer__brand a')!;
    expect(botao.className.split(' ').sort()).toEqual(['ucam-site-btn', 'ucam-site-btn--inverse', 'ucam-site-btn--secondary']);
    expect(botao.getAttribute('href')).toBe('/portal');
  });

  it('quatro colunas mais o contato: cinco blocos depois da marca', () => {
    const quatro = [...COLUNAS, { title: 'Institucional', links: [{ label: 'Sobre nós', href: '/sobre' }] }, { title: 'Imprensa', links: [{ label: 'Notícias', href: '/noticias' }] }];
    const { el } = monta(Hospede, { columns: quatro, contact: CONTATO });
    expect(el.querySelector('.ucam-site-footer__grid')!.children.length).toBe(6);
  });

  it('dado torto não vira marcação vazia', () => {
    const { el } = monta(Hospede, {
      columns: [{ title: 'Vazia', links: [] }, { title: '', links: [{ label: 'x', href: '/x' }] }, { title: 'Boa', links: [{ label: 'Sem destino' }, { label: '  ', href: '/y' }, { label: 'Ok', href: '/ok' }] }, null],
      contact: { title: 'Contato', items: [] },
      social: [{ label: 'Sem endereço' }, { label: '', href: '/z' }],
    });
    expect(desenho(el)).toEqual({ grade: ['marca: Universidade Candido Mendes', 'Boa: a Ok'], baixo: ['p.ucam-site-footer__legal'] });
  });

  it('trocar os dados troca a marcação, sem sobra', () => {
    const { f, el } = monta(Hospede, { columns: COLUNAS, contact: CONTATO });
    f.componentInstance.e.set({ columns: [COLUNAS[1]] });
    f.detectChanges();
    expect(desenho(el).grade).toEqual(['marca: Universidade Candido Mendes', 'Empresa: a Cadastro de convênio']);
  });
});
