export type NavLink = {
	href: string;
	label: string;
	children?: NavLink[];
};

export const HEADER_NAV: NavLink[] = [
	{ href: '/seguridad-electronica', label: 'Seguridad electrónica' },
	{ href: '/infraestructura-de-red', label: 'Infraestructura de red' },
	{
		href: '/plataformas',
		label: 'Plataformas',
		children: [
			{ href: '/plataformas/operacion-de-sitios', label: 'Operación de sitios' },
			{ href: '/plataformas/negocios-de-servicio', label: 'Negocios de servicio' },
		],
	},
	{ href: '/contacto', label: 'Contacto' },
];

export const FOOTER_LINKS: NavLink[] = [
	{ href: '/seguridad-electronica', label: 'Seguridad electrónica' },
	{ href: '/infraestructura-de-red', label: 'Infraestructura de red' },
	{ href: '/plataformas', label: 'Plataformas' },
	{ href: '/nosotros', label: 'Nosotros' },
	{ href: '/contacto', label: 'Contacto' },
];

export const NAV_LINKS = HEADER_NAV;

export const CONTACT_PATH = '/contacto';

export const HEADER_CTA_LABEL = 'Solicitar asesoría';

export const ROUTES = [
	'/',
	'/seguridad-electronica',
	'/infraestructura-de-red',
	'/plataformas',
	'/plataformas/operacion-de-sitios',
	'/plataformas/negocios-de-servicio',
	'/nosotros',
	'/contacto',
] as const;

export function isActivePath(currentPath: string, href: string): boolean {
	if (href === '/') return currentPath === '/';
	return currentPath === href || currentPath.startsWith(`${href}/`);
}
