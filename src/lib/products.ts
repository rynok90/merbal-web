export type ProductStatus = 'live' | 'soon';

export type ProductVertical = 'operacion-de-sitios' | 'negocios-de-servicio';

export type Product = {
	name: string;
	description: string;
	href: string | null;
	status: ProductStatus;
	vertical: ProductVertical;
	problem: string;
	audience: string;
	howItWorks: string;
};

export const SITE_OPS_VERTICAL = {
	slug: 'operacion-de-sitios' as const,
	href: '/plataformas/operacion-de-sitios',
	name: 'Operación de sitios',
	audience: 'Para planta, obra, facilities, hospital y corporativo.',
};

export const SERVICE_VERTICAL = {
	slug: 'negocios-de-servicio' as const,
	href: '/plataformas/negocios-de-servicio',
	name: 'Negocios de servicio',
	audience: 'Para PyME de servicio al público.',
};

export const PLATFORM_VERTICALS = [SITE_OPS_VERTICAL, SERVICE_VERTICAL] as const;

export const products: Product[] = [
	{
		name: 'SecureFlow CRM',
		description:
			'Gestión de clientes y operaciones para empresas de seguridad e integración.',
		href: 'https://secureflow-landing.netlify.app',
		status: 'live',
		vertical: 'operacion-de-sitios',
		problem:
			'Clientes, contratos y la operación del sitio se fragmentan entre hojas, chats y un CRM que no entiende el campo.',
		audience:
			'Empresas de seguridad, integración y facilities que operan planta, corporativo, hospital u obra.',
		howItWorks:
			'Centraliza clientes y operación del sitio en un tablero que ya corre. Un especialista ve el estado, no un archivo suelto.',
	},
	{
		name: 'Access Paperless',
		description:
			'Control de visitantes y contratistas con pase QR. De la bitácora de papel al acceso digital.',
		href: null,
		status: 'soon',
		vertical: 'operacion-de-sitios',
		problem:
			'La bitácora de papel no deja rastro útil: visitantes y contratistas entran y el cuaderno no escala.',
		audience:
			'Planta, obra, facilities, hospital y corporativo que reciben gente todos los días.',
		howItWorks:
			'Pase QR para visitantes y contratistas. De la bitácora de papel al registro digital del sitio.',
	},
	{
		name: 'ActivoObra',
		description: 'Control y visibilidad de activos físicos en sitio.',
		href: null,
		status: 'soon',
		vertical: 'operacion-de-sitios',
		problem:
			'Herramienta, equipo e inventario de sitio se pierden de vista: nadie sabe qué hay, quién lo tiene ni qué falta.',
		audience: 'Obra, planta y facilities que necesitan visibilidad de activos físicos en el sitio.',
		howItWorks:
			'Control y visibilidad de activos físicos en sitio: qué hay, dónde está y quién lo tiene.',
	},
	{
		name: 'ANUVÉ',
		description: 'Agenda, catálogo y overlay para nail bars. La clienta ve el diseño en su mano.',
		href: null,
		status: 'soon',
		vertical: 'negocios-de-servicio',
		problem:
			'Agenda, catálogo y diseño viven en islas: la clienta no ve el resultado en su mano hasta que ya está hecho.',
		audience: 'Nail bars y PyME de servicio al público.',
		howItWorks:
			'Agenda, catálogo y overlay. La clienta ve el diseño en su mano antes de decidir.',
	},
];

export function productsByVertical(vertical: ProductVertical): Product[] {
	return products.filter((product) => product.vertical === vertical);
}

export const siteOpsProducts = productsByVertical('operacion-de-sitios');
export const serviceBusinessProducts = productsByVertical('negocios-de-servicio');

const secureflow = products.find((product) => product.name === 'SecureFlow CRM');

export const SECUFLOW_CRM_URL = secureflow?.href ?? '';

export function productCtaLabel(product: Product): string {
	const firstWord = product.name.trim().split(/\s+/)[0] ?? product.name;
	return `Conocer ${firstWord}`;
}

export const SECUFLOW_CTA_LABEL = secureflow ? productCtaLabel(secureflow) : '';

export const customSoftware = {
	name: 'Desarrollo de software a la medida',
	description:
		'Cuando el producto no cubre el proceso: diseñamos, construimos y operamos la plataforma que tu operación necesita.',
	href: '/contacto',
} as const;

export function liveProductHref(product: Product): string | null {
	return product.status === 'live' && product.href ? product.href : null;
}
