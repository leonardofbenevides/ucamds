/*
 * @ucam/ui — API pública do Design System da UCAM.
 *
 * REGRA (ADR-006): nada da ZardUI é reexportado daqui. Aplicações consomem
 * apenas a API da UCAM; a base fica atrás dos wrappers em lib/ucam/.
 * tools/sync-ui.mjs falha o build se algum símbolo Zard* vazar.
 */
export * from './lib/ucam/icon';
export * from './lib/ucam/field';

export * from './lib/ucam/button';
export * from './lib/ucam/icon-button';

export * from './lib/ucam/text-field';
export * from './lib/ucam/textarea';
export * from './lib/ucam/input-group';
export * from './lib/ucam/select';
export * from './lib/ucam/date-field';
export * from './lib/ucam/combobox';
export * from './lib/ucam/compositor';
export * from './lib/ucam/checkbox';
export * from './lib/ucam/switch';
export * from './lib/ucam/segmented';

export * from './lib/ucam/card';
export * from './lib/ucam/choice-card';
export * from './lib/ucam/icon-tile';
export * from './lib/ucam/anexo';
export * from './lib/ucam/file-field';
export * from './lib/ucam/stat';

export * from './lib/ucam/alert';
export * from './lib/ucam/app-shell';
export * from './lib/ucam/chip';
export * from './lib/ucam/citacao';
export * from './lib/ucam/badge';
export * from './lib/ucam/avatar';
export * from './lib/ucam/skeleton';
export * from './lib/ucam/empty-state';
export * from './lib/ucam/progress';

export * from './lib/ucam/realce';

export * from './lib/ucam/list-item';
export * from './lib/ucam/description-list';
export * from './lib/ucam/timeline';
export * from './lib/ucam/chart';
export * from './lib/ucam/command';

export * from './lib/ucam/data-table';
export * from './lib/ucam/tabs';
export * from './lib/ucam/pagination';

export * from './lib/ucam/page-header';
export * from './lib/ucam/section-bar';
export * from './lib/ucam/stepper';

export * from './lib/ucam/menu';
export * from './lib/ucam/dialog';
export * from './lib/ucam/drawer';
export * from './lib/ucam/tooltip';
