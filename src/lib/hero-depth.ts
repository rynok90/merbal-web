export const HERO_LERP = 0.1;
export const HERO_TILT_X = 3.2;
export const HERO_TILT_Y = 5.4;
export const HERO_SCROLL_FACTOR = 0.06;
export const HERO_SCROLL_MAX = 28;
export const HERO_FOLLOW_LAG = 0.08;
export const HERO_FOLLOW_RANGE = 22;
export const HERO_MOBILE_QUERY = '(max-width: 767px)';

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

export function lerp(current: number, target: number, amount: number): number {
	const t = Number.isFinite(amount) ? amount : 0;
	return current + (target - current) * t;
}

export function heroPointerNorm(
	clientX: number,
	clientY: number,
	rect: { left: number; width: number; top: number; height: number },
): { nx: number; ny: number } {
	const width = rect.width || 1;
	const height = rect.height || 1;
	return {
		nx: clamp(((clientX - rect.left) / width) * 2 - 1, -1, 1),
		ny: clamp(((clientY - rect.top) / height) * 2 - 1, -1, 1),
	};
}

/** Extra rotateX / rotateY in degrees on top of the CSS perspective grid. */
export function heroTiltFromPointer(nx: number, ny: number): { rx: number; ry: number } {
	const x = clamp(nx, -1, 1);
	const y = clamp(ny, -1, 1);
	return {
		rx: y * HERO_TILT_X,
		ry: x * HERO_TILT_Y,
	};
}

export function heroScrollOffset(scrollY: number): number {
	if (!Number.isFinite(scrollY) || scrollY <= 0) return 0;
	return Math.min(HERO_SCROLL_MAX, scrollY * HERO_SCROLL_FACTOR);
}

export function delayedFollow(
	currentX: number,
	currentY: number,
	targetX: number,
	targetY: number,
	amount: number = HERO_FOLLOW_LAG,
): { x: number; y: number } {
	return {
		x: lerp(currentX, targetX, amount),
		y: lerp(currentY, targetY, amount),
	};
}

export function shouldSkipHeroDepth(input: { reducedMotion: boolean; isMobile: boolean }): boolean {
	return Boolean(input.reducedMotion || input.isMobile);
}
