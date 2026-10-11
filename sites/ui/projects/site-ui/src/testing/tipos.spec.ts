/**
 * A entrada aceita, na ESCRITA, só os valores do contrato: um literal errado
 * no template do consumidor é erro de compilação, não um botão primário em
 * produção. A queda no padrão em tempo de execução continua (peca.ts a
 * testa) para o que chega sem tipo: $any, JavaScript, dado de CMS.
 *
 * O teste é de tipos: cada `@ts-expect-error` abaixo tem de acusar erro. Com
 * a entrada tipada como `unknown` (como nasceu), o erro não acontece e a
 * diretiva sobra — e sobra de `@ts-expect-error` reprova a compilação.
 */
import { type InputSignalWithTransform } from '@angular/core';
import { type UcamSiteAvatar } from '../lib/avatar/avatar';
import { type UcamSiteButton } from '../lib/button/button';
import { type UcamSiteIconChip } from '../lib/icon-chip/icon-chip';
import { type UcamSiteSectionHeading } from '../lib/section-heading/section-heading';
import { type UcamSiteTag } from '../lib/tag/tag';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- só a posição de escrita interessa
type Escrita<S> = S extends InputSignalWithTransform<any, infer W> ? W : never;

describe('tipos das entradas', () => {
  it('valor do contrato compila; valor de fora não', () => {
    const certos: [Escrita<UcamSiteButton['variant']>, Escrita<UcamSiteButton['size']>, Escrita<UcamSiteTag['tone']>, Escrita<UcamSiteIconChip['tone']>, Escrita<UcamSiteAvatar['shape']>, Escrita<UcamSiteSectionHeading['align']>, Escrita<UcamSiteSectionHeading['level']>] = ['ghost', 'lg', 'info', 'neutral', 'logo', 'center', 3];
    expect(certos.length).toBe(7);

    // @ts-expect-error variante que o contrato não tem
    const a: Escrita<UcamSiteButton['variant']> = 'outline';
    // @ts-expect-error tamanho que o contrato não tem
    const b: Escrita<UcamSiteButton['size']> = 'xs';
    // @ts-expect-error tom que o contrato não tem
    const c: Escrita<UcamSiteTag['tone']> = 'danger';
    // @ts-expect-error tamanho que o contrato não tem
    const d: Escrita<UcamSiteIconChip['size']> = 'sm';
    // @ts-expect-error forma que o contrato não tem
    const e: Escrita<UcamSiteAvatar['shape']> = 'square';
    // @ts-expect-error tamanho que o contrato não tem
    const f: Escrita<UcamSiteSectionHeading['size']> = 'hero';
    // @ts-expect-error nível que o contrato não tem
    const g: Escrita<UcamSiteSectionHeading['level']> = 4;
    expect([a, b, c, d, e, f, g].length).toBe(7);
  });

  it('nulo e indefinido são aceitos: a ligação de um dado opcional não precisa de ?? no template', () => {
    const v: Escrita<UcamSiteButton['variant']>[] = [null, undefined];
    expect(v.length).toBe(2);
  });
});
