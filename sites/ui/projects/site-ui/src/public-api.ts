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
import { UcamSiteAccordion, UcamSiteAccordionItem } from './lib/accordion/accordion';
import { UcamSiteField, UcamSiteInput } from './lib/input/input';
import { UcamSitePagination } from './lib/pagination/pagination';
import { UcamSiteNewsletter } from './lib/newsletter-form/newsletter-form';
import { UcamSiteHeader } from './lib/site-header/site-header';
import { UcamSiteFooter, UcamSiteFooterMarca } from './lib/site-footer/site-footer';
import { UcamSiteHeroPill } from './lib/hero-pill/hero-pill';
import { UcamSiteProse } from './lib/prose/prose';
import { UcamSiteStats } from './lib/stats-band/stats-band';
import { UcamSiteDocCard } from './lib/doc-card/doc-card';
import { UcamSiteTestimonial } from './lib/testimonial/testimonial';
import { UcamSiteSteps, UcamSiteStep } from './lib/step-card/step-card';
import { UcamSiteCard, UcamSiteCardMeta } from './lib/card/card';
import { UcamSiteCourseCard } from './lib/course-card/course-card';
import { UcamSiteHero, UcamSiteHeroPills, UcamSiteHeroActions } from './lib/hero/hero';
import { UcamSitePageHero, UcamSitePageHeroPills, UcamSitePageHeroActions } from './lib/editorial-page-hero/editorial-page-hero';
import { UcamSiteCta, UcamSiteCtaActions } from './lib/editorial-cta/editorial-cta';
import { UcamSiteMarquee } from './lib/logo-marquee/logo-marquee';
import { UcamSiteFactSheet } from './lib/fact-sheet/fact-sheet';
import { UcamSiteSectionTabs } from './lib/section-tabs/section-tabs';
import { UcamSiteTimeline } from './lib/timeline/timeline';
import { UcamSiteContactCard } from './lib/contact-card/contact-card';

export * from './lib/nucleo/provedor';
export * from './lib/icon/icon';
export * from './lib/button/button';
export * from './lib/tag/tag';
export * from './lib/icon-chip/icon-chip';
export * from './lib/avatar/avatar';
export * from './lib/section-heading/section-heading';
export * from './lib/breadcrumb/breadcrumb';
export * from './lib/page-shell/page-shell';
export * from './lib/accordion/accordion';
export * from './lib/input/input';
export * from './lib/pagination/pagination';
export * from './lib/newsletter-form/newsletter-form';
export * from './lib/site-header/site-header';
export * from './lib/site-footer/site-footer';
export * from './lib/hero-pill/hero-pill';
export * from './lib/prose/prose';
export * from './lib/stats-band/stats-band';
export * from './lib/doc-card/doc-card';
export * from './lib/testimonial/testimonial';
export * from './lib/step-card/step-card';
export * from './lib/card/card';
export * from './lib/course-card/course-card';
export * from './lib/hero/hero';
export * from './lib/editorial-page-hero/editorial-page-hero';
export * from './lib/editorial-cta/editorial-cta';
export * from './lib/logo-marquee/logo-marquee';
export * from './lib/fact-sheet/fact-sheet';
export * from './lib/section-tabs/section-tabs';
export * from './lib/timeline/timeline';
export * from './lib/contact-card/contact-card';

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
  UcamSiteAccordion,
  UcamSiteAccordionItem,
  UcamSiteField,
  UcamSiteInput,
  UcamSitePagination,
  UcamSiteNewsletter,
  UcamSiteHeader,
  UcamSiteFooter,
  UcamSiteFooterMarca,
  UcamSiteHeroPill,
  UcamSiteProse,
  UcamSiteStats,
  UcamSiteDocCard,
  UcamSiteTestimonial,
  UcamSiteSteps,
  UcamSiteStep,
  UcamSiteCard,
  UcamSiteCardMeta,
  UcamSiteCourseCard,
  UcamSiteHero,
  UcamSiteHeroPills,
  UcamSiteHeroActions,
  UcamSitePageHero,
  UcamSitePageHeroPills,
  UcamSitePageHeroActions,
  UcamSiteCta,
  UcamSiteCtaActions,
  UcamSiteMarquee,
  UcamSiteFactSheet,
  UcamSiteSectionTabs,
  UcamSiteTimeline,
  UcamSiteContactCard,
] as const;
