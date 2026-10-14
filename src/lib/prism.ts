export const PRISM_AMBER = '#F5A524';
export const PRISM_TEAL = '#2DD4BF';
export const PRISM_LINE = '#2B8CFF';
export const PRISM_HOVER_RADIUS = 72;
export const PRISM_LINE_LOOP_MS = 3200;
export const PRISM_IDLE_SPEED = { x: 0.47, y: 0.73, z: 0.29 } as const;

export type Vec3 = { x: number; y: number; z: number };
export type PrismEdge = { a: number; b: number; internal: boolean };
export type ProjectedPoint = { x: number; y: number; depth: number };

export const PRISM_VERTICES: Vec3[] = [
	{ x: 0, y: 1.08, z: -0.74 },
	{ x: -0.98, y: -0.74, z: -0.74 },
	{ x: 0.98, y: -0.74, z: -0.74 },
	{ x: 0, y: 1.08, z: 0.74 },
	{ x: -0.98, y: -0.74, z: 0.74 },
	{ x: 0.98, y: -0.74, z: 0.74 },
];

export const PRISM_EDGES: PrismEdge[] = [
	{ a: 0, b: 1, internal: false },
	{ a: 1, b: 2, internal: false },
	{ a: 2, b: 0, internal: false },
	{ a: 3, b: 4, internal: false },
	{ a: 4, b: 5, internal: false },
	{ a: 5, b: 3, internal: false },
	{ a: 0, b: 3, internal: false },
	{ a: 1, b: 4, internal: false },
	{ a: 2, b: 5, internal: false },
	{ a: 0, b: 4, internal: true },
	{ a: 0, b: 5, internal: true },
	{ a: 1, b: 3, internal: true },
	{ a: 1, b: 5, internal: true },
	{ a: 2, b: 3, internal: true },
	{ a: 2, b: 4, internal: true },
];

export const PRISM_FACES: number[][] = [
	[0, 1, 2],
	[3, 5, 4],
	[0, 3, 4, 1],
	[1, 4, 5, 2],
	[2, 5, 3, 0],
];

/** Continuous X/Y/Z rotation. Time only — the pointer does not enter this function. */
export function idleRotation(timeMs: number): { x: number; y: number; z: number } {
	const seconds = (Number.isFinite(timeMs) ? timeMs : 0) / 1000;
	return {
		x: seconds * PRISM_IDLE_SPEED.x,
		y: seconds * PRISM_IDLE_SPEED.y,
		z: seconds * PRISM_IDLE_SPEED.z,
	};
}

/** Repeating 0..1 phase for the internal-line loop. */
export function internalLinePhase(timeMs: number): number {
	if (!Number.isFinite(timeMs)) return 0;
	const wrapped = ((timeMs % PRISM_LINE_LOOP_MS) + PRISM_LINE_LOOP_MS) % PRISM_LINE_LOOP_MS;
	return wrapped / PRISM_LINE_LOOP_MS;
}

export function internalDashOffset(phase: number, span = 48): number {
	const p = ((phase % 1) + 1) % 1;
	return -p * span;
}

export function rotateVertex(vertex: Vec3, rot: { x: number; y: number; z: number }): Vec3 {
	let { x, y, z } = vertex;
	const cx = Math.cos(rot.x);
	const sx = Math.sin(rot.x);
	const y1 = y * cx - z * sx;
	const z1 = y * sx + z * cx;
	y = y1;
	z = z1;

	const cy = Math.cos(rot.y);
	const sy = Math.sin(rot.y);
	const x2 = x * cy + z * sy;
	const z2 = -x * sy + z * cy;
	x = x2;
	z = z2;

	const cz = Math.cos(rot.z);
	const sz = Math.sin(rot.z);
	return { x: x * cz - y * sz, y: x * sz + y * cz, z };
}

export function projectVertex(vertex: Vec3, width: number, height: number): ProjectedPoint {
	const distance = 3.5;
	const scale = Math.min(width, height) * 0.33;
	const f = distance / (distance + vertex.z);
	return {
		x: width / 2 + vertex.x * scale * f,
		y: height / 2 - vertex.y * scale * f,
		depth: vertex.z,
	};
}

export function projectPrism(timeMs: number, width: number, height: number): ProjectedPoint[] {
	const rot = idleRotation(timeMs);
	return PRISM_VERTICES.map((vertex) => projectVertex(rotateVertex(vertex, rot), width, height));
}

/** Near lines become amber or teal. Far lines, and lines with no pointer, stay blue. */
export function prismLineColor(
	point: { x: number; y: number },
	cursor: { x: number; y: number } | null,
	index = 0,
	radius = PRISM_HOVER_RADIUS,
): string {
	if (!cursor) return PRISM_LINE;
	const distance = Math.hypot(point.x - cursor.x, point.y - cursor.y);
	if (!(distance <= radius)) return PRISM_LINE;
	return index % 2 === 0 ? PRISM_AMBER : PRISM_TEAL;
}

export function prismLineColors(
	points: { x: number; y: number }[],
	cursor: { x: number; y: number } | null,
	radius = PRISM_HOVER_RADIUS,
): string[] {
	return points.map((point, index) => prismLineColor(point, cursor, index, radius));
}

export function heroPrismFrame(
	timeMs: number,
	linePoints: { x: number; y: number }[],
	cursor: { x: number; y: number } | null,
): { rotation: { x: number; y: number; z: number }; phase: number; colors: string[] } {
	return {
		rotation: idleRotation(timeMs),
		phase: internalLinePhase(timeMs),
		colors: prismLineColors(linePoints, cursor),
	};
}
