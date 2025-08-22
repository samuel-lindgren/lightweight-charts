import { BitmapCoordinatesRenderingScope } from 'fancy-canvas';

import { HoveredObject } from '../model/chart-model';
import { Coordinate } from '../model/coordinate';

import { BitmapCoordinatesPaneRenderer } from './bitmap-coordinates-pane-renderer';
import { LineStyle, LineWidth, setLineStyle } from './draw-line';

export interface RectangleItem {
	x1: Coordinate;
	y1: Coordinate;
	x2: Coordinate;
	y2: Coordinate;
	fillColor: string;
	borderColor: string;
	borderWidth: LineWidth;
	borderStyle: LineStyle;
	borderVisible: boolean;
	visible?: boolean;
	externalId?: string;
}

export interface RectangleRendererData {
	items: readonly RectangleItem[];
}

export class PaneRendererRectangle extends BitmapCoordinatesPaneRenderer {
	private _data: RectangleRendererData | null = null;

	public setData(data: RectangleRendererData): void {
		this._data = data;
	}

	public hitTest(x: Coordinate, y: Coordinate): HoveredObject | null {
		if (!this._data) {
			return null;
		}

		for (const item of this._data.items) {
			if (item.visible === false) {
				continue;
			}

			const left = Math.min(item.x1, item.x2);
			const right = Math.max(item.x1, item.x2);
			const top = Math.min(item.y1, item.y2);
			const bottom = Math.max(item.y1, item.y2);

			if (x >= left && x <= right && y >= top && y <= bottom) {
				return {
					hitTestData: item,
					externalId: item.externalId,
				};
			}
		}

		return null;
	}

	protected _drawImpl({ context: ctx, bitmapSize, horizontalPixelRatio, verticalPixelRatio }: BitmapCoordinatesRenderingScope): void {
		if (this._data === null) {
			return;
		}

		for (const item of this._data.items) {
			if (item.visible === false) {
				continue;
			}

			const x1 = Math.round(item.x1 * horizontalPixelRatio);
			const y1 = Math.round(item.y1 * verticalPixelRatio);
			const x2 = Math.round(item.x2 * horizontalPixelRatio);
			const y2 = Math.round(item.y2 * verticalPixelRatio);

			const left = Math.min(x1, x2);
			const top = Math.min(y1, y2);
			const width = Math.abs(x2 - x1);
			const height = Math.abs(y2 - y1);

			// Skip if rectangle is outside the visible area
			if (left + width < 0 || left > bitmapSize.width || top + height < 0 || top > bitmapSize.height) {
				continue;
			}

			// Fill the rectangle
			if (item.fillColor) {
				ctx.fillStyle = item.fillColor;
				ctx.fillRect(left, top, width, height);
			}

			// Draw the border
			if (item.borderVisible && item.borderWidth > 0) {
				ctx.strokeStyle = item.borderColor;
				ctx.lineWidth = Math.floor(item.borderWidth * horizontalPixelRatio);
				setLineStyle(ctx, item.borderStyle);
				ctx.strokeRect(left, top, width, height);
			}
		}
	}
}