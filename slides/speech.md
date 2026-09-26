# Guion breve: MCP + WebMCP

Guion de apoyo para una charla de aproximadamente 25-35 minutos. Las frases son ideas para desarrollar oralmente, no texto para leer literalmente.

## 01. Portada
Hoy veremos dos formas de conectar agentes con software: MCP en procesos o servidores, y WebMCP directamente en el navegador.

## 02. Bio
Soy Vanessa, ingeniera de software y GDE. La charla nace de una pregunta práctica: ¿cómo hacemos que un agente entienda mejor una aplicación real?

## 03. El problema
Un agente puede intentar leer el DOM y simular clics, pero ese camino es frágil. Las tools declaradas ofrecen nombre, intención, esquema y una acción concreta.

## 04. Qué es MCP
MCP es un protocolo abierto para conectar aplicaciones de IA con capacidades externas. Estandariza la conversación entre el host, el cliente y los servidores.

## 05. Los 3 primitivos
Tools son acciones que el modelo puede invocar. Resources aportan contexto gestionado por la aplicación, y prompts son instrucciones predefinidas que el usuario elige.

## 06. Arquitectura MCP
El host coordina la experiencia y mantiene uno o más clientes. Cada cliente mantiene una conexión con un servidor, que expone sus capacidades.

## 07. Transportes y mensajería
`stdio` sirve muy bien cuando el cliente y el servidor viven en la misma máquina. Para conexiones HTTP usamos Streamable HTTP; ambos transportan mensajes MCP mediante JSON-RPC 2.0.

## 08. MCP Server
Un MCP Server es un programa independiente de la aplicación de IA. Puede ser local o remoto y conectar tools, resources y prompts con APIs, bases de datos o archivos.

## 09. MCP Server: código
Aquí registramos `place_order` con una descripción y un `inputSchema`. La tool encapsula la regla de negocio: validar el producto, crear el pedido y actualizar el inventario.

## 10. MCP Client
El cliente conecta el servidor con el LLM. Descubre las tools, se las entrega al modelo y ejecuta la llamada que el modelo solicite.

## 11. Flujo del cliente
El flujo tiene tres pasos: descubrir, decidir y ejecutar. El protocolo no decide por sí solo; el LLM decide cuándo usar una tool y el cliente la invoca.

## 12. MCP Client: código
Este loop entrega el contexto al modelo, detecta un `tool_use` y llama al servidor. Luego devuelve el resultado al modelo para que continúe o termine.

## 13. Demo 1
Ahora veremos el flujo completo de MCP clásico: una pregunta, una decisión del modelo y una operación real sobre el inventario.

**Demo:** ejecutar `mcp-server` y `mcp-client`; preguntar por stock o realizar un pedido.

### Preparación de la Demo 1

El `mcp-client` levanta `mcp-server` automáticamente como subproceso por `stdio`; no hace falta iniciar ambos manualmente.

```bash
cd /Library/WebServer/Projects/webmcp-action/mcp-client
npm install
cp .env.example .env
# Completar ANTHROPIC_API_KEY en .env
npm start
```

Para usar Gemini en lugar de Claude:

```bash
LLM_PROVIDER=gemini npm start
```

Prompts sugeridos para el REPL:

```text
¿Qué productos tienes disponibles y cuánto stock queda de cada uno?
¿Cuántos auriculares quedan en stock?
¿Cuál es el precio de los auriculares?
Realiza un pedido de 2 auriculares.
¿Cuántos auriculares quedan después del pedido?
```

Secuencia recomendada: listar productos, consultar stock, realizar el pedido y volver a consultar stock para mostrar el cambio.

## 14. Qué es WebMCP
WebMCP lleva la superficie de tools al documento web. La página puede exponer su propia lógica de cliente para que un agente compatible actúe sobre la interfaz y el estado visibles.

## 15. Arquitectura WebMCP
Aquí no necesitamos un MCP Server separado para cambiar la página. El agente descubre las tools del documento y el navegador media la ejecución dentro del contexto de la página.

**Interacción:** hacer clic en `change_color()`, `focus_view()` y `add_to_cart()` para mostrar contrato y resultado.

## 16. API WebMCP
La API actual gira alrededor de `document.modelContext`: registrar tools, descubrirlas con `getTools()` y ejecutar una tool registrada con `executeTool()`.

## 17. API WebMCP: código
La tool declara `name`, `description`, `inputSchema` y `execute`. Lo importante es reutilizar la lógica que ya usa la interfaz, en lugar de crear una segunda implementación para el agente.

## 18. Hints para agentes
WebMCP sigue siendo una propuesta en evolución. Su diccionario `ToolAnnotations` comunica pistas sobre el comportamiento de una tool: `readOnlyHint` indica que solo lee datos, `consequentialHint` marca acciones reales o irreversibles (como reservar o transferir dinero) para forzar confirmación del usuario, y `debugging` distingue las tools de desarrollo de las del flujo normal.

## 19. Debugging: código
Una tool de diagnóstico puede marcarse como `debugging: true`. Así un agente orientado a usuarios puede distinguirla de las tools que forman parte del flujo normal.

## 20. MCP vs. WebMCP
MCP conecta una aplicación con procesos o servicios externos. WebMCP conecta un agente con la página abierta; comparten vocabulario, pero resuelven problemas en capas diferentes.

## 21. No compiten. Se complementan.
WebMCP es útil para configurar, navegar y preparar acciones dentro de la UI. MCP es útil para conectar con servicios y reglas de negocio en un proceso local o remoto.

## 22. Demo 2
Ahora volvemos al catálogo: esta vez el agente actúa directamente sobre la página, comparte su estado y deja visible cada cambio.

**Demo:** cambiar color, cambiar acabado, enfocar una parte, grabar texto y añadir el producto al carrito.

### Preparación de la Demo 2

En otra terminal, levantar la tienda:

```bash
cd /Library/WebServer/Projects/webmcp-action/web
npm install
npm run dev -- --host 127.0.0.1 --port 5175
```

Abrir `http://127.0.0.1:5175/`, entrar en **Auriculares Orbit** y probar estos mensajes:

```text
Ponlos rojos.
Ponlos azul mate.
Enfoca la copa izquierda.
Grábales DEMO.
Añádelos al carrito.
```

Si Prompt API no está disponible, la app usa el modo local y los controles manuales siguen llamando las mismas tools.

## 23. Confirmation Gates
No toda tool debe ejecutarse automáticamente. Para pagar, borrar o realizar una acción irreversible, la aplicación debe mostrar el alcance y pedir una confirmación explícita.

## 24. Arquitectura del demo
El repositorio contiene tres piezas: la aplicación WebMCP, el servidor MCP con el inventario y el cliente Node con el adaptador de LLM.

## 25. Para llevarte
La idea central es simple: MCP estandariza la conexión con servicios; WebMCP estandariza cómo una página expone acciones a un agente. El agente decide, pero cada capa ejecuta en su propio contexto.

## 26. Recursos
Aquí están la especificación de MCP, la propuesta de WebMCP, la documentación de Chrome y el código completo para experimentar después.

## 27. Q&A
Cierro con una pregunta para la audiencia: ¿qué parte de una aplicación sería más útil exponer como tool? Muchas gracias.

## Notas de presentación

- Mantener las slides conceptuales en 30-60 segundos.
- Reservar más tiempo para las dos demos y dejar que la audiencia vea el cambio en la UI.
- En la demo MCP, explicar primero qué decide el LLM y qué ejecuta el servidor.
- En la demo WebMCP, mostrar siempre la página y el resultado visual de cada tool.
- Repetir la frase central al cierre: **el agente decide; cada capa ejecuta**.
