/* Enmy Trends RD · Catálogo de provincias y municipios.
 * Debe coincidir con el catálogo del servidor: el servidor rechaza cualquier municipio que no esté en él. */
'use strict';
/* Catálogo local: provincias y municipios, no distritos municipales.
 * Referencia: ONE División Territorial 2021 y leyes 15-24, 39-24 (Santo Domingo).
 * No implica cobertura de entrega. */
window.LOCATIONS = Object.freeze( {
  'Distrito Nacional': ['Santo Domingo de Guzmán'],
  'Azua': ['Azua de Compostela', 'Estebanía', 'Guayabal', 'Las Charcas', 'Las Yayas de Viajama', 'Padre Las Casas', 'Peralta', 'Pueblo Viejo', 'Sabana Yegua', 'Tábara Arriba'],
  'Bahoruco': ['Neiba', 'Galván', 'Los Ríos', 'Tamayo', 'Villa Jaragua'],
  'Barahona': ['Santa Cruz de Barahona', 'Cabral', 'El Peñón', 'Enriquillo', 'Fundación', 'Jaquimeyes', 'La Ciénaga', 'Las Salinas', 'Paraíso', 'Polo', 'Vicente Noble'],
  'Dajabón': ['Dajabón', 'El Pino', 'Loma de Cabrera', 'Partido', 'Restauración'],
  'Duarte': ['San Francisco de Macorís', 'Arenoso', 'Castillo', 'Eugenio María de Hostos', 'Las Guáranas', 'Pimentel', 'Villa Riva'],
  'Elías Piña': ['Comendador', 'Bánica', 'El Llano', 'Hondo Valle', 'Juan Santiago', 'Pedro Santana'],
  'El Seibo': ['Santa Cruz de El Seibo', 'Miches'],
  'Espaillat': ['Moca', 'Cayetano Germosén', 'Gaspar Hernández', 'Jamao al Norte', 'San Víctor'],
  'Hato Mayor': ['Hato Mayor del Rey', 'El Valle', 'Sabana de la Mar'],
  'Hermanas Mirabal': ['Salcedo', 'Tenares', 'Villa Tapia'],
  'Independencia': ['Jimaní', 'Cristóbal', 'Duvergé', 'La Descubierta', 'Mella', 'Postrer Río'],
  'La Altagracia': ['Higüey', 'San Rafael del Yuma'],
  'La Romana': ['La Romana', 'Guaymate', 'Villa Hermosa'],
  'La Vega': ['La Vega', 'Constanza', 'Jarabacoa', 'Jima Abajo'],
  'María Trinidad Sánchez': ['Nagua', 'Cabrera', 'El Factor', 'Río San Juan'],
  'Monseñor Nouel': ['Bonao', 'Maimón', 'Piedra Blanca'],
  'Monte Cristi': ['San Fernando de Monte Cristi', 'Castañuelas', 'Guayubín', 'Las Matas de Santa Cruz', 'Pepillo Salcedo', 'Villa Vásquez'],
  'Monte Plata': ['Monte Plata', 'Bayaguana', 'Peralvillo', 'Sabana Grande de Boyá', 'Yamasá'],
  'Pedernales': ['Pedernales', 'Oviedo'],
  'Peravia': ['Baní', 'Matanzas', 'Nizao'],
  'Puerto Plata': ['San Felipe de Puerto Plata', 'Altamira', 'Guananico', 'Imbert', 'Los Hidalgos', 'Luperón', 'Sosúa', 'Villa Isabela', 'Villa Montellano'],
  'Samaná': ['Santa Bárbara de Samaná', 'Las Terrenas', 'Sánchez'],
  'San Cristóbal': ['San Cristóbal', 'Bajos de Haina', 'Cambita Garabitos', 'Los Cacaos', 'Sabana Grande de Palenque', 'San Gregorio de Nigua', 'Villa Altagracia', 'Yaguate'],
  'San José de Ocoa': ['San José de Ocoa', 'Rancho Arriba', 'Sabana Larga'],
  'San Juan': ['San Juan de la Maguana', 'Bohechío', 'El Cercado', 'Juan de Herrera', 'Las Matas de Farfán', 'Vallejuelo'],
  'San Pedro de Macorís': ['San Pedro de Macorís', 'Consuelo', 'Guayacanes', 'Quisqueya', 'Ramón Santana', 'San José de los Llanos'],
  'Sánchez Ramírez': ['Cotuí', 'Cevicos', 'Fantino', 'La Mata'],
  'Santiago': ['Santiago de los Caballeros', 'Baitoa', 'Jánico', 'Licey al Medio', 'Puñal', 'Sabana Iglesia', 'San José de las Matas', 'Tamboril', 'Villa Bisonó', 'Villa González'],
  'Santiago Rodríguez': ['San Ignacio de Sabaneta', 'Los Almácigos', 'Monción'],
  'Santo Domingo': ['Santo Domingo Este', 'Santo Domingo Norte', 'Santo Domingo Oeste', 'Boca Chica', 'Los Alcarrizos', 'Pedro Brand', 'San Antonio de Guerra', 'La Victoria', 'La Caleta'],
  'Valverde': ['Mao', 'Esperanza', 'Laguna Salada'],
});
