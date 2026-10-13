import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, input } from '@angular/core';

/**
 * Cartão de curso. Contrato: sites/spec/components/course-card.json.
 *
 * Tudo é dado do curso. As tags são o nível e a modalidade; os metadados, a
 * duração, o turno e o campus — só os que vierem: curso sem turno não deixa
 * item vazio. O nome leva o único link, que a folha estica sobre o cartão.
 */
@Component({
  selector: 'article[ucamSiteCourseCard]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'ucam-site-course-card' },
  template: `@if (foto(); as src) {<img class="ucam-site-course-card__media" [attr.src]="src" alt="">}<div class="ucam-site-course-card__body">@if (tags().length) {<ul class="ucam-site-course-card__tags">@for (t of tags(); track $index) {<li class="ucam-site-tag">{{ t }}</li>}</ul>}<h3 class="ucam-site-course-card__title">@if (destino(); as d) {<a class="ucam-site-course-card__link" [attr.href]="d">{{ name() }}</a>} @else {<ng-container>{{ name() }}</ng-container>}</h3>@if (meta().length) {<ul class="ucam-site-course-card__meta">@for (m of meta(); track $index) {<li>{{ m }}</li>}</ul>}</div>`,
})
export class UcamSiteCourseCard {
  readonly name = input.required<string>();
  /** A página do curso. */
  readonly href = input<string | null | undefined>(null);
  /** Presencial, EAD ou Semipresencial. */
  readonly modality = input<string | null | undefined>(null);
  /** Graduação, Pós-graduação, Mestrado. */
  readonly level = input<string | null | undefined>(null);
  readonly duration = input<string | null | undefined>(null);
  readonly shift = input<string | null | undefined>(null);
  readonly campus = input<string | null | undefined>(null);
  /** O endereço da foto, sempre decorativa. */
  readonly image = input<string | null | undefined>(null);

  private readonly ditos = (...valores: (string | null | undefined)[]) => valores.map((v) => v?.trim()).filter((v): v is string => !!v);

  /** Só há link com destino E nome do curso: link sem texto não tem nome. */
  protected readonly destino = computed(() => (this.name()?.trim() ? this.href()?.trim() || null : null));
  protected readonly foto = computed(() => this.image()?.trim() || null);
  protected readonly tags = computed(() => this.ditos(this.level(), this.modality()));
  protected readonly meta = computed(() => this.ditos(this.duration(), this.shift(), this.campus()));
}
