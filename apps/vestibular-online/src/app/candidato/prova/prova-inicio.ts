import { Component, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CandidatoStore } from '../../core/store/candidato.store';
import { ProvaStore } from '../../core/store/prova.store';

/** `/prova` sem questão: vai para a primeira em branco assim que a prova carrega. */
@Component({ selector: 'app-prova-inicio', template: '' })
export class ProvaInicio {
  constructor() {
    const store = inject(ProvaStore);
    const candidato = inject(CandidatoStore);
    const router = inject(Router);
    effect(() => {
      if (store.estado() !== 'pronto') return;
      const p = store.primeiraEmBranco();
      const base = ['/candidato', candidato.oidFip(), 'prova'];
      router.navigate(p ? [...base, p.slug, p.n] : [...base, 'redacao'], { replaceUrl: true });
    });
  }
}
