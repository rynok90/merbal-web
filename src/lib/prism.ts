export const PRISM_AMBER = '#F5A524';
export const PRISM_TEAL = '#2DD4BF';
export const PRISM_LINE = '#2B8CFF';
export const PRISM_BLUE = '#2B8CFF';
export const PRISM_BLUE_SOFT = '#3B82F6';
export const PRISM_NODE_TEAL = '#14B8A6';
export const PRISM_HOVER_RADIUS = 72;
export const PRISM_LINE_LOOP_MS = 3200;
export const PRISM_IDLE_SPEED = { x: 0.47, y: 0.73, z: 0.29 } as const;
export const PRISM_DESKTOP_NODE_COUNT = 32;
export const PRISM_MOBILE_NODE_COUNT = 16;
export const PRISM_MOBILE_MAX_WIDTH = 768;
export const PRISM_FLOAT_AMPLITUDE = 0.08;
export const PRISM_FLOAT_SPEED = 0.9;
export const PRISM_PULSE_CYCLE_MS = 4800;
export const PRISM_PULSE_WINDOW = 0.22;
export const PRISM_NODE_COLORS = [PRISM_BLUE, PRISM_BLUE_SOFT, PRISM_NODE_TEAL] as const;
/** Glass cube edge length. Node positions are in this same space. */
export const PRISM_CUBE_SIZE = 1.72;
export const PRISM_CUBE_HALF = PRISM_CUBE_SIZE / 2;
/** Positive gap between every node and the nearest cube face. */
export const PRISM_NODE_INSET = 0.34;

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

export type PrismNode = Vec3 & { color: string };
export type PrismLink = { a: number; b: number };

function unitHash(index: number, salt: number): number {
	const raw = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
	return raw - Math.floor(raw);
}

/** Desktop stays in the 25–40 band. Narrow viewports use fewer nodes. */
export function prismNodeCount(viewportWidth: number): number {
	const width = Number.isFinite(viewportWidth) ? viewportWidth : 0;
	return width < PRISM_MOBILE_MAX_WIDTH ? PRISM_MOBILE_NODE_COUNT : PRISM_DESKTOP_NODE_COUNT;
}

/** Half-extent the network may occupy: the cube interior, inset from every face. */
export function prismNodeReach(): number {
	return PRISM_CUBE_HALF - PRISM_NODE_INSET;
}

/** Deterministic nodes floating inside the glass volume, not on the faces. */
export function prismNodes(viewportWidth: number): PrismNode[] {
	const count = prismNodeCount(viewportWidth);
	const reach = prismNodeReach();
	const nodes: PrismNode[] = [];
	for (let index = 0; index < count; index += 1) {
		nodes.push({
			x: (unitHash(index, 1) - 0.5) * 2 * reach,
			y: (unitHash(index, 2) - 0.5) * 2 * reach,
			z: (unitHash(index, 3) - 0.5) * 2 * reach,
			color: PRISM_NODE_COLORS[index % PRISM_NODE_COLORS.length] ?? PRISM_BLUE,
		});
	}
	return nodes;
}

function nodeDistance(a: Vec3, b: Vec3): number {
	return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

/** Each node joins its two nearest neighbours. The client draws these as thin lines. */
export function prismLinks(nodes: readonly PrismNode[]): PrismLink[] {
	const links: PrismLink[] = [];
	const seen = new Set<string>();
	for (let index = 0; index < nodes.length; index += 1) {
		const nearest = nodes
			.map((node, other) => ({
				other,
				distance: other === index ? Number.POSITIVE_INFINITY : nodeDistance(nodes[index]!, node),
			}))
			.sort((left, right) => left.distance - right.distance)
			.slice(0, 2);
		for (const pick of nearest) {
			if (!Number.isFinite(pick.distance)) continue;
			const key = index < pick.other ? `${index}-${pick.other}` : `${pick.other}-${index}`;
			if (seen.has(key)) continue;
			seen.add(key);
			links.push({ a: Math.min(index, pick.other), b: Math.max(index, pick.other) });
		}
	}
	return links;
}

export function prismLinkColor(index: number): string {
	return index % 2 === 0 ? PRISM_BLUE : PRISM_NODE_TEAL;
}

/** Slight vertical bob. Time only. */
export function prismFloat(timeMs: number): number {
	if (!Number.isFinite(timeMs)) return 0;
	return Math.sin((timeMs / 1000) * PRISM_FLOAT_SPEED) * PRISM_FLOAT_AMPLITUDE;
}

/**
 * 0..1 while a pulse is traveling a link, or -1 during the quiet part of the cycle.
 * Pulses are occasional: they occupy only PRISM_PULSE_WINDOW of each cycle.
 */
export function prismPulsePhase(timeMs: number): number {
	if (!Number.isFinite(timeMs)) return -1;
	const wrapped = ((timeMs % PRISM_PULSE_CYCLE_MS) + PRISM_PULSE_CYCLE_MS) % PRISM_PULSE_CYCLE_MS;
	const progress = wrapped / PRISM_PULSE_CYCLE_MS;
	if (progress > PRISM_PULSE_WINDOW) return -1;
	return progress / PRISM_PULSE_WINDOW;
}

export function prismPulseLinkIndex(timeMs: number, linkCount: number): number {
	if (!Number.isFinite(timeMs) || linkCount < 1) return 0;
	const cycle = Math.floor(timeMs / PRISM_PULSE_CYCLE_MS);
	return ((cycle % linkCount) + linkCount) % linkCount;
}

/** Continuous motion runs only when the user allows motion and the prism is on screen. */
export function prismMotionAllowed(reducedMotion: boolean, onScreen: boolean): boolean {
	return reducedMotion !== true && onScreen === true;
}

/** The nearest node or line turns amber. Far marks keep their blue or teal. */
export function prismHoverColor(
	point: { x: number; y: number },
	baseColor: string,
	cursor: { x: number; y: number } | null,
	radius = PRISM_HOVER_RADIUS,
): string {
	if (!cursor || !Number.isFinite(point.x) || !Number.isFinite(point.y)) return baseColor;
	const distance = Math.hypot(point.x - cursor.x, point.y - cursor.y);
	return distance <= radius ? PRISM_AMBER : baseColor;
}
