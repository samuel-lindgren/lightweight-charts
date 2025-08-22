import { LineStyle } from '../../renderers/draw-line';
import { IUpdatablePaneView } from '../../views/pane/iupdatable-pane-view';

import { IChartModelBase } from '../chart-model';
import { ISeries } from '../iseries';
import { RectangleStyleOptions } from '../series-options';
import { SeriesDefinition, SeriesDefinitionInternal } from './series-def';

export const rectangleStyleDefaults: RectangleStyleOptions = {
	fillColor: 'rgba(38, 166, 154, 0.2)',
	borderColor: 'rgba(38, 166, 154, 1)',
	borderWidth: 1,
	borderStyle: LineStyle.Solid,
	borderVisible: true,
};

const createPaneView = (series: ISeries<'Rectangle'>, model: IChartModelBase): IUpdatablePaneView => {
	// Rectangle series would need a custom pane view implementation
	// For now, return a placeholder that does nothing
	return {
		update: () => {},
		renderer: () => null,
	};
};

export const createSeries = (): SeriesDefinition<'Rectangle'> => {
	const definition: SeriesDefinitionInternal<'Rectangle'> = {
		type: 'Rectangle',
		isBuiltIn: true as const,
		defaultOptions: rectangleStyleDefaults,
		/**
		 * @internal
		 */
		createPaneView: createPaneView,
	};
	return definition as SeriesDefinition<'Rectangle'>;
};

export const rectangleSeries: SeriesDefinition<'Rectangle'> = createSeries();