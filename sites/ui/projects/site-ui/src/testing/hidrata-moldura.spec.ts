/**
 * As oito peças da fatia 3a-2, no servidor e depois no cliente com
 * hidratação. O que se confere:
 *  - a forma da árvore é a mesma antes e depois (nenhum nó duplicado);
 *  - os ids gerados no servidor são os que o cliente gera (o rótulo continua
 *    apontando para o campo);
 *  - nenhum aviso de hidratação;
 *  - depois de hidratar o comportamento está ligado: Esc fecha o menu,
 *    o acordeão avisa, a paginação em memória emite.
 */
import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { bootstrapApplication, provideClientHydration } from '@angular/platform-browser';
import { provideServerRendering, renderApplication } from '@angular/platform-server';
import { UCAM_SITE } from '../public-api';

@Component({
  selector: 'app-raiz',
  imports: [UCAM_SITE],
  template: `<div ucamSitePage>
    <a ucamSiteSkip href="#conteudo">Ir para o conteúdo</a>
    <header ucamSiteHeader brand="CENPRE" brandLabel="CENPRE, página inicial" current="/vagas" [items]="itens" [action]="acao"></header>
    <main ucamSitePageMain id="conteudo">
      <section ucamSiteSecao tone="sutil"><div ucamSiteContainer width="prosa">
        <nav ucamSiteBreadcrumb [items]="trilha"></nav>
        <div ucamSiteAccordion name="faq">
          <details ucamSiteAccordionItem heading="Primeira" open (openChange)="avisos.push($event)"><p>Um.</p></details>
          <details ucamSiteAccordionItem heading="Segunda"><p>Dois.</p></details>
        </div>
        <div ucamSiteField label="Nome" hint="Como no documento."><input ucamSiteInput type="text"></div>
        <div ucamSiteField label="E-mail" error="Informe o e-mail."><input ucamSiteInput type="email"></div>
        <nav ucamSitePagination [page]="pagina()" [total]="89" ariaLabel="Paginação das vagas" emMemoria (pageChange)="pagina.set($event)"></nav>
        <form ucamSiteNewsletter heading="Receba as vagas" note="Um e-mail por semana."></form>
      </div></section>
    </main>
    <footer ucamSiteFooter brand="UCAM" legal="© 2026" [columns]="colunas" [contact]="contato" [social]="redes"><a ucamSiteFooterMarca ucamSiteButton variant="secondary" inverse href="/portal">Portal</a></footer>
  </div>`,
})
class Raiz {
  readonly itens = [{ label: 'Vagas', href: '/vagas' }, { label: 'Empresas', href: '/empresas' }];
  readonly acao = { label: 'Acessar plataforma', href: '/plataforma' };
  readonly trilha = [{ label: 'Início', href: '/' }, { label: 'Vagas' }];
  readonly colunas = [{ title: 'Aluno', links: [{ label: 'Estágio', href: '/estagio' }] }];
  readonly contato = { title: 'Contato', items: [{ label: 'cenpre@ucam.edu.br', href: 'mailto:cenpre@ucam.edu.br' }, { label: '(21) 2531-2000' }] };
  readonly redes = [{ label: 'Instagram', href: 'https://instagram.com/ucam' }];
  readonly pagina = signal(2);
  readonly avisos: boolean[] = [];
}

const forma = (raiz: Element) => {
  const tags: Record<string, number> = {};
  for (const el of raiz.querySelectorAll('*')) tags[el.localName] = (tags[el.localName] ?? 0) + 1;
  return tags;
};
/** A ligação por id: quem declara, e quem cita. */
const ligacoes = (raiz: Element) => [...raiz.querySelectorAll('[id], [for], [aria-describedby]')].map((e) => `${e.localName} id=${e.id} for=${e.getAttribute('for') ?? ''} desc=${e.getAttribute('aria-describedby') ?? ''}`);

describe('hidratação das peças de moldura e formulário', () => {
  it('o cliente reaproveita o HTML do servidor, com os mesmos ids, e o comportamento fica ligado', async () => {
    const html = await renderApplication(
      (contexto) => bootstrapApplication(Raiz, { providers: [provideServerRendering(), provideZonelessChangeDetection(), provideClientHydration()] }, contexto),
      { document: '<!doctype html><html><head></head><body><app-raiz></app-raiz></body></html>', url: '/' },
    );
    TestBed.resetTestingModule();
    document.body.innerHTML = /<body[^>]*>([\s\S]*)<\/body>/.exec(html)![1];
    const raiz = document.querySelector('app-raiz')!;
    const doServidor = { forma: forma(raiz), ligacoes: ligacoes(raiz), cabecalho: raiz.querySelector('header'), campo: raiz.querySelector('input') };

    // O servidor já entrega a página pronta: sem script, ela está certa.
    expect(raiz.querySelectorAll('header .ucam-site-header__nav a').length).toBe(2);
    expect(raiz.querySelector<HTMLDetailsElement>('.ucam-site-accordion__item')!.hasAttribute('open')).toBe(true);
    expect(raiz.querySelector('.ucam-site-pagination [aria-current="page"]')!.textContent).toBe('2');
    expect(raiz.querySelector('input[type="email"]')!.getAttribute('aria-invalid')).toBe('true');
    const ids = [...raiz.querySelectorAll('[id]')].map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const rotulo of raiz.querySelectorAll('label')) expect(raiz.querySelector(`[id="${rotulo.getAttribute('for')}"]`), rotulo.textContent!).not.toBeNull();
    for (const campo of raiz.querySelectorAll('[aria-describedby]')) {
      for (const id of campo.getAttribute('aria-describedby')!.split(' ')) expect(raiz.querySelector(`[id="${id}"]`), id).not.toBeNull();
    }

    const avisos: string[] = [];
    const erro = console.error;
    const aviso = console.warn;
    console.error = (...a: unknown[]) => void avisos.push(String(a[0]));
    console.warn = (...a: unknown[]) => void avisos.push(String(a[0]));
    const app = await bootstrapApplication(Raiz, { providers: [provideZonelessChangeDetection(), provideClientHydration()] });
    try {
      await app.whenStable();
      app.tick();
      expect(raiz.querySelector('header')).toBe(doServidor.cabecalho);
      expect(raiz.querySelector('input')).toBe(doServidor.campo);
      expect(forma(raiz)).toEqual(doServidor.forma);
      expect(ligacoes(raiz)).toEqual(doServidor.ligacoes);
      expect(avisos).toEqual([]);
      const instancia = app.components[0].instance as Raiz;
      // Os eventos nascem do próprio documento (createEvent): depois do render
      // no servidor, os construtores globais do teste não são mais os dele.
      const evento = (tipo: string, extra: Record<string, unknown> = {}) => {
        const ev = raiz.ownerDocument.createEvent('Event');
        ev.initEvent(tipo, true, true);
        for (const [k, v] of Object.entries(extra)) Object.defineProperty(ev, k, { value: v });
        return ev;
      };

      // Cabeçalho: Esc, com o foco dentro do menu aberto, fecha.
      const menu = raiz.querySelector<HTMLDetailsElement>('.ucam-site-header__menu')!;
      menu.open = true;
      menu.querySelector('a')!.dispatchEvent(evento('keydown', { key: 'Escape' }));
      expect(menu.open).toBe(false);

      // Acordeão: fechar o item que nasceu aberto avisa.
      const item = raiz.querySelector<HTMLDetailsElement>('.ucam-site-accordion__item')!;
      item.open = false;
      item.dispatchEvent(evento('toggle'));
      expect(instancia.avisos).toEqual([false]);

      // Paginação em memória: o clique emite, a página troca, e a marcação acompanha sem sobra.
      const tres = [...raiz.querySelectorAll('.ucam-site-pagination a')].find((a) => a.textContent === '3')!;
      const clique = evento('click');
      tres.dispatchEvent(clique);
      expect(clique.defaultPrevented).toBe(true);
      expect(instancia.pagina()).toBe(3);
      app.tick();
      await app.whenStable();
      expect(raiz.querySelector('.ucam-site-pagination [aria-current="page"]')!.textContent).toBe('3');
      expect(raiz.querySelectorAll('.ucam-site-pagination [aria-current]').length).toBe(1);
    } finally {
      console.error = erro;
      console.warn = aviso;
      app.destroy();
      document.body.innerHTML = '';
    }
  });
});
