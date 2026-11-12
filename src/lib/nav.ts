export type NavLink = {
	href: string;
	label: string;
	children?: NavLink[];
};

export const HEADER_NAV: NavLink[] = [
	{
		href: '/plataformas/',
		label: 'Plataformas',
		children: [
			{ href: '/plataformas/operacion-de-sitios/', label: 'Operación de sitios' },
			{ href: '/plataformas/negocios-de-servicio/', label: 'Negocios de servicio' },
		],
	},
	{
		href: '#',
		label: 'Integración',
		children: [
			{ href: '/seguridad-electronica/', label: 'Seguridad electrónica' },
			{ href: '/infraestructura-de-red/', label: 'Infraestructura de red' },
		],
	},
	{ href: '/contacto/', label: 'Contacto' },
];

export const FOOTER_LINKS: NavLink[] = [
	{ href: '/plataformas/', label: 'Plataformas' },
	{ href: '/nosotros/', label: 'Nosotros' },
	{ href: '/contacto/', label: 'Contacto' },
];

export const NAV_LINKS = HEADER_NAV;

export const CONTACT_PATH = '/contacto/';

export const HEADER_CTA_LABEL = 'Solicitar asesoría';

export const ROUTES = [
	'/',
	'/plataformas/',
	'/plataformas/operacion-de-sitios/',
	'/plataformas/negocios-de-servicio/',
	'/nosotros/',
	'/contacto/',
] as const;

function pathWithoutSlash(path: string): string {
	const bare = path.split('?')[0]?.split('#')[0] || '/';
	if (bare === '/' || bare === '') return '/';
	return bare.endsWith('/') ? bare.slice(0, -1) : bare;
}

export function isActivePath(currentPath: string, href: string): boolean {
	if (!href || href === '#') return false;
	const current = pathWithoutSlash(currentPath);
	const target = pathWithoutSlash(href);
	if (target === '/') return current === '/';
	return current === target || current.startsWith(`${target}/`);
}
