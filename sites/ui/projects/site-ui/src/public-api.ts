/*
 * @ucam/site-ui — as peças Angular do UCAMDS Sites.
 *
 * REGRA (spec de 10/10/2026): a lib não tem estilo. Cada peça monta o DOM do
 * contrato e aplica as classes de @ucam/site-css; a aparência tem uma fonte
 * só, a folha gerada da spec. Toda peça tem seletor de ATRIBUTO sobre o
 * elemento nativo do contrato: nenhuma cria elemento hospedeiro próprio.
 */
import { UcamSiteAvatar } from './lib/avatar/avatar';
import { UcamSiteButton } from './lib/button/button';
import { UcamSiteIcon } from './lib/icon/icon';
import { UcamSiteIconChip } from './lib/icon-chip/icon-chip';
import { UcamSiteSectionHeading, UcamSiteSectionHeadingAcoes } from './lib/section-heading/section-heading';
import { UcamSiteTag } from './lib/tag/tag';
import { UcamSiteBreadcrumb } from './lib/breadcrumb/breadcrumb';
import { UcamSitePage, UcamSiteSkip, UcamSitePageMain, UcamSiteSecao, UcamSiteContainer } from './lib/page-shell/page-shell';

export * from './lib/nucleo/provedor';
export * from './lib/icon/icon';
export * from './lib/button/button';
export * from './lib/tag/tag';
export * from './lib/icon-chip/icon-chip';
export * from './lib/avatar/avatar';
export * from './lib/section-heading/section-heading';
export * from './lib/breadcrumb/breadcrumb';
export * from './lib/page-shell/page-shell';

/** Todas as peças, para importar de uma vez: `imports: [UCAM_SITE]`. */
export const UCAM_SITE = [
  UcamSiteIcon,
  UcamSiteButton,
  UcamSiteTag,
  UcamSiteIconChip,
  UcamSiteAvatar,
  UcamSiteSectionHeading,
  UcamSiteSectionHeadingAcoes,
  UcamSiteBreadcrumb,
  UcamSitePage,
  UcamSiteSkip,
  UcamSitePageMain,
  UcamSiteSecao,
  UcamSiteContainer,
] as const;
