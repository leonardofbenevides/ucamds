import { BarChart, FunnelChart, GaugeChart, HeatmapChart, LineChart, PieChart, RadarChart, ScatterChart } from 'echarts/charts';
import {
  AriaComponent,
  BrushComponent,
  DatasetComponent,
  DataZoomComponent,
  GraphicComponent,
  GridComponent,
  LegendComponent,
  MarkAreaComponent,
  MarkLineComponent,
  MarkPointComponent,
  PolarComponent,
  TitleComponent,
  ToolboxComponent,
  TooltipComponent,
  TransformComponent,
  VisualMapComponent,
} from 'echarts/components';
import * as echarts from 'echarts/core';
import { LabelLayout, UniversalTransition } from 'echarts/features';
import { CanvasRenderer, SVGRenderer } from 'echarts/renderers';

/**
 * The tree-shaken ECharts build ZardUI charts run on. Drop what you do not use — every
 * entry removed here leaves the bundle.
 *
 * Two must stay:
 * - `LegendComponent`, because the option keeps `legend: { show: false }` and the HTML
 *   legend toggles series through `dispatchAction({ type: 'legendToggleSelect' })`.
 * - `SVGRenderer`, because the server renders through `renderToSVGString()`.
 *
 * Funnel, heatmap, scatter and the visualMap of the heatmap are UCAMDS forms (chart.json).
 * The funnel was in the contract since 23/10/2026 but not registered here, so it never drew.
 *
 * This module is kept apart from `provideZardCharts()` so the provider can import it
 * lazily and keep ECharts out of the application's initial bundle.
 */
echarts.use([
  BarChart,
  LineChart,
  PieChart,
  RadarChart,
  GaugeChart,
  FunnelChart,
  HeatmapChart,
  ScatterChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  DataZoomComponent,
  MarkLineComponent,
  MarkAreaComponent,
  MarkPointComponent,
  PolarComponent,
  GraphicComponent,
  ToolboxComponent,
  BrushComponent,
  AriaComponent,
  DatasetComponent,
  TransformComponent,
  VisualMapComponent,
  LabelLayout,
  UniversalTransition,
  CanvasRenderer,
  SVGRenderer,
]);

/** The registered ECharts core. Also what `z-chart` renders with on the server. */
export const zardEcharts = echarts;
