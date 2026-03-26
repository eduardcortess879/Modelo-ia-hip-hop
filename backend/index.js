import express from "express";

const app = express();

/* Ruta base */
app.get("/", (req, res) => {
  res.send("Servidor funcionando 🚀");
});

/* Health check */
app.get("/health", (req, res) => {
  res.send("OK");
});

/* Puerto Railway */
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor en puerto ${PORT}`);
});