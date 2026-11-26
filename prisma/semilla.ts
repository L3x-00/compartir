import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import { prisma } from "@/lib/prisma";
import { esquemaNombreParticipante } from "@/lib/validaciones/participante";
import { eliminarFoto } from "@/lib/archivos";
import { esquemaNecesidad } from "@/lib/validaciones/necesidad";
import { esquemaPistas } from "@/lib/validaciones/pistas";
import type { Pistas } from "@/tipos/pistas";

// tsx no carga .env por sí solo. Node lo carga sin dependencias adicionales.
if (existsSync(".env")) loadEnvFile(".env");

type ParticipanteSemilla = {
  nombre: string;
  necesidades: { nombre: string; descripcion: string; linkReferencia?: string }[];
  pistas: Pistas;
};

const participantesSemilla: ParticipanteSemilla[] = [
  {
    nombre: "María",
    necesidades: [
      { nombre: "Libro de recetas peruanas", descripcion: "Con recetas caseras y pasos sencillos para compartir en familia." },
      { nombre: "Taza de cerámica", descripcion: "Una taza grande para el café de la mañana." },
      { nombre: "Mandil de cocina", descripcion: "De algodón, con bolsillos y tiras ajustables." },
    ],
    pistas: {
      fisico: { altura: "baja", complexion: "delgada", cabello: "castaño", lentes: true, barba: "sin barba" },
      personalidad: { social: "ambivertido", humor: "tierno", puntualidad: "puntual", energia: "moderado" },
      gustos: { comida: "comida casera", musica: "baladas", hobby: "cocinar", lugar: "campo" },
      datoCurioso: "Siempre llevo algo rico para compartir.",
    },
  },
  {
    nombre: "José",
    necesidades: [
      { nombre: "Pelota de fútbol", descripcion: "Tamaño 5 para los partidos del fin de semana." },
      { nombre: "Botella para hacer deporte", descripcion: "Reutilizable, de un litro y con tapa hermética." },
      { nombre: "Gorra deportiva", descripcion: "Ajustable, de color oscuro y tela ligera." },
    ],
    pistas: {
      fisico: { altura: "alta", complexion: "atlética", cabello: "negro", lentes: false, barba: "barba corta" },
      personalidad: { social: "extrovertido", humor: "blanco", puntualidad: "impuntual", energia: "intenso" },
      gustos: { comida: "asado", musica: "rock", hobby: "deporte", lugar: "playa" },
      datoCurioso: "Me encanta organizar juegos en familia.",
    },
  },
  {
    nombre: "Ana",
    necesidades: [
      { nombre: "Novela de misterio", descripcion: "Prefiero historias de detectives en edición de bolsillo." },
      { nombre: "Lámpara de lectura", descripcion: "Pequeña, recargable y con luz cálida." },
      { nombre: "Libreta de apuntes", descripcion: "Tamaño A5, con hojas punteadas y tapa resistente." },
    ],
    pistas: {
      fisico: { altura: "media", complexion: "delgada", cabello: "rojo", lentes: true, barba: "sin barba" },
      personalidad: { social: "introvertido", humor: "sarcástico", puntualidad: "muy puntual", energia: "tranquilo" },
      gustos: { comida: "sushi", musica: "indie", hobby: "leer", lugar: "montaña" },
      datoCurioso: "Siempre llevo un libro en la mochila.",
    },
  },
  {
    nombre: "Carlos",
    necesidades: [
      { nombre: "Mouse para computadora", descripcion: "Inalámbrico y cómodo para usar todos los días." },
      { nombre: "Audífonos con micrófono", descripcion: "Con conexión de 3.5 mm para jugar y conversar." },
      { nombre: "Alfombrilla para mouse", descripcion: "Grande, de tela y con base antideslizante." },
    ],
    pistas: {
      fisico: { altura: "alta", complexion: "robusta", cabello: "calvo", lentes: false, barba: "barba larga" },
      personalidad: { social: "ambivertido", humor: "negro", puntualidad: "siempre tarde", energia: "moderado" },
      gustos: { comida: "pizza", musica: "reggaetón", hobby: "videojuegos", lugar: "ciudad" },
      datoCurioso: "Me sé los diálogos de mi película favorita.",
    },
  },
  {
    nombre: "Lucía",
    necesidades: [
      { nombre: "Mochila pequeña", descripcion: "Ligera, con varios bolsillos para paseos cortos." },
      { nombre: "Termo para infusiones", descripcion: "De medio litro, que mantenga el agua caliente." },
      { nombre: "Organizador de viaje", descripcion: "Un juego de bolsas para ordenar la ropa en la maleta." },
    ],
    pistas: {
      fisico: { altura: "media", complexion: "atlética", cabello: "rubio", lentes: false, barba: "sin barba" },
      personalidad: { social: "extrovertido", humor: "tierno", puntualidad: "puntual", energia: "intenso" },
      gustos: { comida: "pasta", musica: "pop", hobby: "viajar", lugar: "playa" },
      datoCurioso: "Soy quien toma las fotos familiares.",
    },
  },
];

async function sembrar() {
  const fechaLimite = new Date();
  fechaLimite.setDate(fechaLimite.getDate() + 7);

  const fotosPrevias = await prisma.$transaction([
    prisma.necesidad.findMany({ where: { fotoUrl: { not: null } }, select: { fotoUrl: true } }),
    prisma.participante.findMany({ where: { fotoUrl: { not: null } }, select: { fotoUrl: true } }),
  ]);
  const urls = [...fotosPrevias[0], ...fotosPrevias[1]].map((registro) => registro.fotoUrl).filter((url): url is string => !!url);

  // Si falla una creación o validación, también se revierte el borrado.
  const resumen = await prisma.$transaction(async (transaccion) => {
    await transaccion.intentoAdivinanza.deleteMany();
    await transaccion.regaloSeleccionado.deleteMany();
    await transaccion.pistas.deleteMany();
    await transaccion.necesidad.deleteMany();
    await transaccion.participante.updateMany({ data: { personaSecretaId: null } });
    await transaccion.participante.deleteMany();
    await transaccion.evento.deleteMany();

    const evento = await transaccion.evento.create({
      data: { nombre: process.env.NOMBRE_EVENTO || "Compartir Navideño", fechaLimite, cerrado: false },
    });
    const participantes = [];

    for (const datos of participantesSemilla) {
      const participante = await transaccion.participante.create({
        data: {
          ...esquemaNombreParticipante.parse({ nombre: datos.nombre }),
          pin: "",
          eventoId: evento.id,
          necesidades: { create: datos.necesidades.map((necesidad) => esquemaNecesidad.parse(necesidad)) },
          pistas: { create: { datos: JSON.stringify(esquemaPistas.parse(datos.pistas)) } },
        },
        select: { id: true, nombre: true, necesidades: { select: { id: true } }, pistas: { select: { id: true } } },
      });
      participantes.push(participante);
    }

    return { eventoId: evento.id, fechaLimite, participantes };
  });

  await Promise.all(urls.map((url) => eliminarFoto(url).catch((error: unknown) => {
    console.error("No se pudo limpiar una foto de la semilla anterior:", error);
  })));
  console.log("Semilla completada: 1 evento, 5 participantes, 15 necesidades y 5 formularios de pistas.");
  console.log("No se crearon emparejamientos, regalos seleccionados ni intentos.");
  console.log(JSON.stringify(resumen, null, 2));
}

sembrar()
  .catch((error: unknown) => {
    console.error("No se pudieron crear los datos de prueba:", error);
    process.exitCode = 1;
  })
  .finally(async () => { await prisma.$disconnect(); });
