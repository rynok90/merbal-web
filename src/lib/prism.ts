export const PRISM_AMBER = '#F5A524';
export const PRISM_TEAL = '#2DD4BF';
export const PRISM_LINE = '#2B8CFF';
export const PRISM_BLUE = '#2B8CFF';
export const PRISM_BLUE_SOFT = '#3B82F6';
export const PRISM_NODE_TEAL = '#14B8A6';
export const PRISM_HOVER_RADIUS = 72;
export const PRISM_LINE_LOOP_MS = 3200;
export const PRISM_IDLE_SPEED = { x: 0.47, y: 0.73, z: 0.29 } as const;
export const PRISM_DESKTOP_NODE_COUNT = 120;
export const PRISM_MOBILE_NODE_COUNT = 96;
export const PRISM_MOBILE_MAX_WIDTH = 768;
/** Bright point at each neuron. Small next to the spacing between nodes. */
export const PRISM_NODE_CORE_RADIUS = 0.014;
/** Soft halo. Larger than the core, still a glow rather than a solid sphere. */
export const PRISM_NODE_GLOW_RADIUS = 0.058;
export const PRISM_NODE_GLOW_OPACITY = 0.18;
/** Hairline axon, plus a wider faint halo so the weave reads inside the glass. */
export const PRISM_LINK_RADIUS = 0.0032;
export const PRISM_LINK_GLOW_RADIUS = 0.012;
export const PRISM_LINK_GLOW_OPACITY = 0.22;
export const PRISM_FLOAT_AMPLITUDE = 0.08;
export const PRISM_FLOAT_SPEED = 0.9;
export const PRISM_PULSE_CYCLE_MS = 4800;
export const PRISM_PULSE_WINDOW = 0.22;
export const PRISM_NODE_COLORS = [PRISM_BLUE, PRISM_BLUE_SOFT, PRISM_NODE_TEAL] as const;
/** Glass cube edge length. Node positions are in this same space. */
export const PRISM_CUBE_SIZE = 1.72;
export const PRISM_CUBE_HALF = PRISM_CUBE_SIZE / 2;
/** Darker cube inside the clear outer glass. Strictly smaller than the outer cube. */
export const PRISM_INNER_SCALE = 0.74;
/** Positive gap between every node and the inner volume's faces. */
export const PRISM_INNER_MARGIN = 0.035;
/** Positive gap between every node center and the nearest outer cube face. */
export const PRISM_NODE_INSET =
	PRISM_CUBE_HALF - (PRISM_CUBE_HALF * PRISM_INNER_SCALE - PRISM_INNER_MARGIN);
/** Round white-blue bar along each edge. Diameter is tuned to about 3–4 px on the desktop stage. */
export const PRISM_CANTO_DIAMETER = 0.034;
export const PRISM_CANTO_RADIUS = PRISM_CANTO_DIAMETER / 2;
/** Minimum share of the canvas kept clear around every outer corner. */
export const PRISM_CANVAS_MARGIN = 0.1;
/** Stage sizes the hero actually paints: desktop column and a 375px phone. */
export const PRISM_DESKTOP_CANVAS = { width: 498, height: 448 } as const;
export const PRISM_NARROW_CANVAS = { width: 335, height: 256 } as const;
export const PRISM_CAMERA_FOV = 30;
export const PRISM_CAMERA = { x: 1.02, y: 0.86, z: 7.85 } as const;

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

/** Low-discrepancy coordinate in [0, 1). Fills the volume instead of clumping on a plane. */
function halton(index: number, base: number): number {
	let result = 0;
	let fraction = 1 / base;
	let cursor = index + 1;
	while (cursor > 0) {
		result += fraction * (cursor % base);
		cursor = Math.floor(cursor / base);
		fraction /= base;
	}
	return result;
}

/** Both wide and narrow viewports stay inside the dense 80–150 band. */
export function prismNodeCount(viewportWidth: number): number {
	const width = Number.isFinite(viewportWidth) ? viewportWidth : 0;
	return width < PRISM_MOBILE_MAX_WIDTH ? PRISM_MOBILE_NODE_COUNT : PRISM_DESKTOP_NODE_COUNT;
}

/** Half-extent of the darker inner volume. */
export function prismInnerHalf(): number {
	return PRISM_CUBE_HALF * PRISM_INNER_SCALE;
}

/** Half-extent of the outer glass plus the round canto, so the thick edge stays inside the frame. */
export function prismOuterHalf(): number {
	return PRISM_CUBE_HALF + PRISM_CANTO_RADIUS;
}

/** Half-extent the network may occupy: inside the inner volume, not on its faces. */
export function prismNodeReach(): number {
	return prismInnerHalf() - PRISM_INNER_MARGIN;
}

/**
 * World height of the floor discs. Below every outer corner across the idle turn,
 * so the shadow stays under the cube instead of cutting a face.
 */
export const PRISM_FLOOR_Y = -1.6;
/** Soft contact shadow. Small enough that its rim keeps the 10% canvas margin. */
export const PRISM_SHADOW_RADIUS = 0.32;
/** Faint floor sheen, a little wider than the shadow, still inside that margin. */
export const PRISM_REFLECTION_RADIUS = 0.38;

/**
 * Cube tumble plus a yaw-only floor pose. Shadow and reflection stay flat:
 * their X and Z are 0 while the cube's X and Z change, and they share one Y.
 */
export function prismCastPose(timeMs: number): {
	rotation: { x: number; y: number; z: number };
	shadow: { x: number; y: number; z: number };
	reflection: { x: number; y: number; z: number };
	floorY: number;
} {
	const rotation = idleRotation(timeMs);
	const floor = { x: 0, y: rotation.y, z: 0 };
	return { rotation, shadow: floor, reflection: floor, floorY: PRISM_FLOOR_Y };
}

function cameraBasis() {
	const eye = PRISM_CAMERA;
	const zx = eye.x;
	const zy = eye.y;
	const zz = eye.z;
	const zLen = Math.hypot(zx, zy, zz) || 1;
	const zAxis = { x: zx / zLen, y: zy / zLen, z: zz / zLen };
	const up = { x: 0, y: 1, z: 0 };
	let xx = up.y * zAxis.z - up.z * zAxis.y;
	let xy = up.z * zAxis.x - up.x * zAxis.z;
	let xz = up.x * zAxis.y - up.y * zAxis.x;
	const xLen = Math.hypot(xx, xy, xz) || 1;
	xx /= xLen;
	xy /= xLen;
	xz /= xLen;
	const yx = zAxis.y * xz - zAxis.z * xy;
	const yy = zAxis.z * xx - zAxis.x * xz;
	const yz = zAxis.x * xy - zAxis.y * xx;
	return { eye, xAxis: { x: xx, y: xy, z: xz }, yAxis: { x: yx, y: yy, z: yz }, zAxis };
}

/** Project a world point with the same camera the hero cube uses. */
export function prismProject(
	point: Vec3,
	canvasWidth: number,
	canvasHeight: number,
): { x: number; y: number; depth: number } {
	const { eye, xAxis, yAxis, zAxis } = cameraBasis();
	const dx = point.x - eye.x;
	const dy = point.y - eye.y;
	const dz = point.z - eye.z;
	const cx = dx * xAxis.x + dy * xAxis.y + dz * xAxis.z;
	const cy = dx * yAxis.x + dy * yAxis.y + dz * yAxis.z;
	const cz = dx * zAxis.x + dy * zAxis.y + dz * zAxis.z;
	const aspect = canvasWidth / Math.max(1, canvasHeight);
	const fy = 1 / Math.tan((PRISM_CAMERA_FOV * Math.PI) / 360);
	const fx = fy / aspect;
	const depth = -cz;
	const ndcX = (cx * fx) / Math.max(1e-6, depth);
	const ndcY = (cy * fy) / Math.max(1e-6, depth);
	return {
		x: (ndcX + 1) * 0.5 * canvasWidth,
		y: (1 - ndcY) * 0.5 * canvasHeight,
		depth,
	};
}

/** Eight outer corners, including canto thickness, after the idle turn and the vertical float. */
export function prismProjectedCorners(
	canvasWidth: number,
	canvasHeight: number,
	timeMs: number,
): { x: number; y: number; depth: number }[] {
	const rotation = idleRotation(timeMs);
	const floatY = prismFloat(timeMs);
	const half = prismOuterHalf();
	const points: { x: number; y: number; depth: number }[] = [];
	for (const sx of [-1, 1]) {
		for (const sy of [-1, 1]) {
			for (const sz of [-1, 1]) {
				const turned = rotateVertex({ x: sx * half, y: sy * half, z: sz * half }, rotation);
				turned.y += floatY;
				points.push(prismProject(turned, canvasWidth, canvasHeight));
			}
		}
	}
	return points;
}

/** True when every outer corner keeps the canvas margin at this instant. */
export function prismCornersInside(
	canvasWidth: number,
	canvasHeight: number,
	timeMs: number,
	margin = PRISM_CANVAS_MARGIN,
): boolean {
	const minX = canvasWidth * margin;
	const maxX = canvasWidth * (1 - margin);
	const minY = canvasHeight * margin;
	const maxY = canvasHeight * (1 - margin);
	return prismProjectedCorners(canvasWidth, canvasHeight, timeMs).every(
		(point) => point.depth > 0 && point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY,
	);
}

/** Screen thickness of one canto on a canvas of the given size. */
export function prismCantoPixels(canvasWidth: number, canvasHeight: number): number {
	const distance = Math.hypot(PRISM_CAMERA.x, PRISM_CAMERA.y, PRISM_CAMERA.z);
	const visibleHeight = 2 * Math.tan((PRISM_CAMERA_FOV * Math.PI) / 360) * distance;
	return (PRISM_CANTO_DIAMETER / visibleHeight) * canvasHeight;
}

export type PrismCantoEdge = { center: Vec3; axis: 'x' | 'y' | 'z' };

/** Twelve edges of the outer cube. The client draws these as thick beveled bars. */
export function prismCantoEdges(): PrismCantoEdge[] {
	const half = PRISM_CUBE_HALF;
	const edges: PrismCantoEdge[] = [];
	const axes = ['x', 'y', 'z'] as const;
	for (const axis of axes) {
		const others = axes.filter((item) => item !== axis);
		for (const first of [-1, 1]) {
			for (const second of [-1, 1]) {
				const center: Vec3 = { x: 0, y: 0, z: 0 };
				center[others[0]!] = first * half;
				center[others[1]!] = second * half;
				edges.push({ center, axis });
			}
		}
	}
	return edges;
}

/** Eight corners where the bars meet. Small spheres bevel those joints. */
export function prismCantoCorners(): Vec3[] {
	const half = PRISM_CUBE_HALF;
	const corners: Vec3[] = [];
	for (const x of [-half, half]) {
		for (const y of [-half, half]) {
			for (const z of [-half, half]) corners.push({ x, y, z });
		}
	}
	return corners;
}

/** Deterministic nodes floating inside the glass volume, not on the faces. */
export function prismNodes(viewportWidth: number): PrismNode[] {
	const count = prismNodeCount(viewportWidth);
	const reach = prismNodeReach();
	const nodes: PrismNode[] = [];
	for (let index = 0; index < count; index += 1) {
		const x = Math.min(reach, Math.max(-reach, (halton(index, 2) - 0.5) * 2 * reach));
		const y = Math.min(reach, Math.max(-reach, (halton(index, 3) - 0.5) * 2 * reach));
		const z = Math.min(reach, Math.max(-reach, (halton(index, 5) - 0.5) * 2 * reach));
		nodes.push({
			x,
			y,
			z,
			color: PRISM_NODE_COLORS[index % PRISM_NODE_COLORS.length] ?? PRISM_BLUE,
		});
	}
	return nodes;
}

function nodeDistance(a: Vec3, b: Vec3): number {
	return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

/**
 * Woven axons: a short local link plus a longer bridge, not the two-nearest graph.
 * The client draws these as thin glowing lines.
 */
export function prismLinks(nodes: readonly PrismNode[]): PrismLink[] {
	const count = nodes.length;
	if (count < 2) return [];
	const ranked = nodes.map((node, index) =>
		nodes
			.map((other, otherIndex) => ({
				otherIndex,
				distance: otherIndex === index ? Number.POSITIVE_INFINITY : nodeDistance(node, other),
			}))
			.sort((left, right) => left.distance - right.distance)
			.map((entry) => entry.otherIndex),
	);

	const links: PrismLink[] = [];
	const seen = new Set<string>();
	const add = (left: number, right: number) => {
		if (left === right || left < 0 || right < 0 || left >= count || right >= count) return;
		const a = Math.min(left, right);
		const b = Math.max(left, right);
		const key = `${a}-${b}`;
		if (seen.has(key)) return;
		seen.add(key);
		links.push({ a, b });
	};

	for (let index = 0; index < count; index += 1) {
		const order = ranked[index] ?? [];
		const nearest = order[0];
		if (nearest !== undefined) add(index, nearest);
		const farStart = Math.max(4, Math.floor(count * 0.22));
		const farBand = order.slice(farStart);
		const far = farBand[Math.floor(unitHash(index, 4) * farBand.length)];
		if (far !== undefined) add(index, far);
		if (unitHash(index, 5) > 0.42) {
			const mid = order[2 + Math.floor(unitHash(index, 6) * 3)];
			if (mid !== undefined) add(index, mid);
		}
	}
	return links;
}

export function prismLinkColor(index: number): string {
	return index % 2 === 0 ? PRISM_BLUE : PRISM_NODE_TEAL;
}

/** Bowed midpoint so an axon curves through the volume instead of running straight. */
export function prismAxonControl(a: Vec3, b: Vec3, index: number): Vec3 {
	const dx = b.x - a.x;
	const dy = b.y - a.y;
	const dz = b.z - a.z;
	const span = Math.hypot(dx, dy, dz) || 1;
	let ox = unitHash(index, 9) - 0.5;
	let oy = unitHash(index, 10) - 0.5;
	let oz = unitHash(index, 11) - 0.5;
	const along = (ox * dx + oy * dy + oz * dz) / (span * span);
	ox -= dx * along;
	oy -= dy * along;
	oz -= dz * along;
	const mag = Math.hypot(ox, oy, oz) || 1;
	const bend = span * (0.28 + unitHash(index, 12) * 0.5);
	const reach = prismNodeReach();
	const clamp = (value: number) => Math.min(reach, Math.max(-reach, value));
	return {
		x: clamp((a.x + b.x) / 2 + (ox / mag) * bend),
		y: clamp((a.y + b.y) / 2 + (oy / mag) * bend),
		z: clamp((a.z + b.z) / 2 + (oz / mag) * bend),
	};
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
