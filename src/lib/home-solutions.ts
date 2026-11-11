export type ReelImage = {
	src: string;
	alt: string;
	width: number;
	height: number;
};

export type ReelSlide = {
	cap: string;
	alt: string;
	tone?: 'bone' | 'ink';
	family?: string;
	src?: string;
	width?: number;
	height?: number;
	eager?: boolean;
	variant?: 'caseta' | 'safe' | 'integridad' | 'medida' | 'campo';
	pair?: ReelImage[];
};

export type Solution = {
	id: string;
	group: string;
	indexLabel: string;
	kicker: string;
	title: string;
	phrase: string;
	points: string[];
	logo?: boolean;
	cta: { label: string; href: string };
	slides: ReelSlide[];
};

export type IxItem = {
	id: string;
	title: string;
	text: string;
	icon: string;
	src?: string;
	width?: number;
	height?: number;
	alt?: string;
	video?: string;
	poster?: string;
};

export type ContactOption = {
	value: string;
	label: string;
	division?: 'Desarrollo' | 'Seguridad electrónica' | 'Infraestructura de red';
};

/** Ruta e Integridad no tienen página propia. La sección publicada más cercana es el índice de módulos. */
const MODULOS = 'https://access.merbal.lat/#modulos';

function shot(
	cap: string,
	src: string,
	width: number,
	height: number,
	tone: 'bone' | 'ink' = 'bone',
): ReelSlide {
	return { cap, alt: cap, src, width, height, tone };
}

function icon(body: string): string {
	return `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
}

export const HERO_SLIDES: ReelSlide[] = [
	{
		...shot('Access · Tablero', '/home/capturas/access-inicio.webp', 1600, 900),
		family: 'Paperless',
		eager: true,
	},
	{
		...shot('Anuvé · Agenda', '/home/capturas/anuve-agenda-local.webp', 1600, 904, 'ink'),
		family: 'Anuvé',
	},
	{
		...shot('Consola · Tablero', '/home/capturas/consola-tablero.webp', 1440, 900, 'ink'),
		family: 'Consola',
	},
	{
		cap: 'Software a la medida',
		alt: 'Software a la medida',
		family: 'A la medida',
		tone: 'bone',
		variant: 'medida',
	},
	{
		cap: 'Seguridad y red',
		alt: 'Seguridad electrónica e infraestructura de red',
		family: 'Seguridad y red',
		tone: 'ink',
		variant: 'campo',
		pair: [
			{
				src: '/home/fotos/camaras-unsplash-1557597774.webp',
				alt: 'Muro de cámaras',
				width: 1600,
				height: 1076,
			},
			{
				src: '/home/fotos/racks-pexels-4508751.webp',
				alt: 'Pasillo de racks',
				width: 1200,
				height: 800,
			},
		],
	},
];

export const SOLUTIONS: Solution[] = [
	{
		id: 'access',
		group: 'Ecosistema Paperless',
		indexLabel: 'Access',
		kicker: 'Ecosistema Paperless',
		title: 'Access',
		phrase: 'Controla quién entra y quién sale, con credencial QR y caseta en el sitio.',
		points: [
			'La caseta lee el QR y registra la entrada o la salida.',
			'Ves quién está dentro de la planta en este momento.',
			'Una sola credencial para personal, visitas y el día a día.',
		],
		cta: { label: 'Ver Access', href: 'https://access.merbal.lat/access-paperless/' },
		slides: [
			shot('Access · Tablero', '/home/capturas/access-inicio.webp', 1600, 900),
			{ cap: 'Access · Caseta', alt: 'Access · Caseta', variant: 'caseta', tone: 'ink' },
		],
	},
	{
		id: 'obras',
		group: 'Ecosistema Paperless',
		indexLabel: 'Obras',
		kicker: 'Ecosistema Paperless',
		title: 'Obras',
		phrase: 'El sitio, el personal y la app, en el mismo recorrido.',
		points: [
			'Tablero del día en la obra.',
			'Mapa de sitios con geocerca.',
			'La app para marcar dentro del radio.',
		],
		cta: { label: 'Ver Obras', href: 'https://access.merbal.lat/obras-paperless/' },
		slides: [
			shot('Obras · Tablero', '/home/capturas/obras-tablero.webp', 1454, 938),
			shot('Obras · Mapa', '/home/capturas/obras-mapa.webp', 1452, 736),
			shot('Obras · App', '/home/capturas/obras-app.webp', 1600, 700),
		],
	},
	{
		id: 'safe',
		group: 'Ecosistema Paperless',
		indexLabel: 'Safe Access',
		kicker: 'Ecosistema Paperless',
		title: 'Safe Access',
		phrase: 'La casa invita y se entera cuando llega la visita.',
		points: [
			'El anfitrión envía el QR al celular de quien viene.',
			'Un aviso cuando la visita está en caseta.',
			'Pensado para privadas y residenciales.',
		],
		cta: { label: 'Ver Safe Access', href: 'https://access.merbal.lat/safe-access/' },
		slides: [{ cap: 'Safe Access · Aviso', alt: 'Safe Access · Aviso', variant: 'safe', tone: 'bone' }],
	},
	{
		id: 'ruta',
		group: 'Ecosistema Paperless',
		indexLabel: 'Ruta',
		kicker: 'Ecosistema Paperless',
		title: 'Ruta',
		phrase: 'El recorrido en vivo: tablero, mapa y check-in en el sitio.',
		points: [
			'Tablero en vivo del recorrido.',
			'Mapa con la ruta y las geocercas.',
			'Check-in al llegar al punto.',
		],
		cta: { label: 'Ver Ruta', href: MODULOS },
		slides: [
			shot('Ruta · Tablero', '/home/capturas/ruta-vivo.webp', 1600, 900),
			shot('Ruta · Mapa', '/home/capturas/ruta-mapa.webp', 1600, 900),
			shot('Ruta · Check-in', '/home/capturas/ruta-checkin.webp', 1600, 900),
		],
	},
	{
		id: 'inte',
		group: 'Ecosistema Paperless',
		indexLabel: 'Integridad',
		kicker: 'Ecosistema Paperless',
		title: 'Integridad',
		phrase: 'Los registros se encadenan y se sellan, para que un cambio se note.',
		points: [
			'Cada registro queda ligado al anterior.',
			'Un sello cierra la cadena.',
			'Si alguien altera un registro, la cadena lo hace visible.',
		],
		cta: { label: 'Ver Integridad', href: MODULOS },
		slides: [{ cap: 'Integridad', alt: 'Integridad', variant: 'integridad', tone: 'bone' }],
	},
	{
		id: 'anuve',
		group: 'Anuvé',
		indexLabel: 'Anuvé',
		kicker: 'Anuvé',
		title: 'Belleza y barbería, en su sitio.',
		phrase: 'La agenda, la silla, la tienda y los estilos. Para salones y barberías.',
		points: [
			'La agenda del día, en belleza y en barbería.',
			'La silla y la ficha de quien se atiende.',
			'Tienda y estilos, en la misma casa.',
		],
		logo: true,
		cta: { label: 'Ver Anuvé', href: 'https://anuve.merbal.lat/' },
		slides: [
			shot('Anuvé · Agenda', '/home/capturas/anuve-agenda-local.webp', 1600, 904, 'ink'),
			shot('Barbería · La silla', '/home/capturas/anuve-silla.webp', 1600, 796, 'ink'),
			shot('Belleza · Tienda', '/home/capturas/anuve-tienda-clienta-390.webp', 780, 1688),
			shot('Barbería · Estilos', '/home/capturas/anuve-estilos.webp', 1600, 978, 'ink'),
		],
	},
	{
		id: 'consola',
		group: 'Consola empresarial',
		indexLabel: 'Consola empresarial',
		kicker: 'Consola empresarial',
		title: 'Consola empresarial',
		phrase: 'Cotizaciones y bitácora, en el tablero de la operación.',
		points: [
			'El tablero reúne el día de la operación.',
			'De la lista de cotizaciones a una nueva.',
			'La bitácora deja constancia de lo que se hizo.',
		],
		cta: { label: 'Pedir informes', href: '/?solucion=consola-empresarial#contacto' },
		slides: [
			shot('Consola · Tablero', '/home/capturas/consola-tablero.webp', 1440, 900, 'ink'),
			shot('Consola · Cotizaciones', '/home/capturas/consola-cotizaciones.webp', 1440, 900, 'ink'),
			shot('Consola · Nueva cotización', '/home/capturas/consola-nueva.webp', 1440, 900, 'ink'),
			shot('Consola · Bitácora', '/home/capturas/consola-bitacora.webp', 1440, 900, 'ink'),
		],
	},
	{
		id: 'guard',
		group: 'Consola empresarial',
		indexLabel: 'Guardias (módulo, también extra de la Consola)',
		kicker: 'Consola empresarial',
		title: 'Guardias',
		phrase: 'Módulo que se contrata solo o como extra de la Consola. Rondil es su aplicación móvil.',
		points: [
			'El guardia recorre los puntos de la ronda.',
			'En el celular, Rondil va marcando cada punto.',
			'Se suma cuando la operación lo pide, no viene de oficio.',
		],
		cta: { label: 'Pedir informes', href: '/?solucion=guardias#contacto' },
		slides: [shot('Guardias · Rondines', '/home/capturas/guardias-ronda.webp', 1600, 1000, 'ink')],
	},
];

export const CUSTOM_EXAMPLES = [
	{
		title: 'Tienda en línea',
		text: 'Catálogo y app para una marca de ropa: ver, elegir y pedir.',
	},
	{
		title: 'Asistencia en obra',
		text: 'Quién llegó al sitio y cuánto tiempo permanece.',
	},
	{
		title: 'Portal y cotizador',
		text: 'El cliente consulta, pide y recibe su cotización en el mismo lugar.',
	},
	{
		title: 'Inventario y punto de venta',
		text: 'Existencias y venta en mostrador, en un solo sistema.',
	},
	{
		title: 'App de citas',
		text: 'Agenda, recordatorio y la ficha de quien atiende.',
	},
	{
		title: 'Tableros de operación',
		text: 'Lo que el equipo necesita ver para decidir el día.',
	},
];

export const NDA_NOTE = 'Por confidencialidad (NDA) no mostramos los proyectos de clientes.';

export const CONTACT_OPTIONS: ContactOption[] = [
	{ value: '', label: 'Contacto general' },
	{ value: 'access', label: 'Access', division: 'Desarrollo' },
	{ value: 'obras', label: 'Obras', division: 'Desarrollo' },
	{ value: 'safe-access', label: 'Safe Access', division: 'Desarrollo' },
	{ value: 'ruta', label: 'Ruta', division: 'Desarrollo' },
	{ value: 'integridad', label: 'Integridad', division: 'Desarrollo' },
	{ value: 'anuve', label: 'Anuvé', division: 'Desarrollo' },
	{ value: 'consola-empresarial', label: 'Consola empresarial', division: 'Desarrollo' },
	{ value: 'guardias', label: 'Guardias', division: 'Desarrollo' },
	{ value: 'software-a-la-medida', label: 'Software a la medida', division: 'Desarrollo' },
	{ value: 'seguridad-electronica', label: 'Seguridad electrónica', division: 'Seguridad electrónica' },
	{ value: 'infraestructura-de-red', label: 'Infraestructura de red', division: 'Infraestructura de red' },
];

export const SECURITY_ITEMS: IxItem[] = [
	{
		id: 'drones',
		title: 'Drones',
		text: 'Recorrido aéreo del perímetro y del sitio.',
		icon: icon('<circle cx="5" cy="6" r="2.1"/><circle cx="19" cy="6" r="2.1"/><circle cx="5" cy="18" r="2.1"/><circle cx="19" cy="18" r="2.1"/><path d="M7 7.4 10.6 11M17 7.4 13.4 11M7 16.6 10.6 13M17 16.6 13.4 13"/><rect x="10.2" y="10.2" width="3.6" height="3.6" rx="0.8"/>'),
		video: '/home/fotos/dron-pexels-4446463.mp4',
		poster: '/home/fotos/dron-pexels-4446463-poster.jpg',
		width: 1280,
		height: 720,
		alt: 'Dron en vuelo',
	},
	{
		id: 'antidrones',
		title: 'Antidrones',
		text: 'Detección de un dron que no debería estar sobre el sitio.',
		icon: icon('<circle cx="12" cy="12" r="8"/><path d="M7.2 7.2 16.8 16.8"/>'),
		src: '/home/fotos/dron-pexels-442587.webp',
		width: 1200,
		height: 800,
		alt: 'Silueta de un dron contra el cielo',
	},
	{
		id: 'analiticos',
		title: 'Analíticos de video',
		text: 'El sistema avisa cuando pasa lo que definiste.',
		icon: icon('<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M8 20h8M12 16v4M7 9h4M7 12h7"/>'),
		src: '/home/fotos/analitica-unsplash-158109279536.webp',
		width: 900,
		height: 1350,
		alt: 'Sala de monitoreo con varias pantallas',
	},
	{
		id: 'camaras',
		title: 'Cámaras con inteligencia artificial',
		text: 'La cámara distingue, no solo graba.',
		icon: icon('<path d="M4 8h11l3-2.5v13L15 16H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z"/><circle cx="9" cy="12" r="2"/>'),
		src: '/home/fotos/camaras-unsplash-1557597774.webp',
		width: 1600,
		height: 1076,
		alt: 'Muro de cámaras',
	},
	{
		id: 'acceso',
		title: 'Control de acceso',
		text: 'Quién cruza una puerta, con registro.',
		icon: icon('<rect x="6" y="3" width="12" height="18" rx="1.5"/><path d="M12 12h.01M9 3v18"/>'),
		src: '/home/fotos/acceso-unsplash-1558002038.webp',
		width: 1200,
		height: 1738,
		alt: 'Lector en una puerta',
	},
	{
		id: 'incendio',
		title: 'Detección de incendio',
		text: 'Aviso temprano en el punto, ligado al sitio.',
		icon: icon('<path d="M12 21a5 5 0 0 0 3.2-8.8C14 9 12 7 12 4c-2 2.4-4 4.6-4 8a5 5 0 0 0 4 9Z"/>'),
	},
	{
		id: 'audio',
		title: 'Audio IP',
		text: 'Voz en el punto: aviso e intercomunicación sobre la red.',
		icon: icon('<path d="M5 10v4h3l4 3V7L8 10H5Z"/><path d="M16 9.5a3.5 3.5 0 0 1 0 5M18 7a6.5 6.5 0 0 1 0 10"/>'),
	},
	{
		id: 'alarma',
		title: 'Alarmas de intrusión',
		text: 'El perímetro avisa cuando alguien lo cruza.',
		icon: icon('<path d="M6 16V10a6 6 0 0 1 12 0v6"/><path d="M4 16h16v2H4zM10 18a2 2 0 0 0 4 0"/>'),
		src: '/home/fotos/perimetro-pexels-96612.webp',
		width: 1200,
		height: 800,
		alt: 'Cámaras de perímetro sobre un poste',
	},
	{
		id: 'iot',
		title: 'IoT',
		text: 'Sensores del sitio, en la misma red que el resto.',
		icon: icon('<circle cx="6" cy="12" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="18" cy="18" r="2"/><path d="M8 12h6M16.2 7.4 8.8 11M16.2 16.6 8.8 13"/>'),
		src: '/home/fotos/iot-unsplash-1558346490.webp',
		width: 900,
		height: 600,
		alt: 'Placas y cableado de un sensor',
	},
];

export const NETWORK_ITEMS: IxItem[] = [
	{
		id: 'cableado',
		title: 'Cableado estructurado',
		text: 'El punto de datos, ordenado y etiquetado.',
		icon: icon('<path d="M4 8h6v8H4zM14 8h6v8h-6z"/><path d="M10 12h4"/>'),
		src: '/home/fotos/cableado-unsplash-1544197150.webp',
		width: 1600,
		height: 1068,
		alt: 'Panel de parcheo con cables ordenados',
	},
	{
		id: 'canalizaciones',
		title: 'Canalizaciones',
		text: 'La ruta física del cable, por charola o tubería.',
		icon: icon('<path d="M3 10h18M3 14h18"/><path d="M7 7v10M12 7v10M17 7v10"/>'),
		src: '/home/fotos/canalizacion-pexels-4508751.webp',
		width: 1400,
		height: 354,
		alt: 'Charolas de cable sobre un pasillo de racks',
	},
	{
		id: 'servidores',
		title: 'Servidores',
		text: 'El equipo que sostiene los sistemas del sitio.',
		icon: icon('<rect x="3" y="4" width="18" height="5" rx="1"/><rect x="3" y="10" width="18" height="5" rx="1"/><rect x="3" y="16" width="18" height="4" rx="1"/><path d="M7 6.5h.01M7 12.5h.01M7 18h.01"/>'),
		src: '/home/fotos/servidores-unsplash-1484557052.webp',
		width: 900,
		height: 602,
		alt: 'Frente de un servidor',
	},
	{
		id: 'switches',
		title: 'Switches',
		text: 'La conmutación de la red local.',
		icon: icon('<rect x="3" y="7" width="18" height="10" rx="1.5"/><path d="M7 12h.01M10 12h.01M13 12h.01M16 12h.01"/>'),
		src: '/home/fotos/fibra-brett-sayles.webp',
		width: 1600,
		height: 1065,
		alt: 'Cables conectados a un switch',
	},
	{
		id: 'ups',
		title: 'UPS',
		text: 'Energía de respaldo para que la red siga en un corte.',
		icon: icon('<rect x="4" y="7" width="16" height="11" rx="1.5"/><path d="M8 7V5h8v2M9 12h4l-2 4h4"/>'),
	},
	{
		id: 'antenas',
		title: 'Antenas y enlaces',
		text: 'El tramo inalámbrico cuando el cable no llega.',
		icon: icon('<path d="M12 21V10"/><path d="M8 21h8"/><path d="M12 10 7 4M12 10l5-6"/><path d="M9 7c1.2-1 4.8-1 6 0"/>'),
	},
	{
		id: 'racks',
		title: 'Racks',
		text: 'El cuarto de comunicaciones, en orden.',
		icon: icon('<rect x="6" y="2" width="12" height="20" rx="1"/><path d="M9 6h6M9 10h6M9 14h6M9 18h6"/>'),
		src: '/home/fotos/racks-pexels-4508751.webp',
		width: 1200,
		height: 800,
		alt: 'Pasillo de racks',
	},
	{
		id: 'fibra',
		title: 'Fibra óptica',
		text: 'El enlace entre edificios o entre sitios.',
		icon: icon('<path d="M4 16c4-8 12-8 16 0"/><path d="M4 12c4-6 12-6 16 0"/><circle cx="12" cy="16" r="1.2" fill="currentColor" stroke="none"/>'),
		src: '/home/fotos/fibra-pexels-1148820.webp',
		width: 1200,
		height: 802,
		alt: 'Módulos de fibra óptica',
	},
	{
		id: 'wifi',
		title: 'WiFi empresarial',
		text: 'Cobertura para el trabajo en el sitio.',
		icon: icon('<path d="M5 10a10 10 0 0 1 14 0"/><path d="M8 13a6 6 0 0 1 8 0"/><path d="M11 16a2 2 0 0 1 2 0"/><circle cx="12" cy="19" r="0.8" fill="currentColor" stroke="none"/>'),
	},
];
