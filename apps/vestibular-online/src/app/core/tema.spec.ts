import { TestBed } from '@angular/core/testing';
import { Tema } from './tema';

describe('Tema', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('começa no claro e alterna para escuro', () => {
    const tema = TestBed.inject(Tema);
    expect(tema.atual()).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    tema.definir('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('tema')).toBe('dark');
    tema.definir('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('lembra a escolha ao abrir de novo', () => {
    localStorage.setItem('tema', 'light');
    const tema = TestBed.inject(Tema);
    expect(tema.atual()).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });
});
