import {
	AmbientLight,
	BackSide,
	BoxGeometry,
	CircleGeometry,
	Color,
	CylinderGeometry,
	DataTexture,
	DirectionalLight,
	DoubleSide,
	Group,
	Mesh,
	MeshBasicMaterial,
	MeshPhysicalMaterial,
	NoToneMapping,
	PMREMGenerator,
	PerspectiveCamera,
	PointLight,
	QuadraticBezierCurve3,
	RGBAFormat,
	Scene,
	SphereGeometry,
	ShaderChunk,
	TubeGeometry,
	SRGBColorSpace,
	Vector3,
	WebGLRenderer,
} from 'three';
import {
	PRISM_CAMERA,
	PRISM_CAMERA_FOV,
	PRISM_CANTO_DIAMETER,
	PRISM_CANTO_RADIUS,
	PRISM_CUBE_SIZE,
	PRISM_INNER_SCALE,
	PRISM_REFLECTION_RADIUS,
	PRISM_SHADOW_RADIUS,
	prismAxonControl,
	prismCantoCorners,
	prismCantoEdges,
	prismCastPose,
	PRISM_LINK_GLOW_OPACITY,
	PRISM_LINK_GLOW_RADIUS,
	PRISM_LINK_RADIUS,
	PRISM_NODE_CORE_RADIUS,
	PRISM_NODE_GLOW_OPACITY,
	PRISM_NODE_GLOW_RADIUS,
	PRISM_PULSE_CYCLE_MS,
	prismFloat,
	prismHoverColor,
	prismLinkColor,
	prismLinks,
	prismMotionAllowed,
	prismNodes,
	prismPulseLinkIndex,
	prismPulsePhase,
	type PrismLink,
	type PrismNode,
} from './prism.ts';

export const GLASS_TRANSMISSION = 0.97;
export const GLASS_ROUGHNESS = 0.03;
export const GLASS_THICKNESS = 0.9;
export const GLASS_IOR = 1.5;
export const GLASS_CLEARCOAT = 0.55;
/** Faint enough to read as a puddle on the navy, not a plate on the glass. */
export const SHADOW_OPACITY = 0.48;
export const REFLECTION_OPACITY = 0.36;

type HoverCursor = { x: number; y: number } | null;

type NodeView = {
	mesh: Mesh;
	glow: Mesh;
	base: string;
};

type LinkView = {
	mesh: Mesh;
	glow: Mesh;
	base: string;
};

/**
 * A transparent canvas makes the transmission pass clear to white at alpha 0.5.
 * That sample becomes a milky slab. Cap the refraction alpha, then composite the
 * cube with a fresnel curve so faces stay clear and the rim still reads as glass.
 * Includes expand after onBeforeCompile, so the patched chunks are inlined.
 */
export function patchTransmissionShader(source: string): string {
	const alphaReturn =
		'return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );';
	const patchedReturn =
		'return vec4( ( 1.0 - F ) * attenuatedColor, min( 0.1, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor ) );';
	return source.replace(alphaReturn, patchedReturn);
}

export function compileGlassFragment(source: string): string {
	const mixLine =
		'material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );';
	const fresnelAlpha = [
		'float glassFacing = saturate( dot( n, v ) );',
		'float glassFresnel = pow( 1.0 - glassFacing, 5.0 );',
		'material.transmissionAlpha = mix( 0.2, 1.0, glassFresnel );',
	].join('\n\t');
	const pars = patchTransmissionShader(ShaderChunk.transmission_pars_fragment);
	const fragment = ShaderChunk.transmission_fragment.replace(mixLine, fresnelAlpha);
	return source
		.replace('#include <transmission_pars_fragment>', pars)
		.replace('#include <transmission_fragment>', fragment);
}

export function createGlassMaterial(): MeshPhysicalMaterial {
	const material = new MeshPhysicalMaterial({
		color: new Color('#f4f8ff'),
		metalness: 0,
		roughness: GLASS_ROUGHNESS,
		transmission: GLASS_TRANSMISSION,
		thickness: GLASS_THICKNESS,
		ior: GLASS_IOR,
		transparent: true,
		opacity: 1,
		clearcoat: GLASS_CLEARCOAT,
		clearcoatRoughness: 0.015,
		attenuationColor: new Color('#ffffff'),
		attenuationDistance: Infinity,
		envMapIntensity: 1,
		specularIntensity: 1,
	});
	material.depthWrite = false;
	material.onBeforeCompile = (shader) => {
		shader.fragmentShader = compileGlassFragment(shader.fragmentShader);
	};
	return material;
}

/** Darker glass nested inside the clear outer cube. The network lives in this volume. */
export function compileInnerFragment(source: string): string {
	const mixLine =
		'material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );';
	const fresnelAlpha = [
		'float glassFacing = saturate( dot( n, v ) );',
		'float glassFresnel = pow( 1.0 - glassFacing, 4.0 );',
		'material.transmissionAlpha = mix( 0.09, 0.36, glassFresnel );',
	].join('\n\t');
	const pars = patchTransmissionShader(ShaderChunk.transmission_pars_fragment);
	const fragment = ShaderChunk.transmission_fragment.replace(mixLine, fresnelAlpha);
	return source
		.replace('#include <transmission_pars_fragment>', pars)
		.replace('#include <transmission_fragment>', fragment);
}

export function createInnerGlassMaterial(): MeshPhysicalMaterial {
	const material = new MeshPhysicalMaterial({
		color: new Color('#143454'),
		metalness: 0,
		roughness: 0.12,
		transmission: 0.78,
		thickness: 0.55,
		ior: GLASS_IOR,
		transparent: true,
		opacity: 1,
		clearcoat: 0.35,
		attenuationColor: new Color('#0a1830'),
		attenuationDistance: 1.6,
	});
	material.depthWrite = false;
	material.onBeforeCompile = (shader) => {
		shader.fragmentShader = compileInnerFragment(shader.fragmentShader);
	};
	return material;
}

/** White-blue bars. Emissive so the canto stays visible when a face turns away from the key light. */
export function createCantoMaterial(): MeshPhysicalMaterial {
	const material = new MeshPhysicalMaterial({
		color: new Color('#f3f9ff'),
		emissive: new Color('#b9dcff'),
		emissiveIntensity: 1.8,
		metalness: 0,
		roughness: 0.18,
		clearcoat: 1,
		transparent: true,
		opacity: 0.96,
	});
	material.depthWrite = true;
	return material;
}

/** Soft white-blue disc. Built as pixels so the floor reflection does not need a 2D canvas. */
export function floorReflectionTexture(): DataTexture {
	const size = 64;
	const data = new Uint8Array(size * size * 4);
	const center = (size - 1) / 2;
	for (let y = 0; y < size; y += 1) {
		for (let x = 0; x < size; x += 1) {
			const dx = (x - center) / center;
			const dy = (y - center) / center;
			const radius = Math.min(1, Math.hypot(dx, dy));
			const alpha = (1 - radius) ** 2;
			const index = (y * size + x) * 4;
			data[index] = 198;
			data[index + 1] = 220;
			data[index + 2] = 255;
			data[index + 3] = Math.round(alpha * 255);
		}
	}
	const texture = new DataTexture(data, size, size, RGBAFormat);
	texture.colorSpace = SRGBColorSpace;
	texture.needsUpdate = true;
	return texture;
}

/** Soft dark disc. Radial alpha so the shadow fades instead of reading as a plate. */
export function floorShadowTexture(): DataTexture {
	const size = 64;
	const data = new Uint8Array(size * size * 4);
	const center = (size - 1) / 2;
	for (let y = 0; y < size; y += 1) {
		for (let x = 0; x < size; x += 1) {
			const dx = (x - center) / center;
			const dy = (y - center) / center;
			const radius = Math.min(1, Math.hypot(dx, dy));
			const alpha = (1 - radius) ** 2;
			const index = (y * size + x) * 4;
			data[index] = 4;
			data[index + 1] = 8;
			data[index + 2] = 16;
			data[index + 3] = Math.round(alpha * 255);
		}
	}
	const texture = new DataTexture(data, size, size, RGBAFormat);
	texture.colorSpace = SRGBColorSpace;
	texture.needsUpdate = true;
	return texture;
}

function studioEnvironment(renderer: WebGLRenderer) {
	const pmrem = new PMREMGenerator(renderer);
	const studio = new Scene();
	const room = new Mesh(new BoxGeometry(14, 14, 14), [
		new MeshBasicMaterial({ color: 0x071422, side: BackSide }),
		new MeshBasicMaterial({ color: 0x0a1a2e, side: BackSide }),
		new MeshBasicMaterial({ color: 0x12304c, side: BackSide }),
		new MeshBasicMaterial({ color: 0x050b14, side: BackSide }),
		new MeshBasicMaterial({ color: 0x0c2036, side: BackSide }),
		new MeshBasicMaterial({ color: 0x081628, side: BackSide }),
	]);
	studio.add(room);
	studio.add(new AmbientLight(0xdbe7f5, 0.2));
	const key = new DirectionalLight(0xf7fbff, 0.55);
	key.position.set(3, 4, 5);
	studio.add(key);
	const map = pmrem.fromScene(studio, 0.02).texture;
	pmrem.dispose();
	room.geometry.dispose();
	const materials = Array.isArray(room.material) ? room.material : [room.material];
	for (const material of materials) material.dispose();
	return map;
}

function viewportWidth(win: Window, canvas: HTMLCanvasElement): number {
	const width = win.innerWidth || canvas.clientWidth || 1280;
	return Number.isFinite(width) ? width : 1280;
}

export function bootHeroPrism(): void {
	const doc = globalThis.document;
	const win = globalThis.window;
	if (!doc || !win || typeof doc.querySelector !== 'function') return;

	const canvas = doc.querySelector('[data-hero-prism]');
	if (!canvas || typeof (canvas as HTMLCanvasElement).getContext !== 'function') return;
	const surface = canvas as HTMLCanvasElement;
	if (surface.dataset?.prismBooted === 'true') return;

	let renderer: WebGLRenderer;
	try {
		renderer = new WebGLRenderer({
			canvas: surface,
			alpha: true,
			antialias: true,
			premultipliedAlpha: true,
			preserveDrawingBuffer: true,
		});
	} catch {
		return;
	}

	const context = renderer.getContext();
	if (!context) {
		renderer.dispose();
		return;
	}

	if (surface.dataset) surface.dataset.prismBooted = 'true';
	surface.style.background = 'transparent';

	renderer.setClearColor(0x000000, 0);
	renderer.outputColorSpace = SRGBColorSpace;
	renderer.toneMapping = NoToneMapping;

	const scene = new Scene();
	scene.background = null;
	scene.environment = studioEnvironment(renderer);

	scene.add(new AmbientLight(0xd5e4f5, 0.12));
	const sun = new DirectionalLight(0xffffff, 0.35);
	sun.position.set(2.4, 3.1, 4.2);
	scene.add(sun);
	const rim = new DirectionalLight(0x9fd0ff, 0.7);
	rim.position.set(-2.2, 1.4, -1.5);
	scene.add(rim);

	const camera = new PerspectiveCamera(PRISM_CAMERA_FOV, 1, 0.1, 40);
	camera.position.set(PRISM_CAMERA.x, PRISM_CAMERA.y, PRISM_CAMERA.z);
	camera.lookAt(0, 0, 0);

	const rig = new Group();
	scene.add(rig);

	const innerSize = PRISM_CUBE_SIZE * PRISM_INNER_SCALE;
	const inner = new Mesh(new BoxGeometry(innerSize, innerSize, innerSize), createInnerGlassMaterial());
	inner.renderOrder = 1;
	rig.add(inner);

	const glass = new Mesh(new BoxGeometry(PRISM_CUBE_SIZE, PRISM_CUBE_SIZE, PRISM_CUBE_SIZE), createGlassMaterial());
	glass.renderOrder = 3;
	rig.add(glass);

	const cantoMaterial = createCantoMaterial();
	const barLength = PRISM_CUBE_SIZE - PRISM_CANTO_DIAMETER;
	const barGeometry = new CylinderGeometry(PRISM_CANTO_RADIUS, PRISM_CANTO_RADIUS, barLength, 8);
	for (const edge of prismCantoEdges()) {
		const bar = new Mesh(barGeometry, cantoMaterial);
		bar.position.set(edge.center.x, edge.center.y, edge.center.z);
		// CylinderGeometry points along +Y. A quarter turn lays it on the edge axis.
		if (edge.axis === 'x') bar.rotation.z = Math.PI / 2;
		else if (edge.axis === 'z') bar.rotation.x = Math.PI / 2;
		bar.renderOrder = 4;
		rig.add(bar);
	}
	const jointGeometry = new SphereGeometry(PRISM_CANTO_RADIUS * 0.92, 10, 8);
	for (const corner of prismCantoCorners()) {
		const joint = new Mesh(jointGeometry, cantoMaterial);
		joint.position.set(corner.x, corner.y, corner.z);
		joint.renderOrder = 4;
		rig.add(joint);
	}

	const innerCanto = new MeshPhysicalMaterial({
		color: new Color('#d7e9ff'),
		emissive: new Color('#7eb6ff'),
		emissiveIntensity: 0.9,
		metalness: 0,
		roughness: 0.2,
		clearcoat: 0.6,
		transparent: true,
		opacity: 0.92,
	});
	innerCanto.depthWrite = true;
	const innerRadius = PRISM_CANTO_RADIUS * 0.62;
	const innerBarGeometry = new CylinderGeometry(innerRadius, innerRadius, innerSize - innerRadius * 2, 8);
	for (const edge of prismCantoEdges()) {
		const bar = new Mesh(innerBarGeometry, innerCanto);
		bar.position.set(edge.center.x * PRISM_INNER_SCALE, edge.center.y * PRISM_INNER_SCALE, edge.center.z * PRISM_INNER_SCALE);
		if (edge.axis === 'x') bar.rotation.z = Math.PI / 2;
		else if (edge.axis === 'z') bar.rotation.x = Math.PI / 2;
		bar.renderOrder = 4;
		rig.add(bar);
	}
	const innerJointGeometry = new SphereGeometry(innerRadius * 0.92, 8, 8);
	for (const corner of prismCantoCorners()) {
		const joint = new Mesh(innerJointGeometry, innerCanto);
		joint.position.set(corner.x * PRISM_INNER_SCALE, corner.y * PRISM_INNER_SCALE, corner.z * PRISM_INNER_SCALE);
		joint.renderOrder = 4;
		rig.add(joint);
	}

	const floor = new Group();
	scene.add(floor);

	const shadow = new Mesh(
		new CircleGeometry(PRISM_SHADOW_RADIUS, 40),
		new MeshBasicMaterial({
			map: floorShadowTexture(),
			color: new Color('#ffffff'),
			transparent: true,
			opacity: SHADOW_OPACITY,
			depthWrite: false,
			side: DoubleSide,
		}),
	);
	shadow.rotation.x = -Math.PI / 2;
	shadow.renderOrder = 0;
	floor.add(shadow);

	const reflection = new Mesh(
		new CircleGeometry(PRISM_REFLECTION_RADIUS, 40),
		new MeshBasicMaterial({
			map: floorReflectionTexture(),
			color: new Color('#ffffff'),
			transparent: true,
			opacity: REFLECTION_OPACITY,
			depthWrite: false,
			side: DoubleSide,
		}),
	);
	reflection.rotation.x = -Math.PI / 2;
	reflection.position.y = 0.002;
	reflection.renderOrder = 1;
	floor.add(reflection);

	const interior = new PointLight(0xc8fff4, 0.55, 2.6, 2);
	interior.position.set(0.12, 0.18, 0.08);
	rig.add(interior);
	const interiorFill = new PointLight(0x8ec0ff, 0.28, 3.1, 2);
	interiorFill.position.set(-0.22, -0.12, 0.16);
	rig.add(interiorFill);

	const nodeGeometry = new SphereGeometry(PRISM_NODE_CORE_RADIUS, 8, 8);
	const glowGeometry = new SphereGeometry(PRISM_NODE_GLOW_RADIUS, 10, 10);
	let nodeViews: NodeView[] = [];
	let links: PrismLink[] = [];
	let linkViews: LinkView[] = [];

	const pulse = new Mesh(
		new SphereGeometry(PRISM_NODE_CORE_RADIUS * 1.6, 8, 8),
		new MeshBasicMaterial({ color: new Color('#F5A524') }),
	);
	pulse.visible = false;
	rig.add(pulse);

	const world = new Vector3();
	const worldB = new Vector3();

	const buildNetwork = (width: number) => {
		for (const view of nodeViews) {
			rig.remove(view.mesh);
			rig.remove(view.glow);
			(view.mesh.material as MeshBasicMaterial).dispose();
			(view.glow.material as MeshBasicMaterial).dispose();
		}
		for (const view of linkViews) {
			rig.remove(view.mesh);
			rig.remove(view.glow);
			view.mesh.geometry.dispose();
			view.glow.geometry.dispose();
			(view.mesh.material as MeshBasicMaterial).dispose();
			(view.glow.material as MeshBasicMaterial).dispose();
		}

		const nodes: PrismNode[] = prismNodes(width);
		links = prismLinks(nodes);
		nodeViews = nodes.map((node) => {
			const material = new MeshBasicMaterial({ color: new Color(node.color) });
			const mesh = new Mesh(nodeGeometry, material);
			mesh.position.set(node.x, node.y, node.z);
			const glow = new Mesh(
				glowGeometry,
				new MeshBasicMaterial({
					color: new Color(node.color),
					transparent: true,
					opacity: PRISM_NODE_GLOW_OPACITY,
					depthWrite: false,
				}),
			);
			glow.position.copy(mesh.position);
			rig.add(mesh);
			rig.add(glow);
			return { mesh, glow, base: node.color };
		});

		linkViews = links.map((link, index) => {
			const a = nodes[link.a];
			const b = nodes[link.b];
			const base = prismLinkColor(index);
			const start = new Vector3(a?.x ?? 0, a?.y ?? 0, a?.z ?? 0);
			const end = new Vector3(b?.x ?? 0, b?.y ?? 0, b?.z ?? 0);
			const bow = a && b ? prismAxonControl(a, b, index) : { x: 0, y: 0, z: 0 };
			const curve = new QuadraticBezierCurve3(start, new Vector3(bow.x, bow.y, bow.z), end);
			const span = start.distanceTo(end);
			const mesh = new Mesh(
				new TubeGeometry(curve, 7, PRISM_LINK_RADIUS, 4, false),
				new MeshBasicMaterial({
					color: new Color(base),
					transparent: true,
					opacity: span > 0.62 ? 0.62 : 0.92,
					depthWrite: false,
				}),
			);
			const glow = new Mesh(
				new TubeGeometry(curve, 7, PRISM_LINK_GLOW_RADIUS, 4, false),
				new MeshBasicMaterial({
					color: new Color(base),
					transparent: true,
					opacity: PRISM_LINK_GLOW_OPACITY * (span > 0.62 ? 0.65 : 1),
					depthWrite: false,
				}),
			);
			rig.add(mesh);
			rig.add(glow);
			return { mesh, glow, base };
		});
	};

	buildNetwork(viewportWidth(win, surface));

	let cursor: HoverCursor = null;
	let reducedMotion = win.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
	let onScreen = true;
	let raf = 0;
	let looping = false;
	let builtFor = viewportWidth(win, surface);

	const measure = () => {
		const rect = surface.getBoundingClientRect?.();
		const width = rect?.width || surface.clientWidth || Number(surface.width) || 640;
		const height = rect?.height || surface.clientHeight || Number(surface.height) || 520;
		return { width, height };
	};

	const screenOf = (mesh: Mesh, width: number, height: number) => {
		mesh.getWorldPosition(world);
		world.project(camera);
		return {
			x: (world.x * 0.5 + 0.5) * width,
			y: (-world.y * 0.5 + 0.5) * height,
		};
	};

	const linkScreen = (a: Mesh, b: Mesh, width: number, height: number) => {
		a.getWorldPosition(world);
		b.getWorldPosition(worldB);
		world.set((world.x + worldB.x) / 2, (world.y + worldB.y) / 2, (world.z + worldB.z) / 2);
		world.project(camera);
		return {
			x: (world.x * 0.5 + 0.5) * width,
			y: (-world.y * 0.5 + 0.5) * height,
		};
	};

	const renderFrame = (timeMs: number) => {
		const { width, height } = measure();
		if (width < 2 || height < 2) return;

		const nextWidth = viewportWidth(win, surface);
		if (nextWidth !== builtFor && Math.abs(nextWidth - builtFor) > 48) {
			const previous = prismNodes(builtFor).length;
			const next = prismNodes(nextWidth).length;
			if (previous !== next) buildNetwork(nextWidth);
			builtFor = nextWidth;
		}

		const pixelRatio = Math.min(win.devicePixelRatio || 1, 2);
		renderer.setPixelRatio(pixelRatio);
		renderer.setSize(width, height, false);
		camera.aspect = width / height;
		camera.updateProjectionMatrix();

		const pose = prismCastPose(timeMs);
		rig.rotation.set(pose.rotation.x, pose.rotation.y, pose.rotation.z);
		rig.position.y = prismFloat(timeMs);
		floor.rotation.set(pose.shadow.x, pose.shadow.y, pose.shadow.z);
		floor.position.y = pose.floorY;
		scene.updateMatrixWorld(true);

		nodeViews.forEach((view) => {
			const point = screenOf(view.mesh, width, height);
			const color = prismHoverColor(point, view.base, cursor);
			(view.mesh.material as MeshBasicMaterial).color.set(color);
			(view.glow.material as MeshBasicMaterial).color.set(color);
		});
		linkViews.forEach((view, index) => {
			const link = links[index];
			const a = link ? nodeViews[link.a]?.mesh : undefined;
			const b = link ? nodeViews[link.b]?.mesh : undefined;
			if (!a || !b) return;
			const color = prismHoverColor(linkScreen(a, b, width, height), view.base, cursor);
			(view.mesh.material as MeshBasicMaterial).color.set(color);
			(view.glow.material as MeshBasicMaterial).color.set(color);
		});

		const phase = prismPulsePhase(timeMs);
		if (phase >= 0 && links.length > 0) {
			const index = prismPulseLinkIndex(timeMs, links.length);
			const link = links[index];
			const a = link ? nodeViews[link.a]?.mesh.position : null;
			const b = link ? nodeViews[link.b]?.mesh.position : null;
			if (a && b) {
				pulse.position.lerpVectors(a, b, phase);
				pulse.visible = true;
				const travel = ((timeMs % PRISM_PULSE_CYCLE_MS) + PRISM_PULSE_CYCLE_MS) % PRISM_PULSE_CYCLE_MS;
				pulse.scale.setScalar(0.75 + 0.35 * Math.sin(travel * 0.01));
			}
		} else {
			pulse.visible = false;
		}

		renderer.setClearColor(0x000000, 0);
		renderer.render(scene, camera);
	};

	const schedule = () => {
		if (looping || !prismMotionAllowed(reducedMotion, onScreen)) return;
		if (typeof win.requestAnimationFrame !== 'function') return;
		looping = true;
		raf = win.requestAnimationFrame(tick);
	};

	const stop = () => {
		if (raf && typeof win.cancelAnimationFrame === 'function') win.cancelAnimationFrame(raf);
		raf = 0;
		looping = false;
	};

	const tick = (timeMs: number) => {
		looping = false;
		if (!prismMotionAllowed(reducedMotion, onScreen)) return;
		renderFrame(timeMs);
		schedule();
	};

	const stage = surface.parentElement ?? surface;
	stage.addEventListener?.('pointermove', (event) => {
		const rect = surface.getBoundingClientRect();
		cursor = { x: event.clientX - rect.left, y: event.clientY - rect.top };
		if (!prismMotionAllowed(reducedMotion, onScreen)) renderFrame(0);
	});
	stage.addEventListener?.('pointerleave', () => {
		cursor = null;
		if (!prismMotionAllowed(reducedMotion, onScreen)) renderFrame(0);
	});

	const media = win.matchMedia?.('(prefers-reduced-motion: reduce)');
	media?.addEventListener?.('change', (event) => {
		reducedMotion = event.matches;
		if (prismMotionAllowed(reducedMotion, onScreen)) schedule();
		else {
			stop();
			renderFrame(0);
		}
	});

	if (typeof win.IntersectionObserver === 'function') {
		const observer = new win.IntersectionObserver((entries) => {
			onScreen = entries.some((entry) => entry.isIntersecting);
			if (prismMotionAllowed(reducedMotion, onScreen)) schedule();
			else stop();
		});
		observer.observe(surface);
	}

	win.addEventListener?.('resize', () => {
		if (!prismMotionAllowed(reducedMotion, onScreen)) renderFrame(0);
	});

	renderFrame(0);
	if (prismMotionAllowed(reducedMotion, onScreen)) schedule();
}

if (typeof document !== 'undefined' && typeof window !== 'undefined') {
	const start = () => bootHeroPrism();
	if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
	else start();
}
