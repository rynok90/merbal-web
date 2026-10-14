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
	SRGBColorSpace,
	Vector3,
	WebGLRenderer,
} from 'three';
import {
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

export const GLASS_TRANSMISSION = 0.9;
export const GLASS_ROUGHNESS = 0.04;

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

export function createGlassMaterial(): MeshPhysicalMaterial {
	return new MeshPhysicalMaterial({
		color: new Color('#ffffff'),
		metalness: 0,
		roughness: GLASS_ROUGHNESS,
		transmission: GLASS_TRANSMISSION,
		thickness: 0.28,
		ior: 1.5,
		transparent: true,
		opacity: 1,
		clearcoat: 1,
		clearcoatRoughness: 0.02,
		attenuationColor: new Color('#b7d7ff'),
		attenuationDistance: 3.2,
		envMapIntensity: 0.65,
		specularIntensity: 1,
	});
}

function studioEnvironment(renderer: WebGLRenderer) {
	const pmrem = new PMREMGenerator(renderer);
	const studio = new Scene();
	const room = new Mesh(new BoxGeometry(14, 14, 14), [
		new MeshBasicMaterial({ color: 0x07111f, side: BackSide }),
		new MeshBasicMaterial({ color: 0x0a1830, side: BackSide }),
		new MeshBasicMaterial({ color: 0x123056, side: BackSide }),
		new MeshBasicMaterial({ color: 0x04080f, side: BackSide }),
		new MeshBasicMaterial({ color: 0x0f766e, side: BackSide }),
		new MeshBasicMaterial({ color: 0x1d4ed8, side: BackSide }),
	]);
	studio.add(room);
	studio.add(new AmbientLight(0xffffff, 0.35));
	const key = new DirectionalLight(0xf4fbff, 1.4);
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

	scene.add(new AmbientLight(0xc5d7ee, 0.28));
	const sun = new DirectionalLight(0xffffff, 1.15);
	sun.position.set(2.4, 3.1, 4.2);
	scene.add(sun);
	const tealLight = new PointLight(0x14b8a6, 4, 12);
	tealLight.position.set(-1.7, 0.35, 1.6);
	scene.add(tealLight);
	const blueLight = new PointLight(0x2b8cff, 3.5, 12);
	blueLight.position.set(1.5, -0.4, 1.3);
	scene.add(blueLight);

	const camera = new PerspectiveCamera(32, 1, 0.1, 30);
	camera.position.set(1.45, 1.05, 4.35);
	camera.lookAt(0, 0, 0);

	const rig = new Group();
	scene.add(rig);

	const glass = new Mesh(new BoxGeometry(1.72, 1.72, 1.72), createGlassMaterial());
	glass.renderOrder = 2;
	rig.add(glass);

	const shell = new LineSegments(
		new EdgesGeometry(new BoxGeometry(1.72, 1.72, 1.72)),
		new LineBasicMaterial({ color: new Color('#e7f4ff'), transparent: true, opacity: 0.88 }),
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
					opacity: 0.22,
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
