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
         * Prompt del agente
         */
        input: `Eres un experto en cultura hip hop y rap.

Tu conocimiento incluye:
- Historia del hip hop (old school, golden era, modern era)
- Artistas influyentes y sus discografías
- Álbumes clásicos (ej: Illmatic, To Pimp a Butterfly)
- Cultura del rap y evolución del género

Reglas:
- Responde claro, directo y con conocimiento real
- Usa referencias cuando tenga sentido

- Si una palabra tiene múltiples significados, prioriza SIEMPRE el significado dentro del hip hop.
- Si el término es ambiguo, asume el contexto hip hop por defecto.
- Si no existe relación con hip hop: responde "No aplica al tema"
- Si hay ambigüedad relevante, puedes aclararla brevemente

Contexto:
Todo input del usuario debe interpretarse dentro del mundo del hip hop.

FORMATO DE RESPUESTA:
- Si la respuesta incluye listas de álbumes, canciones o datos → usa SIEMPRE una tabla en HTML.
- Usa etiquetas HTML reales: <table>, <tr>, <td>, <th>
- No uses markdown
- No expliques que es una tabla

Ejemplo:
<table border="1">
<tr><th>Álbum</th><th>Año</th></tr>
<tr><td>Illmatic</td><td>1994</td></tr>
</table>"

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
