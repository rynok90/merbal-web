import {
	AmbientLight,
	BackSide,
	BoxGeometry,
	Color,
	CylinderGeometry,
	DirectionalLight,
	EdgesGeometry,
	Group,
	LineBasicMaterial,
	LineSegments,
	Mesh,
	MeshBasicMaterial,
	MeshPhysicalMaterial,
	NoToneMapping,
	PMREMGenerator,
	PerspectiveCamera,
	PointLight,
	Scene,
	SphereGeometry,
	ShaderChunk,
	SRGBColorSpace,
	Vector3,
	WebGLRenderer,
} from 'three';
import {
	PRISM_CUBE_SIZE,
	PRISM_PULSE_CYCLE_MS,
	idleRotation,
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

export const GLASS_TRANSMISSION = 0.92;
export const GLASS_ROUGHNESS = 0.08;
export const GLASS_THICKNESS = 0.8;
export const GLASS_IOR = 1.5;
export const GLASS_CLEARCOAT = 0.4;

type HoverCursor = { x: number; y: number } | null;

type NodeView = {
	mesh: Mesh;
	glow: Mesh;
	base: string;
};

type LinkView = {
	mesh: Mesh;
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
		'material.transmissionAlpha = mix( 0.04, 0.45, glassFresnel );',
	].join('\n\t');
	const pars = patchTransmissionShader(ShaderChunk.transmission_pars_fragment);
	const fragment = ShaderChunk.transmission_fragment.replace(mixLine, fresnelAlpha);
	return source
		.replace('#include <transmission_pars_fragment>', pars)
		.replace('#include <transmission_fragment>', fragment);
}

export function createGlassMaterial(): MeshPhysicalMaterial {
	const material = new MeshPhysicalMaterial({
		color: new Color('#ffffff'),
		metalness: 0,
		roughness: GLASS_ROUGHNESS,
		transmission: GLASS_TRANSMISSION,
		thickness: GLASS_THICKNESS,
		ior: GLASS_IOR,
		transparent: true,
		opacity: 1,
		clearcoat: GLASS_CLEARCOAT,
		clearcoatRoughness: 0.03,
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
	const rim = new DirectionalLight(0x9fd0ff, 0.45);
	rim.position.set(-2.2, 1.4, -1.5);
	scene.add(rim);

	const camera = new PerspectiveCamera(32, 1, 0.1, 30);
	camera.position.set(1.45, 1.05, 4.35);
	camera.lookAt(0, 0, 0);

	const rig = new Group();
	scene.add(rig);

	const glass = new Mesh(new BoxGeometry(PRISM_CUBE_SIZE, PRISM_CUBE_SIZE, PRISM_CUBE_SIZE), createGlassMaterial());
	glass.renderOrder = 2;
	rig.add(glass);

	const shell = new LineSegments(
		new EdgesGeometry(new BoxGeometry(PRISM_CUBE_SIZE, PRISM_CUBE_SIZE, PRISM_CUBE_SIZE)),
		new LineBasicMaterial({ color: new Color('#d7ecff'), transparent: true, opacity: 0.55 }),
	);
	rig.add(shell);

	const nodeGeometry = new SphereGeometry(0.046, 16, 16);
	const glowGeometry = new SphereGeometry(0.09, 12, 12);
	let nodeViews: NodeView[] = [];
	let links: PrismLink[] = [];
	let linkViews: LinkView[] = [];

	const pulse = new Mesh(
		new SphereGeometry(0.07, 14, 14),
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
			view.mesh.geometry.dispose();
			(view.mesh.material as MeshBasicMaterial).dispose();
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
					opacity: 0.45,
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
			if (!a || !b) {
				const mesh = new Mesh(new CylinderGeometry(0.008, 0.008, 0.001, 4), new MeshBasicMaterial({ color: base }));
				rig.add(mesh);
				return { mesh, base };
			}
			const start = new Vector3(a.x, a.y, a.z);
			const end = new Vector3(b.x, b.y, b.z);
			const direction = new Vector3().subVectors(end, start);
			const length = Math.max(0.001, direction.length());
			const mesh = new Mesh(
				new CylinderGeometry(0.008, 0.008, length, 6),
				new MeshBasicMaterial({ color: new Color(base) }),
			);
			mesh.position.copy(start).add(end).multiplyScalar(0.5);
			mesh.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), direction.normalize());
			rig.add(mesh);
			return { mesh, base };
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

		const rotation = idleRotation(timeMs);
		rig.rotation.set(rotation.x, rotation.y, rotation.z);
		rig.position.y = prismFloat(timeMs);
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
