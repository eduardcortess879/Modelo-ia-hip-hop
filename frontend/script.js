/**
 * FUNCIÓN PRINCIPAL: enviar()
 *
 * Descripción:
 * Captura el mensaje del usuario, lo envía al backend (/preguntar)
 * y muestra la respuesta en la interfaz tipo chat.
 *
 * Flujo:
 * 1. Obtener input del usuario
 * 2. Mostrar mensaje en UI
 * 3. Mostrar indicador "Escribiendo..."
 * 4. Enviar request al backend
 * 5. Mostrar respuesta del bot
 *
 * @returns {Promise<void>}
 */
async function enviar() {
  /**
   * Referencias a elementos del DOM
   */
  const input = document.getElementById("input");
  const chat = document.getElementById("chat");

  /**
   * Obtener y limpiar el mensaje del usuario
   */
  const mensaje = input.value.trim();

  /**
   * Validación: evitar mensajes vacíos
   */
  if (!mensaje) return;

  /**
   * Mostrar mensaje del usuario
   */
  const userMsg = document.createElement("div");
  userMsg.className = "mensaje usuario";
  userMsg.innerText = mensaje;

  chat.appendChild(userMsg);

  /**
   * Limpiar input después de enviar
   */
  input.value = "";

  /**
   * Indicador de "Escribiendo..."
   */
  const typing = document.createElement("div");
  typing.className = "mensaje bot";
  typing.innerHTML = `<span class="text-secondary">Escribiendo...</span>`;

  chat.appendChild(typing);

  /**
   * Auto-scroll hacia el final del chat
   */
  chat.scrollTop = chat.scrollHeight;

  try {
    /**
     * Petición al backend
     * Endpoint: POST /preguntar
     * Body:
     * {
     *   pregunta: string
     * }
     */
    const res = await fetch("/preguntar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ pregunta: mensaje }),
    });

    /**
     * Parsear respuesta JSON
     */
    const data = await res.json();

    /**
     * Eliminar indicador "Escribiendo..."
     */
    typing.remove();

    /**
     * Mostrar respuesta del bot
     */
    const botMsg = document.createElement("div");
    botMsg.className = "mensaje bot";
    botMsg.innerText = data.respuesta;

    chat.appendChild(botMsg);

    /**
     * Scroll automático
     */
    chat.scrollTop = chat.scrollHeight;
  } catch (error) {
    /**
     * Manejo de error en UI
     */
    typing.innerText = "Error al responder";
  }
}

/**
 * EVENTO: Enviar con tecla ENTER
 *
 * Descripción:
 * Detecta cuando el usuario presiona Enter en el input
 * y ejecuta la función enviar()
 */
document.getElementById("input").addEventListener("keypress", function (e) {
  if (e.key === "Enter") {
    enviar();
  }
});

/**
 * EVENTO: Mensaje inicial (onload)
 *
 * Descripción:
 * Se ejecuta al cargar la página.
 * Muestra un mensaje de bienvenida del agente.
 */
window.onload = () => {
  const chat = document.getElementById("chat");

  /**
   * Crear mensaje inicial del bot
   */
  const bienvenida = document.createElement("div");
  bienvenida.className = "mensaje bot";

  bienvenida.innerHTML = `
  <strong>Agente Hip Hop</strong><br>
  <span style="color:#aaa">Explora la cultura del rap</span><br><br>

  Prueba preguntas como:<br>
  • ¿Por qué Illmatic es tan importante?<br>
  • ¿Qué hace único a Kendrick Lamar?<br>
  • Mejores álbumes del hip hop<br>
  • Historia del rap en los 90<br>
`;

  /**
   * Insertar mensaje en el chat
   */
  chat.appendChild(bienvenida);
};
