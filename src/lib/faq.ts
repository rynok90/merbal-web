export type FaqItem = {
	question: string;
	answer: string;
};

/** Respuestas armadas solo con frases que ya publica el sitio. */
export const FAQS: FaqItem[] = [
	{
		question: '¿Qué es MERBAL?',
		answer:
			'MERBAL desarrolla el software e integra la tecnología. Hace software a la medida y plataformas propias, más seguridad electrónica e infraestructura de red, para que la empresa opere mejor. Es una empresa mexicana: un solo equipo, de punta a punta, con soporte directo.',
	},
	{
		question: '¿Qué plataformas propias tiene MERBAL?',
		answer:
			'Primero el ecosistema Paperless, con sus cinco módulos juntos: Access, Obras, Safe Access, Ruta e Integridad. Después Anuvé. Luego la Consola empresarial y, aparte, Guardias: un módulo que se contrata solo o como extra, con Rondil en el celular.',
	},
	{
		question: '¿Qué es Access y para quién es?',
		answer:
			'Access controla quién entra y quién sale: visitantes y contratistas, con pase QR y caseta. La caseta lee el QR y registra la entrada o la salida.',
	},
	{
		question: '¿Qué es Anuvé?',
		answer:
			'Anuvé es la agenda, la silla, la tienda y los estilos, para salones y barberías. La agenda del día, la ficha de quien se atiende y la tienda viven en la misma casa.',
	},
	{
		question: '¿Qué es Guardias y qué es la Consola empresarial?',
		answer:
			'Guardias es un módulo que se contrata solo o como extra de la Consola. Rondil es su aplicación móvil: el guardia recorre los puntos de la ronda y va marcando cada punto en el celular. La Consola empresarial reúne cotizaciones y bitácora en el tablero de la operación.',
	},
	{
		question: '¿Qué hace MERBAL si la operación no cabe en una plataforma?',
		answer:
			'Si la operación no cabe en una plantilla, MERBAL construye el software a la medida: entender cómo se trabaja hoy, diseñar pantallas y reglas, desarrollar y probar con el equipo, y acompañar cuando la operación pide un ajuste. Por confidencialidad (NDA) no se muestran los proyectos de clientes.',
	},
	{
		question: '¿MERBAL también integra seguridad electrónica y red?',
		answer:
			'El mismo equipo que escribe el software integra la seguridad electrónica y la infraestructura de red en el sitio. La seguridad electrónica cubre drones, cámaras, detección y aviso, y se integra cuando el software no basta. La red cubre cable, fibra, racks y el enlace inalámbrico, para que el software y el sitio tengan de dónde apoyarse.',
	},
	{
		question: '¿Cómo se contacta a MERBAL?',
		answer:
			'Por el formulario del sitio o en soporte@merbal.lat. Si vienes de una solución, ya queda marcada. Si no, se elige de qué hablar: Desarrollo, Seguridad electrónica o Infraestructura de red.',
	},
];
