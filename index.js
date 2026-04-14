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

//Historial del chat
let chatHistory = [];

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

    chatHistory.push({
      role: "user",
      content: pregunta,
    });

    if (!pregunta) {
      return res.status(400).json({
        error: "Falta la pregunta",
      });
    }

    /**
     * =========================
     * GENERAR TEXTO
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
        input: [
          {
            role: "system",
            content: `Eres un experto en cultura hip hop y rap de la escena americana o norteamericana y europa (canada y reino unido).

Tu conocimiento incluye:
- Historia del hip hop
- Artistas, álbumes y discografías
- Canciones y tracklists
- Cultura y técnicas del rap


PRIORIDAD DE INTERPRETACIÓN:

1. Interpreta SIEMPRE el input dentro del contexto del hip hop.
2. Si el término es ambiguo, asume una interpretación razonable dentro del rap.
3. SOLO si es imposible relacionarlo → "No aplica al tema".


CONTEXTO:

- Usa el contexto más reciente de la conversación.
- Las preguntas cortas (ej: "dame el listado", "las canciones", "tracklist") dependen del último álbum o artista mencionado.
- No pidas aclaración si el contexto es claro.


REGLA CRÍTICA:

- Si el usuario hace una pregunta incompleta, complétala usando el contexto.
- Responde directamente sin hacer preguntas innecesarias.
- No cambies de álbum o artista a menos que el usuario lo indique.


FORMATO:

- Responde en texto claro por defecto.

- SOLO usa tablas cuando sea realmente necesario:
  • listados de canciones (tracklist)
  • comparaciones
  • datos estructurados

- NO uses tablas para:
  • descripciones
  • explicaciones
  • historia o análisis

- Si usas tabla:
  - Debe ser HTML real (<table>, <tr>, <td>, <th>)
  - NO uses markdown
  - NO uses texto con "|"
  - Debe tener múltiples columnas (ej: número, canción, duración)
  - NO uses una sola columna
  - NO incluyas texto narrativo dentro de la tabla

Ejemplo correcto:
<table>
<tr><th>#</th><th>Canción</th></tr>
<tr><td>1</td><td>The Genesis</td></tr>
</table>

- Es un ERROR usar tablas si no aportan estructura real


SALIDA:

- No expliques el contexto ni tu razonamiento
- No digas "entiendo que..." ni frases similares
- Responde directo como experto`,
          },
          ...chatHistory,
        ],
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

    // Guardar respuesta del assistant
    chatHistory.push({
      role: "assistant",
      content: texto,
    });

    // 🔥 LIMITAR HISTORIAL
    if (chatHistory.length > 10) {
      chatHistory = chatHistory.slice(-10);
    }
    /**
     * =========================
     * RESPUESTA FINAL
     * =========================
     */
    res.json({
      respuesta: texto
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
