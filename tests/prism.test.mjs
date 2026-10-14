import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { PLATFORM_VERTICALS } from '../src/lib/products.ts';
import {
	PRISM_AMBER,
	PRISM_BLUE,
	PRISM_BLUE_SOFT,
	PRISM_CUBE_HALF,
	PRISM_DESKTOP_NODE_COUNT,
	PRISM_LINK_GLOW_OPACITY,
	PRISM_LINK_GLOW_RADIUS,
	PRISM_LINK_RADIUS,
	PRISM_NODE_CORE_RADIUS,
	PRISM_NODE_GLOW_OPACITY,
	PRISM_NODE_GLOW_RADIUS,
	PRISM_NODE_INSET,
	PRISM_INNER_MARGIN,
	PRISM_INNER_SCALE,
	PRISM_CAMERA,
	PRISM_CAMERA_FOV,
	PRISM_CANVAS_MARGIN,
	PRISM_DESKTOP_CANVAS,
	PRISM_NARROW_CANVAS,
	PRISM_REFLECTION_RADIUS,
	PRISM_SHADOW_RADIUS,
	PRISM_FLOAT_SPEED,
	PRISM_HOVER_RADIUS,
	PRISM_IDLE_SPEED,
	PRISM_LINE,
	PRISM_LINE_LOOP_MS,
	PRISM_MOBILE_NODE_COUNT,
	PRISM_NODE_TEAL,
	PRISM_PULSE_CYCLE_MS,
	PRISM_PULSE_WINDOW,
	PRISM_TEAL,
	heroPrismFrame,
	idleRotation,
	internalDashOffset,
	internalLinePhase,
	prismAxonControl,
	prismCantoEdges,
	prismCantoCorners,
	prismCantoPixels,
	prismCastPose,
	prismCornersInside,
	prismProjectedCorners,
	prismFloat,
	prismHoverColor,
	rotateVertex,
	prismInnerHalf,
	prismNodeReach,
	prismOuterHalf,
	prismProject,
	prismLinkColor,
	prismLinks,
	prismLineColors,
	prismMotionAllowed,
	prismNodeCount,
	prismNodes,
	prismPulseLinkIndex,
	prismPulsePhase,
	projectPrism,
} from '../src/lib/prism.ts';
import {
	GLASS_CLEARCOAT,
	GLASS_IOR,
	GLASS_ROUGHNESS,
	GLASS_THICKNESS,
	GLASS_TRANSMISSION,
	REFLECTION_OPACITY,
	SHADOW_OPACITY,
	createCantoMaterial,
	createGlassMaterial,
	createInnerGlassMaterial,
	patchTransmissionShader,
} from '../src/lib/hero-prism-client.ts';
import { CircleGeometry, Group, Mesh, MeshBasicMaterial, PerspectiveCamera, Quaternion, ShaderChunk, Vector3 } from 'three';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function read(rel) {
	return readFileSync(join(root, rel), 'utf8');
}

test('idle rotation advances X, Y, and Z without a pointer argument', () => {
	assert.equal(idleRotation.length, 1);
	assert.ok(PRISM_IDLE_SPEED.x > 0);
	assert.ok(PRISM_IDLE_SPEED.y > 0);
	assert.ok(PRISM_IDLE_SPEED.z > 0);

	const start = idleRotation(0);
	const later = idleRotation(1000);
	assert.ok(later.x > start.x);
	assert.ok(later.y > start.y);
	assert.ok(later.z > start.z);

	const frame = heroPrismFrame(1000, [], null);
	assert.deepEqual(frame.rotation, later);

	const flat = projectPrism(0, 480, 420);
	const turned = projectPrism(1400, 480, 420);
	assert.equal(flat.length, turned.length);
	assert.ok(
		flat.some((point, index) => {
			const next = turned[index];
			return Math.abs(point.x - next.x) > 0.5 || Math.abs(point.y - next.y) > 0.5;
		}),
	);
});

test('internal line phase repeats and drives a looping dash', () => {
	assert.equal(internalLinePhase(0), 0);
	assert.equal(internalLinePhase(PRISM_LINE_LOOP_MS), 0);
	assert.equal(internalLinePhase(PRISM_LINE_LOOP_MS * 3), 0);
	const quarter = internalLinePhase(PRISM_LINE_LOOP_MS * 0.25);
	const three = internalLinePhase(PRISM_LINE_LOOP_MS * 0.75);
	assert.ok(quarter > 0.24 && quarter < 0.26);
	assert.ok(three > quarter);
	assert.ok(three < 1);
	assert.equal(internalDashOffset(0), internalDashOffset(1));
	assert.notEqual(internalDashOffset(0), internalDashOffset(0.5));
	assert.equal(heroPrismFrame(PRISM_LINE_LOOP_MS, [], null).phase, 0);
});

test('only lines near the cursor become amber or teal', () => {
	const points = [
		{ x: 0, y: 0 },
		{ x: 20, y: 0 },
		{ x: 400, y: 360 },
	];
	const colors = prismLineColors(points, { x: 0, y: 0 }, PRISM_HOVER_RADIUS);
	assert.equal(colors[0], PRISM_AMBER);
	assert.equal(colors[0], '#F5A524');
	assert.equal(colors[1], PRISM_TEAL);
	assert.ok(colors[1].toLowerCase() !== '#f5a524');
	assert.equal(colors[2], PRISM_LINE);
	assert.equal(colors[2], '#2B8CFF');
	assert.notEqual(colors[2], PRISM_AMBER);
	assert.notEqual(colors[2], PRISM_TEAL);

	const idle = prismLineColors(points, null);
	assert.ok(idle.every((color) => color !== PRISM_AMBER && color !== PRISM_TEAL));

	const frame = heroPrismFrame(500, points, { x: 0, y: 0 });
	assert.deepEqual(frame.colors, colors);
	assert.deepEqual(frame.rotation, idleRotation(500));
});

function axisSpread(nodes, axis) {
	const mean = nodes.reduce((sum, node) => sum + node[axis], 0) / nodes.length;
	const variance = nodes.reduce((sum, node) => sum + (node[axis] - mean) ** 2, 0) / nodes.length;
	return Math.sqrt(variance);
}

function pairDistance(a, b) {
	return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

function medianNearestSpacing(nodes) {
	const distances = nodes.map((node, index) => {
		let nearest = Number.POSITIVE_INFINITY;
		for (let other = 0; other < nodes.length; other += 1) {
			if (other === index) continue;
			nearest = Math.min(nearest, pairDistance(node, nodes[other]));
		}
		return nearest;
	});
	distances.sort((left, right) => left - right);
	return distances[Math.floor(distances.length / 2)];
}

function twoNearestKeys(nodes) {
	const keys = new Set();
	for (let index = 0; index < nodes.length; index += 1) {
		const nearest = nodes
			.map((node, other) => ({
				other,
				distance: other === index ? Number.POSITIVE_INFINITY : pairDistance(nodes[index], node),
			}))
			.sort((left, right) => left.distance - right.distance)
			.slice(0, 2);
		for (const pick of nearest) {
			if (!Number.isFinite(pick.distance)) continue;
			const a = Math.min(index, pick.other);
			const b = Math.max(index, pick.other);
			keys.add(`${a}-${b}`);
		}
	}
	return keys;
}

test('dense nodes fill the cube on wide and narrow viewports', () => {
	assert.ok(PRISM_DESKTOP_NODE_COUNT >= 80 && PRISM_DESKTOP_NODE_COUNT <= 150);
	assert.ok(PRISM_MOBILE_NODE_COUNT >= 80 && PRISM_MOBILE_NODE_COUNT <= 150);

	const desktop = prismNodes(1280);
	const mobile = prismNodes(390);
	assert.equal(desktop.length, prismNodeCount(1280));
	assert.equal(mobile.length, prismNodeCount(390));
	assert.equal(desktop.length, PRISM_DESKTOP_NODE_COUNT);
	assert.equal(mobile.length, PRISM_MOBILE_NODE_COUNT);
	assert.ok(desktop.length >= 80 && desktop.length <= 150);
	assert.ok(mobile.length >= 80 && mobile.length <= 150);

	const allowed = new Set([PRISM_BLUE, PRISM_BLUE_SOFT, PRISM_NODE_TEAL]);
	assert.equal(PRISM_BLUE, '#2B8CFF');
	assert.equal(PRISM_BLUE_SOFT, '#3B82F6');
	assert.equal(PRISM_NODE_TEAL, '#14B8A6');
	assert.ok(PRISM_NODE_INSET > 0);
	for (const cloud of [desktop, mobile]) {
		for (const node of cloud) {
			assert.ok(allowed.has(node.color));
			for (const axis of ['x', 'y', 'z']) {
				const gap = PRISM_CUBE_HALF - Math.abs(node[axis]);
				assert.ok(gap + 1e-9 >= PRISM_NODE_INSET, `${axis} gap ${gap} is inside the face margin`);
			}
		}
		const spreads = ['x', 'y', 'z'].map((axis) => axisSpread(cloud, axis));
		const widest = Math.max(...spreads);
		const flattest = Math.min(...spreads);
		assert.ok(flattest / widest > 0.75, `cloud is flattened: ${spreads.join(', ')}`);
	}
	assert.ok(desktop.some((node) => node.color === '#2B8CFF'));
	assert.ok(desktop.some((node) => node.color === '#3B82F6'));
	assert.ok(desktop.some((node) => node.color === '#14B8A6'));

	const spacing = medianNearestSpacing(desktop);
	assert.ok(PRISM_NODE_CORE_RADIUS > 0);
	assert.ok(PRISM_NODE_CORE_RADIUS < spacing * 0.2, `core ${PRISM_NODE_CORE_RADIUS} is large next to spacing ${spacing}`);
	assert.ok(PRISM_NODE_GLOW_RADIUS > PRISM_NODE_CORE_RADIUS);
	assert.ok(PRISM_NODE_GLOW_OPACITY > 0 && PRISM_NODE_GLOW_OPACITY < 0.45);
	assert.ok(PRISM_LINK_GLOW_RADIUS > PRISM_LINK_RADIUS);
	assert.ok(PRISM_LINK_RADIUS > 0);
	assert.ok(PRISM_LINK_GLOW_OPACITY > 0 && PRISM_LINK_GLOW_OPACITY < 0.45);

	const links = prismLinks(desktop);
	assert.ok(links.length > desktop.length);
	assert.ok(
		links.every((link) => link.a !== link.b && link.a >= 0 && link.b >= 0 && link.b < desktop.length && link.a < desktop.length),
	);
	const shipped = links.map((link) => `${link.a}-${link.b}`).sort();
	const nearestOnly = [...twoNearestKeys(desktop)].sort();
	assert.notDeepEqual(shipped, nearestOnly);
	const lengths = links.map((link) => pairDistance(desktop[link.a], desktop[link.b]));
	const shortest = Math.min(...lengths);
	const longest = Math.max(...lengths);
	assert.ok(shortest > 0);
	assert.ok(longest > shortest * 2.2, `links do not vary: ${shortest} .. ${longest}`);
	assert.equal(prismLinkColor(0), '#2B8CFF');
	assert.equal(prismLinkColor(1), '#14B8A6');

	let bowed = 0;
	for (const [index, link] of links.entries()) {
		const control = prismAxonControl(desktop[link.a], desktop[link.b], index);
		for (const axis of ['x', 'y', 'z']) {
			const gap = PRISM_CUBE_HALF - Math.abs(control[axis]);
			assert.ok(gap + 1e-9 >= PRISM_NODE_INSET, `axon ${axis} leaves the inset volume`);
		}
		const mid = {
			x: (desktop[link.a].x + desktop[link.b].x) / 2,
			y: (desktop[link.a].y + desktop[link.b].y) / 2,
			z: (desktop[link.a].z + desktop[link.b].z) / 2,
		};
		if (pairDistance(control, mid) > 0.02) bowed += 1;
	}
	assert.ok(bowed > links.length * 0.8, 'axons stay straight like a molecule graph');
});

test('vertical float, pulse phase, and motion gates stay pure functions of time and visibility', () => {
	assert.equal(prismFloat(0), 0);
	assert.equal(prismFloat(Number.NaN), 0);
	const early = prismFloat(420);
	const later = prismFloat(1600);
	assert.notEqual(early, later);
	assert.ok(Math.abs(early) < 0.2);
	assert.ok(Math.abs(later) < 0.2);
	assert.ok(Math.abs(prismFloat((Math.PI * 2 * 1000) / PRISM_FLOAT_SPEED)) < 1e-9);

	assert.equal(prismPulsePhase(0), 0);
	assert.equal(prismPulsePhase(PRISM_PULSE_CYCLE_MS), 0);
	const quietAt = PRISM_PULSE_CYCLE_MS * ((PRISM_PULSE_WINDOW + 1) / 2);
	assert.equal(prismPulsePhase(quietAt), -1);
	const traveling = prismPulsePhase(PRISM_PULSE_CYCLE_MS * (PRISM_PULSE_WINDOW / 2));
	assert.ok(traveling > 0.4 && traveling < 0.6);
	assert.equal(prismPulseLinkIndex(0, 5), 0);
	assert.notEqual(prismPulseLinkIndex(PRISM_PULSE_CYCLE_MS, 5), prismPulseLinkIndex(0, 5));

	assert.equal(prismMotionAllowed(true, true), false);
	assert.equal(prismMotionAllowed(false, false), false);
	assert.equal(prismMotionAllowed(false, true), true);
});

test('nearest nodes and lines turn amber and far marks keep blue or teal', () => {
	assert.equal(prismHoverColor({ x: 4, y: 2 }, '#2B8CFF', { x: 0, y: 0 }, PRISM_HOVER_RADIUS), PRISM_AMBER);
	assert.equal(prismHoverColor({ x: 4, y: 2 }, '#14B8A6', { x: 0, y: 0 }), '#F5A524');
	assert.equal(prismHoverColor({ x: 400, y: 20 }, '#3B82F6', { x: 0, y: 0 }), '#3B82F6');
	assert.equal(prismHoverColor({ x: 400, y: 20 }, '#14B8A6', { x: 0, y: 0 }), PRISM_NODE_TEAL);
	assert.equal(prismHoverColor({ x: 0, y: 0 }, '#2B8CFF', null), PRISM_BLUE);
	assert.notEqual(prismHoverColor({ x: 400, y: 0 }, '#14B8A6', { x: 0, y: 0 }), PRISM_AMBER);
});

test('glass material is clear physical glass with the required optical numbers', () => {
	const material = createGlassMaterial();
	assert.equal(material.isMeshPhysicalMaterial, true);
	assert.equal(material.transmission, GLASS_TRANSMISSION);
	assert.ok(material.transmission >= 0.92 && material.transmission <= 1);
	assert.equal(material.roughness, GLASS_ROUGHNESS);
	assert.ok(Math.abs(material.roughness - 0.03) < 0.015);
	assert.equal(material.thickness, GLASS_THICKNESS);
	assert.ok(material.thickness >= 0.6 && material.thickness <= 1);
	assert.equal(material.ior, GLASS_IOR);
	assert.equal(material.ior, 1.5);
	assert.equal(material.clearcoat, GLASS_CLEARCOAT);
	assert.ok(material.clearcoat > 0);
	const chunk = ShaderChunk.transmission_pars_fragment;
	const patched = patchTransmissionShader(chunk);
	assert.notEqual(patched, chunk);
	assert.match(patched, /min\( 0\.1,/);
	const shader = {
		fragmentShader: '#include <transmission_pars_fragment>\n#include <transmission_fragment>\n',
	};
	material.onBeforeCompile(shader);
	assert.match(shader.fragmentShader, /min\( 0\.1,/);
	assert.match(shader.fragmentShader, /glassFresnel/);
	const fresnel = shader.fragmentShader.match(
		/material\.transmissionAlpha = mix\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*glassFresnel\s*\)/,
	);
	assert.ok(fresnel, 'fresnel alpha is missing');
	const faceAlpha = Number(fresnel[1]);
	const rimAlpha = Number(fresnel[2]);
	assert.ok(faceAlpha > 0.15 && faceAlpha < 0.24, 'the face stays a translucent veil');
	assert.ok(rimAlpha > faceAlpha, 'the rim is stronger than the face');
	assert.ok(rimAlpha > 0.7, 'the rim reads as glass');
	assert.ok(material.clearcoat > 0);
	assert.ok(material.transmission >= 0.85);
	assert.doesNotMatch(shader.fragmentShader, /#include <transmission_pars_fragment>/);
	assert.doesNotMatch(shader.fragmentShader, /#include <transmission_fragment>/);
	assert.match(material.onBeforeCompile.toString(), /compileGlassFragment/);
	material.dispose();
});

test('thick crystal holds a darker inner volume, beveled cantos, and a shared rotating floor', () => {
	const outer = createGlassMaterial();
	const inner = createInnerGlassMaterial();
	assert.ok(PRISM_INNER_SCALE < 1);
	assert.ok(prismInnerHalf() < PRISM_CUBE_HALF);
	assert.ok(inner.transmission < outer.transmission);
	assert.ok(inner.attenuationDistance < 2);
	assert.ok(inner.color.r + inner.color.g + inner.color.b < outer.color.r + outer.color.g + outer.color.b);
	const innerShader = {
		fragmentShader: '#include <transmission_pars_fragment>\n#include <transmission_fragment>\n',
	};
	inner.onBeforeCompile(innerShader);
	const innerFresnel = innerShader.fragmentShader.match(
		/material\.transmissionAlpha = mix\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*glassFresnel\s*\)/,
	);
	assert.ok(innerFresnel, 'inner fresnel alpha is missing');
	assert.ok(Number(innerFresnel[2]) > Number(innerFresnel[1]));
	assert.ok(Number(innerFresnel[1]) > 0.08);
	outer.dispose();
	inner.dispose();

	const reach = prismNodeReach();
	const innerHalf = prismInnerHalf();
	assert.ok(innerHalf - reach >= PRISM_INNER_MARGIN - 1e-9);
	for (const cloud of [prismNodes(1280), prismNodes(390)]) {
		for (const node of cloud) {
			for (const axis of ['x', 'y', 'z']) {
				const gap = innerHalf - Math.abs(node[axis]);
				assert.ok(gap + 1e-9 >= PRISM_INNER_MARGIN, `${axis} sits on the inner face`);
				assert.ok(Math.abs(node[axis]) <= reach + 1e-9);
			}
		}
	}

	const canto = createCantoMaterial();
	assert.equal(canto.isMeshPhysicalMaterial, true);
	assert.ok(canto.emissiveIntensity > 0.2);
	assert.ok(canto.clearcoat >= 1);
	assert.ok(canto.opacity > 0.9);
	canto.dispose();
	assert.equal(prismCantoEdges().length, 12);
	assert.equal(prismCantoCorners().length, 8);
	assert.equal(new Set(prismCantoEdges().map((edge) => edge.axis)).size, 3);
	const desktopPx = prismCantoPixels(PRISM_DESKTOP_CANVAS.width, PRISM_DESKTOP_CANVAS.height);
	assert.ok(desktopPx >= 3 && desktopPx <= 4, `desktop canto is ${desktopPx} px`);
	assert.ok(prismOuterHalf() > PRISM_CUBE_HALF);

	const still = prismCastPose(0);
	const turned = prismCastPose(1600);
	assert.deepEqual(still.rotation, idleRotation(0));
	assert.notEqual(still.rotation.x, turned.rotation.x);
	assert.notEqual(still.rotation.z, turned.rotation.z);
	assert.equal(still.shadow.x, 0);
	assert.equal(still.shadow.z, 0);
	assert.equal(turned.shadow.x, 0);
	assert.equal(turned.shadow.z, 0);
	assert.equal(still.reflection.x, 0);
	assert.equal(still.reflection.z, 0);
	assert.equal(turned.reflection.x, 0);
	assert.equal(turned.reflection.z, 0);
	assert.equal(still.shadow.y, still.rotation.y);
	assert.equal(turned.shadow.y, turned.rotation.y);
	assert.deepEqual(still.shadow, still.reflection);
	assert.deepEqual(turned.shadow, turned.reflection);
	assert.notEqual(still.shadow.y, turned.shadow.y);
	assert.equal(still.floorY, turned.floorY);
	assert.ok(SHADOW_OPACITY > 0.05 && SHADOW_OPACITY < 0.55);
	assert.ok(REFLECTION_OPACITY > 0.05 && REFLECTION_OPACITY < 0.55);

	let lowestCorner = Infinity;
	for (let timeMs = 0; timeMs <= 30000; timeMs += 40) {
		const rotation = idleRotation(timeMs);
		const floatY = prismFloat(timeMs);
		const extent = prismOuterHalf();
		for (const sx of [-1, 1]) {
			for (const sy of [-1, 1]) {
				for (const sz of [-1, 1]) {
					const corner = rotateVertex({ x: sx * extent, y: sy * extent, z: sz * extent }, rotation);
					lowestCorner = Math.min(lowestCorner, corner.y + floatY);
				}
			}
		}
	}
	assert.ok(still.floorY < lowestCorner, `floor ${still.floorY} cuts the cube at ${lowestCorner}`);

	const floor = new Group();
	const disc = new Mesh(new CircleGeometry(PRISM_SHADOW_RADIUS, 8), new MeshBasicMaterial());
	disc.rotation.x = -Math.PI / 2;
	floor.add(disc);
	floor.rotation.set(turned.shadow.x, turned.shadow.y, turned.shadow.z);
	floor.position.y = turned.floorY;
	floor.updateMatrixWorld(true);
	const normal = new Vector3(0, 0, 1).applyQuaternion(disc.getWorldQuaternion(new Quaternion()));
	assert.ok(Math.abs(normal.x) < 1e-5 && Math.abs(normal.z) < 1e-5 && normal.y > 0.99);
	const discWorld = new Vector3();
	disc.getWorldPosition(discWorld);
	assert.ok(Math.abs(discWorld.y - turned.floorY) < 1e-5);

	for (const canvas of [PRISM_DESKTOP_CANVAS, PRISM_NARROW_CANVAS]) {
		for (const radius of [PRISM_SHADOW_RADIUS, PRISM_REFLECTION_RADIUS]) {
			for (let step = 0; step < 32; step += 1) {
				const angle = (step / 32) * Math.PI * 2;
				const point = prismProject(
					{ x: Math.cos(angle) * radius, y: still.floorY, z: Math.sin(angle) * radius },
					canvas.width,
					canvas.height,
				);
				const insideX = point.x >= canvas.width * PRISM_CANVAS_MARGIN && point.x <= canvas.width * (1 - PRISM_CANVAS_MARGIN);
				const insideY = point.y >= canvas.height * PRISM_CANVAS_MARGIN && point.y <= canvas.height * (1 - PRISM_CANVAS_MARGIN);
				assert.equal(insideX && insideY && point.depth > 0, true);
			}
		}
	}

	const camera = new PerspectiveCamera(
		PRISM_CAMERA_FOV,
		PRISM_DESKTOP_CANVAS.width / PRISM_DESKTOP_CANVAS.height,
		0.1,
		40,
	);
	camera.position.set(PRISM_CAMERA.x, PRISM_CAMERA.y, PRISM_CAMERA.z);
	camera.lookAt(0, 0, 0);
	camera.updateMatrixWorld(true);
	camera.updateProjectionMatrix();
	const half = prismOuterHalf();
	const sample = new Vector3(half, -half, half);
	sample.project(camera);
	const projected = prismProject(
		{ x: half, y: -half, z: half },
		PRISM_DESKTOP_CANVAS.width,
		PRISM_DESKTOP_CANVAS.height,
	);
	assert.ok(Math.abs(projected.x - (sample.x * 0.5 + 0.5) * PRISM_DESKTOP_CANVAS.width) < 0.05);
	assert.ok(Math.abs(projected.y - (-sample.y * 0.5 + 0.5) * PRISM_DESKTOP_CANVAS.height) < 0.05);

	for (const canvas of [PRISM_DESKTOP_CANVAS, PRISM_NARROW_CANVAS]) {
		for (let timeMs = 0; timeMs <= 30000; timeMs += 40) {
			assert.equal(prismCornersInside(canvas.width, canvas.height, timeMs, PRISM_CANVAS_MARGIN), true);
		}
		const corners = prismProjectedCorners(canvas.width, canvas.height, 8425);
		assert.equal(corners.length, 8);
	}
});

test('hero client calls the shipped prism helpers and boots without module or require', async () => {
	const client = read('src/lib/hero-prism-client.ts');
	const hero = read('src/components/Hero.astro');
	const layout = read('src/layouts/Layout.astro');
	const css = read('src/styles/global.css');
	assert.match(client, /from '\.\/prism\.ts'/);
	assert.match(client, /prismCastPose/);
	assert.match(client, /prismFloat/);
	assert.match(client, /createInnerGlassMaterial/);
	assert.match(client, /createCantoMaterial/);
	assert.match(client, /prismCantoEdges/);
	assert.match(client, /prismCantoCorners/);
	assert.match(client, /CylinderGeometry/);
	assert.match(client, /CircleGeometry/);
	assert.match(client, /PRISM_CAMERA_FOV/);
	assert.match(client, /PRISM_CAMERA/);
	assert.match(client, /PRISM_INNER_SCALE/);
	assert.match(client, /floor\.add\(shadow\)/);
	assert.match(client, /floor\.add\(reflection\)/);
	assert.match(client, /floor\.rotation\.set\(pose\.shadow\.x, pose\.shadow\.y, pose\.shadow\.z\)/);
	assert.match(client, /floor\.position\.y = pose\.floorY/);
	assert.match(client, /PRISM_SHADOW_RADIUS/);
	assert.match(client, /PRISM_REFLECTION_RADIUS/);
	assert.match(client, /opacity:\s*SHADOW_OPACITY/);
	assert.match(client, /opacity:\s*REFLECTION_OPACITY/);
	assert.doesNotMatch(client, /rig\.add\(shadow\)/);
	assert.doesNotMatch(client, /rig\.add\(reflection\)/);
	assert.match(client, /floorReflectionTexture/);
	assert.match(client, /floorShadowTexture/);
	assert.doesNotMatch(client, /EdgesGeometry/);
	assert.doesNotMatch(client, /LineSegments/);
	assert.doesNotMatch(client, /LineBasicMaterial/);
	assert.match(client, /prismNodes/);
	assert.match(client, /prismLinks/);
	assert.match(client, /prismAxonControl/);
	assert.match(client, /TubeGeometry/);
	assert.match(client, /prismPulsePhase/);
	assert.match(client, /prismHoverColor/);
	assert.match(client, /prismMotionAllowed/);
	assert.match(client, /MeshPhysicalMaterial/);
	assert.match(client, /transmission:\s*GLASS_TRANSMISSION/);
	assert.match(client, /roughness:\s*GLASS_ROUGHNESS/);
	assert.match(client, /thickness:\s*GLASS_THICKNESS/);
	assert.match(client, /ior:\s*GLASS_IOR/);
	assert.match(client, /clearcoat:\s*GLASS_CLEARCOAT/);
	assert.match(client, /PRISM_CUBE_SIZE/);
	assert.match(client, /PRISM_NODE_CORE_RADIUS/);
	assert.match(client, /PRISM_NODE_GLOW_RADIUS/);
	assert.match(client, /PRISM_NODE_GLOW_OPACITY/);
	assert.match(client, /PRISM_LINK_RADIUS/);
	assert.match(client, /PRISM_LINK_GLOW_RADIUS/);
	assert.match(client, /PRISM_LINK_GLOW_OPACITY/);
	assert.match(client, /new PointLight/);
	assert.match(client, /alpha:\s*true/);
	assert.match(client, /scene\.background\s*=\s*null/);
	assert.match(client, /bootHeroPrism/);
	assert.doesNotMatch(client, /#060d18/);
	assert.doesNotMatch(client, /fillRect/);
	assert.doesNotMatch(client, /getContext\(\s*['"]2d['"]\s*\)/);
	assert.doesNotMatch(client, /\brequire\s*\(/);
	assert.doesNotMatch(client, /module\.exports/);
	assert.doesNotMatch(client, /three\.js/i);
	assert.match(hero, /bootHeroPrism/);
	assert.match(hero, /data-hero-prism/);
	assert.doesNotMatch(hero, /three\.js/i);
	assert.doesNotMatch(layout + css, /three\.js/i);
	assert.match(css, /\.hero-prism-stage::before/);
	assert.match(css, /20 184 166/);
	assert.match(css, /\.hero-prism[\s\S]*background:\s*transparent/);

	const previousWindow = globalThis.window;
	const previousDocument = globalThis.document;
	globalThis.window = globalThis;
	globalThis.document = {
		readyState: 'complete',
		querySelector() {
			return null;
		},
		querySelectorAll() {
			return [];
		},
		addEventListener() {},
	};
	try {
		assert.equal(globalThis.module, undefined);
		assert.equal(globalThis.require, undefined);
		const loaded = await import('../src/lib/hero-prism-client.ts');
		assert.equal(typeof loaded.bootHeroPrism, 'function');
		loaded.bootHeroPrism();
		loaded.bootHeroPrism();
	} finally {
		if (previousWindow === undefined) delete globalThis.window;
		else globalThis.window = previousWindow;
		if (previousDocument === undefined) delete globalThis.document;
		else globalThis.document = previousDocument;
	}
});

test('home plataformas teaser is two layered cards, not the five-product catalog', () => {
	const pillars = read('src/components/Pillars.astro');
	const home = read('src/pages/index.astro');
	const css = read('src/styles/global.css');
	const names = PLATFORM_VERTICALS.map((vertical) => vertical.name);
	assert.deepEqual(names, ['Operación de sitios', 'Negocios de servicio']);
	assert.equal(PLATFORM_VERTICALS.length, 2);
	assert.match(pillars, /PLATFORM_VERTICALS\.map/);
	assert.match(pillars, /href=\{vertical\.href\}/);
	assert.match(pillars, /platform-icon/);
	assert.match(pillars, /<svg/);
	assert.match(pillars, /platform-card-layer/);
	assert.match(pillars, /platform-card-layer-2/);
	assert.match(pillars, /platform-card/);
	assert.match(pillars, /home-platform-card/);
	assert.match(css, /\.platform-card:hover/);
	assert.match(css, /rotateX\(4deg\) rotateY\(-6deg\)/);
	assert.match(css, /drop-shadow\(0 0 22px/);
	assert.match(css, /\.home-platform-card:hover/);
	assert.doesNotMatch(home, /<Platforms/);
	assert.doesNotMatch(pillars, /showcaseProducts/);
	assert.doesNotMatch(pillars, /Access Paperless/);
	assert.doesNotMatch(pillars, /SecureFlow/);
	assert.doesNotMatch(pillars, /ActivoObra/);
	assert.doesNotMatch(pillars, /Safe Access/);
});
