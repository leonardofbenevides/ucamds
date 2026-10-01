import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { UcamAlert, UcamButton, UcamDescriptionList, UcamIcon } from '@ucam/ui';
import { CandidatoStore } from '../../core/store/candidato.store';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-entrada',
  imports: [UcamAlert, UcamButton, UcamDescriptionList, UcamIcon],
  templateUrl: './entrada.html',
})
export class EntradaPage {
  readonly store = inject(CandidatoStore);
  private readonly router = inject(Router);
  readonly contato = environment.contatoSecretaria;

  readonly itens = computed(() => [
    { label: 'Nome', value: this.store.nome() },
    { label: 'CPF', value: this.store.cpf() },
    { label: 'Curso', value: this.store.curso() },
    { label: 'Turno', value: this.store.turno() },
  ]);

  readonly jaEntregou = computed(() => ['PROVA_FINALIZADA', 'PROVA_CORRIGIDA'].includes(this.store.situacao() ?? ''));
  readonly rotulo = computed(() => (this.jaEntregou() ? 'Ver resultado' : 'Entrar na prova'));

  /** Só bloqueia quando a prova corrigida pediria nova tentativa e ela não existe. */
  readonly semTentativas = computed(
    () => this.store.situacao() === 'PROVA_CORRIGIDA' && this.store.tentativas() !== null && !this.store.podeTentarDeNovo(),
  );
  readonly totalTentativas = computed(() => this.store.tentativas()?.totalTentativasPossiveis ?? 0);

  seguir(): void {
    const oid = this.store.oidFip();
    this.router.navigate(['/candidato', oid, this.jaEntregou() ? 'resultado' : 'instrucoes']);
  }
}
