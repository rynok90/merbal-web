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
	prismFloat,
	prismHoverColor,
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
	createGlassMaterial,
	patchTransmissionShader,
} from '../src/lib/hero-prism-client.ts';
import { ShaderChunk } from 'three';

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
	assert.equal(material.transmission, 0.92);
	assert.equal(material.roughness, GLASS_ROUGHNESS);
	assert.equal(material.roughness, 0.08);
	assert.equal(material.thickness, GLASS_THICKNESS);
	assert.equal(material.thickness, 0.8);
	assert.equal(material.ior, GLASS_IOR);
	assert.equal(material.ior, 1.5);
	assert.equal(material.clearcoat, GLASS_CLEARCOAT);
	assert.equal(material.clearcoat, 0.4);
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
	assert.ok(faceAlpha < 0.2, 'the face stays see-through');
	assert.ok(rimAlpha > faceAlpha, 'the rim is stronger than the face');
	assert.ok(material.clearcoat > 0);
	assert.ok(material.transmission >= 0.85);
	assert.doesNotMatch(shader.fragmentShader, /#include <transmission_pars_fragment>/);
	assert.doesNotMatch(shader.fragmentShader, /#include <transmission_fragment>/);
	assert.match(material.onBeforeCompile.toString(), /compileGlassFragment/);
	material.dispose();
});

test('hero client calls the shipped prism helpers and boots without module or require', async () => {
	const client = read('src/lib/hero-prism-client.ts');
	const hero = read('src/components/Hero.astro');
	const layout = read('src/layouts/Layout.astro');
	const css = read('src/styles/global.css');
	assert.match(client, /from '\.\/prism\.ts'/);
	assert.match(client, /idleRotation/);
	assert.match(client, /prismFloat/);
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
