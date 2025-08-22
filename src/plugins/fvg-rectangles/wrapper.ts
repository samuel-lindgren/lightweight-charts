import { ISeriesApi } from '../../api/iseries-api';
import { SeriesType } from '../../model/series-options';
import { ISeriesPrimitiveWrapper, SeriesPrimitiveAdapter } from '../series-primitive-adapter';
import { FVGRectanglePrimitive, FVGRectangleData, FVGRectanglePrimitiveOptions } from './fvg-rectangle-primitive';

export { type FVGRectangleData, FVGRectanglePrimitiveOptions };

/**
 * Interface for the FVG Rectangles Plugin API.
 */
export interface IFVGRectangles extends ISeriesPrimitiveWrapper<any> {
	/**
	 * Sets rectangles to be displayed on the chart.
	 * @param rectangles - Array of FVG rectangle data.
	 */
	setRectangles(rectangles: FVGRectangleData<any>[]): void;
	
	/**
	 * Adds a single rectangle to the chart.
	 * @param rectangle - FVG rectangle data to add.
	 */
	addRectangle(rectangle: FVGRectangleData<any>): void;
	
	/**
	 * Removes a rectangle from the chart by its ID.
	 * @param id - ID of the rectangle to remove.
	 */
	removeRectangle(id: string): void;
	
	/**
	 * Updates the options for the FVG rectangles.
	 * @param options - Partial options to apply.
	 */
	updateOptions(options: Partial<FVGRectanglePrimitiveOptions>): void;
}

class FVGRectanglePrimitiveWrapper<HorzScaleItem>
	extends SeriesPrimitiveAdapter<
		HorzScaleItem,
		FVGRectanglePrimitiveOptions,
		FVGRectanglePrimitive<HorzScaleItem>
	>
	implements IFVGRectangles {

	public setRectangles(rectangles: FVGRectangleData<any>[]): void {
		return this._primitive.setRectangles(rectangles);
	}

	public addRectangle(rectangle: FVGRectangleData<any>): void {
		return this._primitive.addRectangle(rectangle);
	}

	public removeRectangle(id: string): void {
		return this._primitive.removeRectangle(id);
	}

	public updateOptions(options: Partial<FVGRectanglePrimitiveOptions>): void {
		return this._primitive.updateOptions(options);
	}
}

/**
 * Creates and attaches the FVG Rectangles Plugin to a series.
 *
 * @param series - Series to which to attach the FVG Rectangles Plugin
 * @param options - Options for the FVG Rectangles Plugin
 *
 * @returns API for the FVG Rectangles Plugin
 *
 * @example
 * ```js
 * import { createFVGRectangles, createChart, CandlestickSeries } from 'lightweight-charts';
 *
 * const chart = createChart('container');
 * const candlestickSeries = chart.addSeries(CandlestickSeries);
 * const fvgRectangles = createFVGRectangles(candlestickSeries, {
 *     fillColor: 'rgba(38, 166, 154, 0.2)',
 *     borderColor: 'rgba(38, 166, 154, 1)',
 *     borderWidth: 1,
 *     borderVisible: true,
 * });
 * 
 * // Add some FVG rectangles
 * fvgRectangles.setRectangles([
 *     {
 *         id: 'fvg1',
 *         startTime: { day: 1, month: 1, year: 2023 },
 *         endTime: { day: 2, month: 1, year: 2023 },
 *         upperPrice: 100,
 *         lowerPrice: 95,
 *     }
 * ]);
 * 
 * // To remove the plugin from the series
 * fvgRectangles.detach();
 * ```
 */
export function createFVGRectangles<T>(
	series: ISeriesApi<SeriesType, T>,
	options: Partial<FVGRectanglePrimitiveOptions> = {}
): IFVGRectangles {
	const wrapper = new FVGRectanglePrimitiveWrapper<T>(
		series,
		new FVGRectanglePrimitive<T>({
			fillColor: 'rgba(38, 166, 154, 0.2)',
			borderColor: 'rgba(38, 166, 154, 1)',
			borderWidth: 1,
			borderVisible: true,
			...options,
		})
	);
	return wrapper;
}