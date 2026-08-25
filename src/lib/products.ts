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
		href: 'https://secureflow-crm-production.up.railway.app',
		status: 'live',
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

export const customSoftware = {
	name: 'Desarrollo de software a la medida',
	description:
		'Cuando el producto no cubre el proceso: diseñamos, construimos y operamos la plataforma que tu operación necesita.',
	href: '/contacto',
} as const;

export function liveProductHref(product: Product): string | null {
	return product.status === 'live' && product.href ? product.href : null;
}
