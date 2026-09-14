export type ProductStatus = 'live' | 'soon';

export type Product = {
	name: string;
	description: string;
	href: string | null;
	status: ProductStatus;
};

export const products: Product[] = [
	{
		name: 'SecureFlow CRM',
		description:
			'Gestión de clientes y operaciones para empresas de seguridad e integración.',
		href: 'https://secureflow-landing.netlify.app',
		status: 'live',
	},
	{
		name: 'Access Paperless',
		description:
			'Control de visitantes y contratistas con pase QR. De la bitácora de papel al acceso digital.',
		href: null,
		status: 'soon',
	},
	{
		name: 'ANUVÉ',
		description: 'Agenda, catálogo y overlay para nail bars. La clienta ve el diseño en su mano.',
		href: null,
		status: 'soon',
	},
	{
		name: 'HayStock',
		description: 'Bot de inventario por WhatsApp orientado a refaccionarias y comercios.',
		href: null,
		status: 'soon',
	},
	{
		name: 'RutaSegura',
		description: 'Solución en desarrollo para operación y seguimiento en campo.',
		href: null,
		status: 'soon',
	},
];

export const SECUFLOW_CRM_URL = products[0]?.href ?? '';

export function productCtaLabel(product: Product): string {
	const firstWord = product.name.trim().split(/\s+/)[0] ?? product.name;
	return `Conocer ${firstWord}`;
}

export const SECUFLOW_CTA_LABEL = products[0] ? productCtaLabel(products[0]) : '';

export const customSoftware = {
	name: 'Desarrollo de software a la medida',
	description:
		'Cuando el producto no cubre el proceso: diseñamos, construimos y operamos la plataforma que tu operación necesita.',
	href: '/contacto',
} as const;

export function liveProductHref(product: Product): string | null {
	return product.status === 'live' && product.href ? product.href : null;
}
