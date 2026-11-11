import { FAQS } from './faq.ts';
import { SOLUTIONS } from './home-solutions.ts';
import { CONTACT_EMAIL } from './mailto.ts';

export const SITE = 'https://merbal.lat';
export const OG_IMAGE_PATH = '/og/home.png';
export const OG_IMAGE = `${SITE}${OG_IMAGE_PATH}`;
export const OG_IMAGE_ALT = 'MERBAL. Desarrollamos el software. Integramos la tecnología.';
export const SLOGAN = 'Desarrollamos el software. Integramos la tecnología.';
export const SUBTITLE =
	'Software a la medida y plataformas propias, más seguridad electrónica e infraestructura de red para que tu empresa opere mejor.';

export const DESCRIPTION_MAX = 155;

export type PageSeo = {
	title: string;
	description: string;
};

export const PAGE_SEO: Record<string, PageSeo> = {
	'/': {
		title: 'MERBAL — Desarrollamos el software. Integramos la tecnología.',
		description: SUBTITLE,
	},
	'/plataformas': {
		title: 'Plataformas — MERBAL',
		description:
			'Plataformas propias para operar el sitio y el negocio, y desarrollo a la medida cuando el producto no cubre el proceso.',
	},
	'/plataformas/operacion-de-sitios': {
		title: 'Operación de sitios — MERBAL',
		description:
			'Para quien opera un sitio físico: control de visitantes, acceso por zonas y visibilidad de activos en el sitio.',
	},
	'/plataformas/negocios-de-servicio': {
		title: 'Negocios de servicio — MERBAL',
		description:
			'Para quien atiende clientes de a pie — clínica, salón u otro negocio de servicio: agenda, catálogo y expediente.',
	},
	'/nosotros': {
		title: 'Nosotros — MERBAL',
		description:
			'Empresa mexicana y casa de plataformas. Diagnóstico, diseño, implementación y acompañamiento, con criterio de ingeniería.',
	},
	'/contacto': {
		title: 'Contacto — MERBAL',
		description:
			'Pide una demo o una asesoría. Cuéntanos la división, el sitio o el sistema. soporte@merbal.lat',
	},
	'/seguridad-electronica': {
		title: 'Seguridad electrónica — MERBAL',
		description:
			'Video inteligente, control de acceso y detección como sistema, no como catálogo de equipos. MERBAL lo integra en el sitio.',
	},
	'/infraestructura-de-red': {
		title: 'Infraestructura de red — MERBAL',
		description:
			'La red que sostiene la operación: WiFi, fibra, cableado estructurado, equipo activo y continuidad, pensada para disponibilidad.',
	},
	'/privacidad': {
		title: 'Aviso de privacidad — MERBAL',
		description:
			'Aviso de privacidad de MERBAL Technologies: datos del formulario de contacto, su finalidad y los derechos ARCO.',
	},
};

export type JsonLdNode = Record<string, unknown>;

const ORG_ID = `${SITE}/#organization`;
const PAPERLESS_ID = `${SITE}/#ecosistema-paperless`;

const PAPERLESS_IDS = new Set(['access', 'obras', 'safe', 'ruta', 'inte']);

/** URLs que el sitio ya publica para cada marca. */
const PRODUCT_URL: Record<string, string> = {
	access: 'https://access.merbal.lat/access-paperless/',
	obras: 'https://access.merbal.lat/obras-paperless/',
	safe: 'https://access.merbal.lat/safe-access/',
	ruta: 'https://access.merbal.lat/#modulos',
	inte: 'https://access.merbal.lat/#modulos',
	anuve: 'https://anuve.merbal.lat/',
	consola: `${SITE}/#sol-consola`,
	guard: `${SITE}/#sol-guard`,
};

export function pageSeo(pathname: string): PageSeo {
	const key = normalizePath(pathname);
	const seo = PAGE_SEO[key];
	if (!seo) throw new Error(`Missing SEO for ${pathname}`);
	return seo;
}

export function canonicalFor(pathname: string): string {
	const path = normalizePath(pathname);
	if (path === '/') return `${SITE}/`;
	return `${SITE}${path}/`;
}

export function organizationNode(): JsonLdNode {
	return {
		'@type': 'Organization',
		'@id': ORG_ID,
		name: 'MERBAL',
		alternateName: 'MERBAL Technologies',
		url: `${SITE}/`,
		logo: `${SITE}/images/logo-mark.png`,
		email: CONTACT_EMAIL,
	};
}

export function websiteNode(): JsonLdNode {
	return {
		'@type': 'WebSite',
		'@id': `${SITE}/#website`,
		name: 'MERBAL',
		url: `${SITE}/`,
		inLanguage: 'es-MX',
		description: SUBTITLE,
		publisher: { '@id': ORG_ID },
	};
}

export function catalogGraph(): JsonLdNode[] {
	const paperless: JsonLdNode = {
		'@type': 'SoftwareApplication',
		'@id': PAPERLESS_ID,
		name: 'Ecosistema Paperless',
		applicationCategory: 'BusinessApplication',
		description:
			'El ecosistema Paperless, con sus cinco módulos juntos: Access, Obras, Safe Access, Ruta e Integridad.',
		url: `${SITE}/#plataformas`,
		provider: { '@id': ORG_ID },
	};

	const products = SOLUTIONS.map((sol) => {
		const name = productName(sol.id, sol.title);
		const section = `${SITE}/#sol-${sol.id}`;
		const url = PRODUCT_URL[sol.id] ?? section;
		const node: JsonLdNode = {
			'@type': 'SoftwareApplication',
			'@id': section,
			name,
			applicationCategory: 'BusinessApplication',
			description: sol.phrase,
			url,
			provider: { '@id': ORG_ID },
		};
		if (url !== section) node.sameAs = section;
		if (PAPERLESS_IDS.has(sol.id)) {
			node.isPartOf = { '@id': PAPERLESS_ID, '@type': 'SoftwareApplication', name: 'Ecosistema Paperless' };
		}
		return node;
	});

	return [paperless, ...products, customSoftwareService(), homeSecurityService(), homeNetworkService(), faqNode()];
}

export function securityPageService(): JsonLdNode {
	return {
		'@type': 'Service',
		'@id': `${SITE}/seguridad-electronica#service`,
		name: 'Seguridad electrónica',
		serviceType: 'Seguridad electrónica',
		url: `${SITE}/seguridad-electronica/`,
		description:
			'Diseñamos la capa de seguridad del sitio como sistema: video inteligente, control de acceso, detección, audio IP y detección de incendio. No partimos de marcas.',
		provider: { '@id': ORG_ID },
		audience: {
			'@type': 'Audience',
			audienceType:
				'planta, retail, hospital, educación, corporativo, hospitality y cualquier sitio que necesite control real.',
		},
	};
}

export function networkPageService(): JsonLdNode {
	return {
		'@type': 'Service',
		'@id': `${SITE}/infraestructura-de-red#service`,
		name: 'Infraestructura de red',
		serviceType: 'Infraestructura de red',
		url: `${SITE}/infraestructura-de-red/`,
		description:
			'Si cae el enlace, cae la operación. Diseñamos la red para disponibilidad, no para el catálogo del proveedor.',
		provider: { '@id': ORG_ID },
		audience: {
			'@type': 'Audience',
			audienceType:
				'industrial, retail, hospital, educación, corporativo y cualquier operación que no se puede quedar sin red.',
		},
	};
}

export function baseGraph(extra: JsonLdNode[] = []): JsonLdNode[] {
	return [organizationNode(), websiteNode(), ...extra];
}

export function jsonLd(nodes: JsonLdNode[]): string {
	return JSON.stringify({ '@context': 'https://schema.org', '@graph': nodes }).replace(/</g, '\\u003c');
}

function customSoftwareService(): JsonLdNode {
	return {
		'@type': 'Service',
		'@id': `${SITE}/#medida`,
		name: 'Software a la medida',
		serviceType: 'Desarrollo de software a la medida',
		url: `${SITE}/#medida`,
		description:
			'Si tu operación no cabe en una plantilla, la construimos contigo. Un proceso, una integración, un sistema que te queda.',
		provider: { '@id': ORG_ID },
	};
}

function homeSecurityService(): JsonLdNode {
	return {
		'@type': 'Service',
		'@id': `${SITE}/#seguridad`,
		name: 'Seguridad electrónica',
		serviceType: 'Seguridad electrónica',
		url: `${SITE}/#seguridad`,
		description:
			'Seguridad electrónica para el sitio que necesita cubrir el perímetro: drones, cámaras, detección y aviso. Se integran cuando el software no basta.',
		provider: { '@id': ORG_ID },
	};
}

function homeNetworkService(): JsonLdNode {
	return {
		'@type': 'Service',
		'@id': `${SITE}/#red`,
		name: 'Infraestructura de red',
		serviceType: 'Infraestructura de red',
		url: `${SITE}/#red`,
		description:
			'Infraestructura de red del sitio: cable, fibra, racks y el enlace inalámbrico. Para que el software y el sitio tengan de dónde apoyarse.',
		provider: { '@id': ORG_ID },
	};
}

function faqNode(): JsonLdNode {
	return {
		'@type': 'FAQPage',
		'@id': `${SITE}/#faq`,
		url: `${SITE}/#preguntas`,
		mainEntity: FAQS.map((item) => ({
			'@type': 'Question',
			name: item.question,
			acceptedAnswer: {
				'@type': 'Answer',
				text: item.answer,
			},
		})),
	};
}

function productName(id: string, title: string): string {
	if (id === 'anuve') return 'Anuvé';
	if (id === 'guard') return 'Guardias';
	return title;
}

function normalizePath(pathname: string): string {
	const path = pathname.split('?')[0]?.split('#')[0] || '/';
	if (path === '/' || path === '') return '/';
	return path.endsWith('/') ? path.slice(0, -1) : path;
}
