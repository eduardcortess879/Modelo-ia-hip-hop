/**
 * AGENTE IA - BACKEND (EXPRESS + OPENAI)
 *
 * Descripción:
 * Este servidor backend permite:
 * - Servir una interfaz web (frontend tipo chat)
 * - Recibir preguntas del usuario
 * - Enviar esas preguntas a OpenAI
 * - Devolver respuestas basadas en cultura hip hop
 *
 * Tecnologías utilizadas:
 * - Node.js
 * - Express
 * - OpenAI API
 * - dotenv
 *
 */

import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import path from "path";

/**
 * Carga variables de entorno desde archivo .env
 * Ej: OPENAI_API_KEY
 */
dotenv.config();

/**
 * Inicialización del servidor Express
 */
const app = express();

/**
 * MIDDLEWARES=
 */

/**
 * Permite recibir datos JSON en las peticiones (req.body)
 */
app.use(express.json());

/**
 * HEALTH CHECK
 *
 * Ruta utilizada por Railway para verificar que
 * el servidor está activo y funcionando correctamente.
 */
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

/**
 * CONFIGURACIÓN FRONTEND
 */

/**
 * Ruta absoluta hacia la carpeta "frontend"
 * process.cwd() asegura compatibilidad en producción (Railway)
 */
const frontendPath = path.join(process.cwd(), "frontend");

/**
 * Permite servir archivos estáticos:
 * - index.html
 * - style.css
 * - script.js
 */
app.use(express.static(frontendPath));

/**
 * Ruta principal "/"
 *
 * Devuelve el archivo index.html (interfaz del chat)
 */
app.get("/", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

/**
 * ENDPOINT IA
 *
 * POST /preguntar
 *
 * Recibe:
 * {
 *   "pregunta": "string"
 * }
 *
 * Devuelve:
 * {
 *   "respuesta": "string"
 * }
 *
 * Función:
 * Envía la pregunta a OpenAI y devuelve la respuesta
 * contextualizada en cultura hip hop.
 */
app.post("/preguntar", async (req, res) => {
  try {
    const { pregunta } = req.body;

    if (!pregunta) {
      return res.status(400).json({
        error: "Falta la pregunta",
      });
    }

    /**
     * =========================
     * 1. GENERAR TEXTO
     * =========================
     */
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",

        /**
         * Prompt
         */
        input: `PRIORIDAD DE INTERPRETACIÓN:

1. Siempre intenta encontrar una interpretación dentro del hip hop.
2. Si el término es ambiguo, genera una interpretación razonable dentro del contexto hip hop.
3. SOLO si es completamente imposible relacionarlo → "No aplica al tema".


CONTEXTO CONVERSACIONAL:

- Debes recordar el tema de la conversación actual.
- Nunca trates los mensajes como independientes si hay contexto reciente.

- El contexto MÁS RECIENTE tiene prioridad absoluta sobre cualquier mención anterior.

- Mantén una única "entidad activa" (álbum, artista o tema).
  - Cada nueva entidad mencionada reemplaza la anterior.

Ejemplo:
Usuario: háblame de Nastradamus → entidad activa = Nastradamus  
Usuario: háblame de Madvillainy → entidad activa = Madvillainy  
Usuario: dame el listado → usar Madvillainy


RESOLUCIÓN DE REFERENCIAS:

- Antes de responder, analiza si el mensaje depende del contexto previo.

- Si la pregunta es incompleta o implícita:
  - Debes resolver explícitamente a qué entidad se refiere
  - Usa SIEMPRE la entidad activa más reciente

- Orden de prioridad:
  1. Último mensaje del asistente
  2. Último mensaje del usuario
  3. Ignorar referencias más antiguas si hay una más reciente

- Trata la referencia como si el usuario hubiera dicho el nombre completo

Ejemplo interno:
"dame el listado de canciones" → "dame el listado de canciones de Madvillainy"

- NO pidas aclaración si existe un contexto claro e inmediato
- Si hay una interpretación razonable basada en el contexto, úsala directamente


REGLA CRÍTICA DE CONTEXTO:

- Es un ERROR pedir aclaración si el contexto reciente contiene una referencia clara

- Las preguntas de seguimiento cortas:
  ("dame el listado", "las canciones", "el tracklist")
  SIEMPRE deben resolverse usando la entidad activa

- NO está permitido usar entidades antiguas si ya fueron reemplazadas

- NO está permitido responder con preguntas si el contexto es suficiente

- Pedir aclaración cuando ya hay contexto válido se considera una respuesta incorrecta


PROCESO INTERNO OBLIGATORIO:

1. Detectar si el mensaje depende del contexto
2. Identificar la entidad activa más reciente
3. Reescribir mentalmente la pregunta completa
4. Responder directamente usando esa entidad

- NO saltarse este proceso


REGLAS ADICIONALES:

- NO respondas "No aplica al tema" sin intentar al menos una interpretación
- Evita respuestas genéricas o de desambiguación si el contexto ya define el tema

- Si el término es ambiguo:
  - Intenta relacionarlo con:
    • canciones
    • álbumes
    • artistas
    • slang
    • técnicas de rap (freestyle, wordplay, flow)

- Si no existe coincidencia directa:
  - Interpreta el término como concepto dentro del hip hop


FORMATO DE RESPUESTA:

- Responde principalmente en texto claro, directo y con conocimiento real
- Prioriza claridad sobre formato

- SOLO usa tablas cuando sea realmente útil:
  (ej: listar canciones, álbumes, comparaciones o datos estructurados)

- NO uses tablas para:
  • definiciones
  • explicaciones conceptuales
  • respuestas cortas

- Si usas una tabla:
  - Debe complementar la explicación, no reemplazarla
  - SIEMPRE incluye texto antes y/o después explicando el contexto
  - Máximo 1 tabla por respuesta (salvo que sea estrictamente necesario)
  - Usa HTML real: <table>, <tr>, <td>, <th>
  - No uses markdown

- Es mejor NO usar tabla que usar una tabla innecesaria"

Pregunta: ${pregunta}`,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({
        error: "Error de OpenAI (texto)",
        detalle: data,
      });
    }

    const texto = data.output?.[0]?.content?.[0]?.text || "Sin respuesta";

    /**
     * =========================
     * 2. DECIDIR SI GENERAR IMAGEN
     * (ahorra $$$)
     * =========================
     */
    const generarImagen =
      pregunta.toLowerCase().includes("imagen") ||
      pregunta.toLowerCase().includes("dibuja") ||
      pregunta.toLowerCase().includes("visual") ||
      pregunta.toLowerCase().includes("ilustración");

    let imagen = null;

    /**
     * =========================
     * 3. GENERAR IMAGEN (OPCIONAL)
     * =========================
     */
    if (generarImagen) {
      const imageResponse = await fetch("https://api.openai.com/v1/images", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-image-1",
          prompt: `Hip hop artwork: ${pregunta}`,
          size: "1024x1024",
        }),
      });

      const imageData = await imageResponse.json();

      if (imageResponse.ok) {
        imagen = imageData.data?.[0]?.b64_json;
      }
    }

    /**
     * =========================
     * 4. RESPUESTA FINAL
     * =========================
     */
    res.json({
      respuesta: texto,
      imagen: imagen, // puede ser null si no se pidió imagen
    });
  } catch (error) {
    console.error("ERROR:", error);

    res.status(500).json({
      error: error.message,
    });
  }
});

/**
 * INICIO DEL SERVIDOR
 *
 * Usa:
 * - PORT de Railway en producción
 * - 3000 en entorno local
 *
 * 0.0.0.0 permite acceso externo (obligatorio en Railway)
 */
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
