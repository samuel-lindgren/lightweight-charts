import { CanvasRenderingTarget2D } from 'fancy-canvas';
import { Time } from '../../model/horz-scale-behavior-time/types';
import { ISeriesPrimitive, SeriesAttachedParameter } from '../../api/iseries-primitive-api';
import { IPrimitivePaneView, IPrimitivePaneRenderer } from '../../model/ipane-primitive';
import { PaneRendererRectangle, RectangleItem } from '../../renderers/rectangle-renderer';
import { Coordinate } from '../../model/coordinate';
import { LineStyle } from '../../renderers/draw-line';
import { ISeriesApi } from '../../api/iseries-api';
import { ITimeScaleApi } from '../../api/itime-scale-api';
import { SeriesType } from '../../model/series-options';

export interface FVGRectangleData<T = Time> {
	id: string;
	startTime: T;
	endTime: T;
	upperPrice: number;
	lowerPrice: number;
	fillColor?: string;
	borderColor?: string;
}

export interface FVGRectanglePrimitiveOptions {
	fillColor: string;
	borderColor: string;
	borderWidth: number;
	borderVisible: boolean;
}

class FVGRectangleRenderer implements IPrimitivePaneRenderer {
	private _rectangleRenderer: PaneRendererRectangle = new PaneRendererRectangle();

	setData(data: { items: RectangleItem[] }): void {
		this._rectangleRenderer.setData(data);
	}

	draw(target: CanvasRenderingTarget2D, isHovered: boolean = false, hitTestData?: unknown): void {
		this._rectangleRenderer.draw(target, isHovered, hitTestData);
	}

	hitTest(x: Coordinate, y: Coordinate) {
		return this._rectangleRenderer.hitTest(x, y);
	}
}

class FVGRectanglePaneView<T = Time> implements IPrimitivePaneView {
	private _options: FVGRectanglePrimitiveOptions;
	private _renderer: FVGRectangleRenderer = new FVGRectangleRenderer();
	private _series: ISeriesApi<SeriesType, T> | null = null;
	private _timeScale: ITimeScaleApi<T> | null = null;
	private _rectangleData: FVGRectangleData<T>[] = [];

	constructor(options: FVGRectanglePrimitiveOptions) {
		this._options = options;
	}

	renderer(): IPrimitivePaneRenderer | null {
		// Re-calculate coordinates on every render call for maximum fluidity
		this._prepareRendererData(this._rectangleData);
		return this._renderer;
	}

	setSeriesAndTimeScale(series: ISeriesApi<SeriesType, T>, timeScale: ITimeScaleApi<T>): void {
		this._series = series;
		this._timeScale = timeScale;
	}

	setRectangles(rectangles: FVGRectangleData<T>[]): void {
		this._rectangleData = rectangles;
		// Don't prepare renderer data here - it will be done on each render call
	}

	setOptions(options: Partial<FVGRectanglePrimitiveOptions>): void {
		this._options = { ...this._options, ...options };
	}

	private _prepareRendererData(rectangles: FVGRectangleData<T>[]): void {
		if (!this._series || !this._timeScale) {
			this._renderer.setData({ items: [] });
			return;
		}

		const items: RectangleItem[] = rectangles.map((rect) => {
			// Convert time coordinates with viewport clamping so partially visible rects render
			let x1 = this._timeScale!.timeToCoordinate(rect.startTime);
			let x2 = this._timeScale!.timeToCoordinate(rect.endTime);
			const vr = this._timeScale!.getVisibleRange();
			if (vr) {
				const from = vr.from as unknown as number;
				const to = vr.to as unknown as number;
				const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
				// If start is left of view and end is visible, clamp start to left edge
				if (x1 === null && x2 !== null && isNum((rect.startTime as unknown)) && isNum(from) && (rect.startTime as unknown as number) < from) {
					x1 = 0 as unknown as Coordinate;
				}
				// If end is right of view and start is visible, clamp end to right edge
				if (x2 === null && x1 !== null && isNum((rect.endTime as unknown)) && isNum(to) && (rect.endTime as unknown as number) > to) {
					x2 = this._timeScale!.width() as unknown as Coordinate;
				}
			}
			
			// Convert price coordinates
			const y1 = this._series!.priceToCoordinate(rect.upperPrice);
			const y2 = this._series!.priceToCoordinate(rect.lowerPrice);

			// Skip if any coordinate conversion failed
			if (x1 === null || x2 === null || y1 === null || y2 === null) {
				return null;
			}

			return {
				x1: x1 as Coordinate,
				y1: y1 as Coordinate,
				x2: x2 as Coordinate,
				y2: y2 as Coordinate,
				fillColor: rect.fillColor || this._options.fillColor,
				borderColor: rect.borderColor || this._options.borderColor,
				borderWidth: this._options.borderWidth as any,
				borderStyle: LineStyle.Solid,
				borderVisible: this._options.borderVisible,
				visible: true,
				externalId: rect.id,
			};
		}).filter((item): item is NonNullable<typeof item> => item !== null) as RectangleItem[];

		this._renderer.setData({ items });
	}
}

export class FVGRectanglePrimitive<T = Time> implements ISeriesPrimitive<T> {
	public requestUpdate?: () => void;
	private _paneView: FVGRectanglePaneView<T>;
	private _rectangles: FVGRectangleData<T>[] = [];
	private _timeScale: ITimeScaleApi<T> | null = null;

	constructor(options: FVGRectanglePrimitiveOptions) {
		this._paneView = new FVGRectanglePaneView<T>(options);
	}

	paneViews(): readonly IPrimitivePaneView[] {
		return [this._paneView];
	}

	updateAllViews(): void {
		// This is called automatically by the chart when the viewport changes
		// Re-prepare renderer data to ensure coordinates are up-to-date
		this._paneView.setRectangles(this._rectangles);
	}

	attached({ series, chart, requestUpdate }: SeriesAttachedParameter<T>): void {
		this.requestUpdate = requestUpdate;
		this._timeScale = chart.timeScale();
		this._paneView.setSeriesAndTimeScale(series, this._timeScale);
		// Re-apply rectangles with proper coordinate access
		this._paneView.setRectangles(this._rectangles);
	}

	detached(): void {
		this.requestUpdate = undefined;
		this._timeScale = null;
	}

	setRectangles(rectangles: FVGRectangleData<T>[]): void {
		this._rectangles = rectangles;
		this._paneView.setRectangles(rectangles);
		if (this.requestUpdate) {
			this.requestUpdate();
		}
	}

	addRectangle(rectangle: FVGRectangleData<T>): void {
		this._rectangles.push(rectangle);
		this._paneView.setRectangles(this._rectangles);
		if (this.requestUpdate) {
			this.requestUpdate();
		}
	}

	removeRectangle(id: string): void {
		this._rectangles = this._rectangles.filter(rect => rect.id !== id);
		this._paneView.setRectangles(this._rectangles);
		if (this.requestUpdate) {
			this.requestUpdate();
		}
	}

	updateTime(time: T): void {
		// This method is called by the chart to update the current time
		// We can use this to update rectangle end times for ongoing FVGs
		// For now, trigger a re-render to ensure coordinates are up to date
		this._paneView.setRectangles(this._rectangles);
		if (this.requestUpdate) {
			this.requestUpdate();
		}
	}

	updateOptions(options: Partial<FVGRectanglePrimitiveOptions>): void {
		this._paneView.setOptions(options);
		if (this.requestUpdate) {
			this.requestUpdate();
		}
	}
}
