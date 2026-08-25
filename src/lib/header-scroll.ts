export const HEADER_SCROLL_THRESHOLD = 16;

export function isHeaderScrolled(
	scrollY: number,
	threshold: number = HEADER_SCROLL_THRESHOLD,
): boolean {
	return scrollY > threshold;
}
