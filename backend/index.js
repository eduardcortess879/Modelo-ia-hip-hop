/**
 * AGENTE IA - HIP HOP API
 *
 * Descripción:
 * Servidor backend construido con Express que:
 * - Sirve el frontend (interfaz de chat)
 * - Expone un endpoint POST /preguntar
 * - Se conecta con OpenAI para generar respuestas
 *
 * Tecnologías:
 * - Node.js
 * - Express
 * - OpenAI API
 * - dotenv (variables de entorno)
 */

import fetch from "node-fetch";
import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

/**
 * Carga variables de entorno desde .env
 */
dotenv.config();

/**
 * Inicialización de la aplicación Express
 */
const app = express();

/**
 * MIDDLEWARES
 */

/**
 * Permite recibir datos en formato JSON en req.body
 */
app.use(express.json());

/**
 * CONFIGURACIÓN DE RUTAS ESTÁTICAS
 *
 * Permite servir archivos del frontend (HTML, CSS, JS)
 * desde la carpeta /frontend
 *
 * Importante:
 * Se usa path absoluto para evitar errores en Windows
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(process.cwd(), "frontend")));
app.get("/", (req, res) => {
  res.sendFile(path.join(process.cwd(), "frontend/index.html"));
});

/**
 * ENDPOINT: POST /preguntar=
 *
 * Descripción:
 * Recibe una pregunta del usuario y devuelve una respuesta
 * generada por IA basada en el contexto de hip hop.
 *
 * Request Body:
 * {
 *   "pregunta": "string"
 * }
 *
 * Response:
 * {
 *   "respuesta": "string"
 * }
 *
 * Códigos de estado:
 * - 200: Respuesta exitosa
 * - 400: Falta parámetro "pregunta"
 * - 500: Error interno o de OpenAI
 */
app.post("/preguntar", async (req, res) => {
  try {
    /**
     * Extrae la pregunta del body
     */
    const { pregunta } = req.body;

    /**
     * Validación del input
     */
    if (!pregunta) {
      return res.status(400).json({
        error: "Falta la pregunta",
      });
    }

    /**
     * LLAMADA A OPENAI
     *
     * Se envía la pregunta junto con el contexto
     * para generar una respuesta especializada.
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
         * Prompt del sistema (contexto del agente)
         */
        input: `Eres un experto en cultura hip hop y rap.

Tu conocimiento incluye:
- Historia del hip hop (old school, golden era, modern era)
- Artistas influyentes y sus discografías
- Álbumes clásicos (ej: Illmatic, To Pimp a Butterfly, Ready to Die)
- Letras, flows y estilos
- Cultura del rap (street, storytelling, conciencia social)
- Rivalidades y beefs históricos

Reglas:
- Responde de forma clara, directa y con conocimiento real del género
- Usa referencias cuando tenga sentido (artistas, álbumes, canciones)
- Mantén un tono auténtico, con esencia hip hop pero sin exagerar
- No inventes información
- Si la pregunta no es sobre hip hop o rap, responde: "No aplica al tema"

Pregunta: ${pregunta}`,
      }),
    });

    /**
     * Parseo de la respuesta de OpenAI
     */
    const data = await response.json();

    /**
     * Log para debugging (solo desarrollo)
     */
    console.log("Respuesta completa:", data);

    /**
     * Manejo de errores de OpenAI
     */
    if (!response.ok) {
      return res.status(500).json({
        error: "Error de OpenAI",
        detalle: data,
      });
    }

    /**
     * Extracción segura del texto generado
     */
    const texto = data.output?.[0]?.content?.[0]?.text;

    /**
     * Respuesta final al cliente
     */
    res.json({
      respuesta: texto || "No hubo respuesta válida",
    });
  } catch (error) {
    /**
     * Manejo de errores inesperados
     */
    console.error("ERROR REAL:", error);

    res.status(500).json({
      error: error.message,
    });
  }
});

/**
 * INICIO DEL SERVIDOR
 *
 * Usa el puerto asignado por Railway o 3000 en local
 */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Agente corriendo en puerto ${PORT} 🚀`);
});