export const METHOD_STEP_COUNT = 4;

export function methodLineScale(progress: number): number {
	if (Number.isNaN(progress)) return 0;
	return Math.min(1, Math.max(0, progress));
}

export function isMethodStepActive(
	progress: number,
	index: number,
	lastIndex: number = METHOD_STEP_COUNT - 1,
): boolean {
	const t = methodLineScale(progress);
	if (lastIndex <= 0) return t > 0;
	return t + 1e-6 >= index / lastIndex;
}

export function isMethodStepCurrent(
	progress: number,
	index: number,
	lastIndex: number = METHOD_STEP_COUNT - 1,
): boolean {
	if (!isMethodStepActive(progress, index, lastIndex)) return false;
	if (index >= lastIndex) return true;
	return !isMethodStepActive(progress, index + 1, lastIndex);
}

export function methodStrokeOffset(progress: number, length: number): number {
	const len = Math.max(0, length);
	return (1 - methodLineScale(progress)) * len;
}

export function methodHeadPoint(
	progress: number,
	x1: number,
	y1: number,
	x2: number,
	y2: number,
): { x: number; y: number } {
	const t = methodLineScale(progress);
	return {
		x: x1 + (x2 - x1) * t,
		y: y1 + (y2 - y1) * t,
	};
}

export function applyMethodProgress(
	steps: Array<{ classList: { toggle: (token: string, force: boolean) => void } }>,
	progress: number,
): void {
	const lastIndex = Math.max(0, steps.length - 1);
	steps.forEach((step, index) => {
		step.classList.toggle('is-active', isMethodStepActive(progress, index, lastIndex));
		step.classList.toggle('is-current', isMethodStepCurrent(progress, index, lastIndex));
	});
}
