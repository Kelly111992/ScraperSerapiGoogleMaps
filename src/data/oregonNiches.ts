export interface Niche {
    id: string;
    name: string;
    description: string;
    priority: 'ALTA' | 'MEDIA' | 'BAJA';
    priorityStates: string[];
    keywords: string[];
    negativeKeywords: string[];
    scianCodes: string[];
}

export const oregonNiches: Niche[] = [
    {
        id: 'dealer_specialist',
        name: '1. Dealer Especialista con Taller',
        description: 'Centros de servicio técnico y reparación. Buscan consumibles (cadenas, barras), refacciones y herramientas de afilado.',
        priority: 'ALTA',
        priorityStates: ['Durango', 'Chihuahua', 'Michoacán', 'Jalisco', 'Guerrero', 'Chiapas'],
        scianCodes: ['433210', '811310'],
        keywords: [
            "Refacciones para motosierras profesionales",
            "Taller de afilado de cadenas",
            "Venta de barras para motosierra",
            "Sprocket y piñones para motosierra",
            "Reparación de equipos de corte",
            "Mantenimiento de sistemas de corte",
            "Distribuidor de refacciones forestales",
            "Accesorios para motosierras de gasolina",
            "Especialistas en motores de 2 tiempos",
            "Taller mecánico de herramientas forestales",
            "Venta de limas y accesorios de afilado"
        ],
        negativeKeywords: ["home depot", "lowes", "walmart", "truper", "pretul"]
    },
    {
        id: 'field_contractor',
        name: '2. Operador de Batalla (Contratista)',
        description: 'Contratistas de campo, poda técnica y despeje de vías. Compran por volumen cadenas, barras y equipo de seguridad.',
        priority: 'ALTA',
        priorityStates: ['Veracruz', 'Puebla', 'Oaxaca', 'Tabasco', 'Quintana Roo'],
        scianCodes: ['113310', '561730'],
        keywords: [
            "Contratista de aprovechamiento forestal",
            "Mantenimiento de derechos de vía CFE",
            "Servicios de desmonte y tala",
            "Empresa de poda de altura",
            "Control de vegetación industrial",
            "Limpieza de brechas cortafuego",
            "Cosecha de madera industrial",
            "Suministro de equipo de seguridad forestal",
            "Proveedores de consumibles de corte",
            "Cuadrillas de tala y despeje"
        ],
        negativeKeywords: ["jardinería residencial", "diseño de jardines", "vivero"]
    },
    {
        id: 'regional_wholesaler',
        name: '3. Multiplicador de Capilaridad (Mayoreo)',
        description: 'Mayoristas regionales que abastecen ferreterías rurales. Buscan sistemas de corte como refacción agrícola.',
        priority: 'MEDIA',
        priorityStates: ['Guanajuato', 'Querétaro', 'Coahuila', 'Nuevo León', 'San Luis Potosí'],
        scianCodes: ['432110'],
        keywords: [
            "Mayoreo de refacciones agrícolas",
            "Distribuidora de accesorios para motosierras",
            "Venta al por mayor de barras y cadenas",
            "Proveedor de refacciones para el campo",
            "Distribuidor de implementos de corte",
            "Mayoreo de equipo de protección personal agrícola",
            "Suministros para ferreterías rurales",
            "Importadora de refacciones forestales y agrícolas"
        ],
        negativeKeywords: ["tractores", "agroquímicos", "fertilizantes"]
    }
];
