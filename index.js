import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const app = express();

/* Middleware */
app.use(express.json());

/* Health check */
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

/* Ruta del frontend (FORMA SEGURA EN RAILWAY) */
const frontendPath = path.join(process.cwd(), "frontend");

/* Servir archivos estáticos */
app.use(express.static(frontendPath));

/* Ruta principal */
app.get("/", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

/* Endpoint IA */
app.post("/preguntar", async (req, res) => {
  try {
    const { pregunta } = req.body;

    if (!pregunta) {
      return res.status(400).json({ error: "Falta la pregunta" });
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        input: `Eres un experto en cultura hip hop y rap.

Tu conocimiento incluye:
- Historia del hip hop (old school, golden era, modern era)
- Artistas influyentes y sus discografías
- Álbumes clásicos (ej: Illmatic, To Pimp a Butterfly)
- Cultura del rap y evolución del género

Reglas:
- Responde claro, directo y con conocimiento real
- Usa referencias cuando tenga sentido
- Si no es hip hop: "No aplica al tema"

Pregunta: ${pregunta}`,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({
        error: "Error de OpenAI",
        detalle: data,
      });
    }

    const texto = data.output?.[0]?.content?.[0]?.text;

    res.json({
      respuesta: texto || "Sin respuesta",
    });

  } catch (error) {
    console.error("ERROR:", error);
    res.status(500).json({
      error: error.message,
    });
  }
});

/* Puerto Railway */
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor corriendo en puerto ${PORT} 🚀`);
});