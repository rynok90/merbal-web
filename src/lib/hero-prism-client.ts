import {
	PRISM_EDGES,
	PRISM_FACES,
	heroPrismFrame,
	internalDashOffset,
	projectPrism,
	type ProjectedPoint,
} from './prism.ts';

type PaintCursor = { x: number; y: number } | null;

function faceDepth(indices: number[], points: ProjectedPoint[]): number {
	let sum = 0;
	for (const index of indices) sum += points[index]?.depth ?? 0;
	return sum / Math.max(1, indices.length);
}

export function paintHeroPrism(
	ctx: CanvasRenderingContext2D,
	width: number,
	height: number,
	timeMs: number,
	cursor: PaintCursor,
): void {
	const points = projectPrism(timeMs, width, height);
	const mids = PRISM_EDGES.map((edge) => {
		const a = points[edge.a];
		const b = points[edge.b];
		return { x: ((a?.x ?? 0) + (b?.x ?? 0)) / 2, y: ((a?.y ?? 0) + (b?.y ?? 0)) / 2 };
	});
	const frame = heroPrismFrame(timeMs, mids, cursor);

	ctx.clearRect(0, 0, width, height);
	ctx.fillStyle = '#060d18';
	ctx.fillRect(0, 0, width, height);

	const glow = ctx.createRadialGradient(
		width * 0.5,
		height * 0.46,
		Math.max(12, width * 0.04),
		width * 0.5,
		height * 0.5,
		Math.max(40, width * 0.48),
	);
	glow.addColorStop(0, 'rgba(43, 140, 255, 0.34)');
	glow.addColorStop(0.45, 'rgba(43, 140, 255, 0.08)');
	glow.addColorStop(1, 'rgba(6, 13, 24, 0)');
	ctx.fillStyle = glow;
	ctx.fillRect(0, 0, width, height);

	const faces = PRISM_FACES.map((indices, order) => ({ indices, order, depth: faceDepth(indices, points) }));
	faces.sort((a, b) => a.depth - b.depth || a.order - b.order);

	for (const face of faces) {
		ctx.beginPath();
		face.indices.forEach((index, i) => {
			const point = points[index];
			if (!point) return;
			if (i === 0) ctx.moveTo(point.x, point.y);
			else ctx.lineTo(point.x, point.y);
		});
		ctx.closePath();
		ctx.fillStyle = 'rgba(16, 32, 56, 0.82)';
		ctx.fill();
		ctx.lineWidth = 1;
		ctx.strokeStyle = 'rgba(43, 140, 255, 0.45)';
		ctx.stroke();
	}

	PRISM_EDGES.forEach((edge, index) => {
		const a = points[edge.a];
		const b = points[edge.b];
		if (!a || !b) return;
		const color = frame.colors[index] ?? '#2B8CFF';
		ctx.beginPath();
		ctx.moveTo(a.x, a.y);
		ctx.lineTo(b.x, b.y);
		ctx.lineCap = 'round';
		ctx.lineWidth = edge.internal ? 1.7 : 2.35;
		ctx.strokeStyle = color;
		if (edge.internal) {
			ctx.setLineDash([12, 10]);
			ctx.lineDashOffset = internalDashOffset(frame.phase, 44);
			ctx.globalAlpha = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(frame.phase * Math.PI * 2));
		} else {
			ctx.setLineDash([]);
			ctx.globalAlpha = 1;
		}
		ctx.stroke();
		ctx.setLineDash([]);
		ctx.globalAlpha = 1;

		if (edge.internal) {
			const travel = (frame.phase + index * 0.07) % 1;
			const span = 0.22;
			const t0 = travel;
			const t1 = Math.min(1, travel + span);
			ctx.beginPath();
			ctx.moveTo(a.x + (b.x - a.x) * t0, a.y + (b.y - a.y) * t0);
			ctx.lineTo(a.x + (b.x - a.x) * t1, a.y + (b.y - a.y) * t1);
			ctx.lineWidth = 2.4;
			ctx.strokeStyle = color;
			ctx.stroke();
		}
	});

	for (const point of points) {
		ctx.beginPath();
		ctx.arc(point.x, point.y, 3.2, 0, Math.PI * 2);
		ctx.fillStyle = '#5eb0ff';
		ctx.fill();
	}
}

function canvasBox(canvas: HTMLCanvasElement): { width: number; height: number } {
	const rect = canvas.getBoundingClientRect?.();
	const width = rect?.width || canvas.clientWidth || Number(canvas.width) || 640;
	const height = rect?.height || canvas.clientHeight || Number(canvas.height) || 520;
	return { width, height };
}

export function bootHeroPrism(): void {
	const doc = globalThis.document;
	const win = globalThis.window;
	if (!doc || !win || typeof doc.querySelector !== 'function') return;

	const canvas = doc.querySelector('[data-hero-prism]');
	if (!canvas || typeof (canvas as HTMLCanvasElement).getContext !== 'function') return;
	const surface = canvas as HTMLCanvasElement;
	if (surface.dataset?.prismBooted === 'true') return;

	const ctx = surface.getContext('2d');
	if (!ctx) return;
	if (surface.dataset) surface.dataset.prismBooted = 'true';

	let cursor: PaintCursor = null;
	const stage = surface.parentElement ?? surface;
	stage.addEventListener?.('pointermove', (event) => {
		const rect = surface.getBoundingClientRect();
		cursor = { x: event.clientX - rect.left, y: event.clientY - rect.top };
	});
	stage.addEventListener?.('pointerleave', () => {
		cursor = null;
	});

	const reduce = win.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;

	const paint = (timeMs: number) => {
		const { width, height } = canvasBox(surface);
		if (width < 2 || height < 2) {
			if (!reduce) win.requestAnimationFrame(paint);
			return;
		}
		const dpr = Math.min(win.devicePixelRatio || 1, 2);
		const bitmapW = Math.max(1, Math.floor(width * dpr));
		const bitmapH = Math.max(1, Math.floor(height * dpr));
		if (surface.width !== bitmapW || surface.height !== bitmapH) {
			surface.width = bitmapW;
			surface.height = bitmapH;
		}
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		paintHeroPrism(ctx, width, height, timeMs, cursor);
		if (!reduce) win.requestAnimationFrame(paint);
	};

	if (reduce) paint(0);
	else if (typeof win.requestAnimationFrame === 'function') win.requestAnimationFrame(paint);
	else paint(0);
}

if (typeof document !== 'undefined' && typeof window !== 'undefined') {
	const start = () => bootHeroPrism();
	if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
	else start();
}
