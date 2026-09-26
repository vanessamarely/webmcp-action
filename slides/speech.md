# Guion breve: MCP + WebMCP

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
El host contiene al LLM y a un cliente MCP. Ese cliente mantiene una conexión 1:1 con un servidor independiente. El servidor expone las capacidades y accede a datos, APIs o archivos. El modelo decide qué pedir, pero no accede directamente a esos sistemas.

## 07. Transportes y mensajería
`stdio` sirve muy bien cuando el cliente y el servidor viven en la misma máquina. Para conexiones HTTP usamos Streamable HTTP; ambos transportan mensajes MCP mediante JSON-RPC 2.0.

## 08. MCP Server
El MCP Server recibe la llamada del cliente y ejecuta la capacidad en un proceso independiente, local o remoto. Puede exponer tools, resources y prompts. En esta demo, `place_order` valida el pedido y actualiza el inventario.

## 09. MCP Server: código
Aquí registramos `place_order` con una descripción y un `inputSchema`. La tool encapsula la regla de negocio: validar el producto, crear el pedido y actualizar el inventario.

## 10. MCP Client
El LLM decide, el cliente descubre las tools del servidor, invoca la elegida y devuelve el resultado al modelo. Muchos hosts, como un IDE o Claude Desktop, ya incluyen este cliente: su JSON de configuración indica cómo arrancar el servidor. Aquí construimos un cliente Node propio para mostrar ese flujo y poder alternar entre Claude y Gemini; no es obligatorio escribirlo para usar un servidor MCP desde un host compatible.

## 11. Flujo del cliente
El flujo tiene tres pasos: descubrir, decidir y ejecutar. El protocolo no decide por sí solo; el LLM decide cuándo usar una tool y el cliente la invoca.

## 12. MCP Client: código
Este loop entrega el contexto al modelo, detecta un `tool_use` y llama al servidor. Luego devuelve el resultado al modelo para que continúe o termine.

## 13. Demo 1
Primero veremos las tools del servidor en MCP Inspector, dentro del navegador. Después usaré `mcp-client` para mostrar cómo un LLM elige una de esas tools, consulta el stock y realiza un pedido.

### Preparación de la Demo 1

1. Desde la slide 09, abrir MCP Inspector en una terminal nueva:

```bash
cd /Library/WebServer/Projects/webmcp-action/mcp-server
npm install
npx --yes @modelcontextprotocol/inspector
```

2. Abrir la URL local que imprime Inspector en el navegador. Elegir **STDIO** y configurar **Command** como `/Library/WebServer/Projects/webmcp-action/mcp-server/node_modules/.bin/tsx` y **Arguments** como `/Library/WebServer/Projects/webmcp-action/mcp-server/src/index.ts`. Pulsar **Connect**, entrar en **Tools** y pulsar **List Tools**: aparecen `list_products`, `get_stock`, `get_price` y `place_order`. Abrir una tool para mostrar descripción y esquema; ejecutar `get_stock` con `product_id: "auriculares"` para enseñar la respuesta. Inspector inicia su propio `mcp-server` por `stdio`: el navegador no se conecta directamente a ese transporte.

3. Volver a la slide 13 y, en otra terminal, iniciar el cliente con LLM. Este inicia una segunda instancia de `mcp-server` automáticamente; no hace falta ejecutar `npm start` dentro de `mcp-server`.

```bash
cd /Library/WebServer/Projects/webmcp-action/mcp-client
npm install
cp .env.example .env
# Completar ANTHROPIC_API_KEY en .env
npm start
```

Para usar Gemini en lugar de Claude, completar `GEMINI_API_KEY` y ejecutar:

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

4. En el REPL, listar productos, consultar stock, realizar el pedido y volver a consultar stock para mostrar el cambio. El inventario vive en memoria: Inspector y el cliente Node lanzan servidores distintos, así que **no comparar el stock entre sus ventanas**; comparar el antes y el después dentro del mismo REPL.

### Qué mostrar en pantalla durante la Demo 1

1. **Navegador / Inspector:** enseñar **Tools → List Tools**, abrir `get_stock` y señalar su descripción y `product_id`. Ejecutarla en Inspector sirve para mostrar el contrato y una respuesta directa, sin LLM.
2. **Terminal de `mcp-client`:** mostrar el arranque, especialmente `servidor conectado. Tools disponibles: list_products, get_stock, get_price, place_order` y `proveedor de LLM: Claude` (o Gemini). Esa terminal demuestra que el cliente inició y descubrió el servidor.
3. **Misma terminal, prompt `>`:** preguntar por productos, consultar auriculares, pedir dos y consultar de nuevo. Tras cada pregunta, señalar la línea `tool call: nombre({...})` y después la respuesta del modelo. En el pedido, mostrar `place_order` y comparar el stock antes y después dentro de este REPL. Los nombres y argumentos de las llamadas pueden variar según la decisión del LLM.
4. **Cambio de ventana:** Inspector enseña tools del servidor en el navegador; el REPL enseña cómo el LLM las utiliza. No proyectar el contenido de `.env` ni la URL completa de sesión de Inspector cuando aparezca en la terminal.

## 14. Qué es WebMCP
WebMCP lleva la superficie de tools al documento web. La página puede exponer su propia lógica de cliente para que un agente compatible actúe sobre la interfaz y el estado visibles.

## 15. Arquitectura WebMCP
El agente descubre las tools del documento, decide invocar una y `document.modelContext` media su ejecución en la misma lógica de la página. El resultado modifica la UI y el estado visibles; para estos cambios no hace falta un MCP Server separado.

Podemos ver qué devuelve cada acción al probar `change_color()`, `focus_view()` y `add_to_cart()`.

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

Vamos a cambiar el color y el acabado, enfocar una parte, grabar texto y añadir el producto al carrito.

### Preparación de la Demo 2

5. Después de la demo MCP, levantar la tienda en otra terminal (o mantenerla abierta desde antes):

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
Las tools de esta página son WebMCP; no son las cuatro tools del servidor mostradas en Inspector.

### Qué mostrar en pantalla durante la Demo 2

1. **Terminal de Vite:** mostrar solo que aparece `Local: http://127.0.0.1:5175/`; después pasar al navegador.
2. **Navegador / tienda:** abrir Auriculares Orbit y mantener a la vista el visor 3D, los controles y el carrito mientras se cambia el color, acabado y enfoque, se graba el texto y se añade al carrito.
3. **Resultado:** señalar el cambio visible después de cada acción. Si el agente no está disponible, usar los controles manuales de la misma página; esta demo no requiere abrir la terminal de `mcp-client` ni MCP Inspector.

## 23. Confirmation Gates
No toda tool debe ejecutarse automáticamente. Para pagar, borrar o realizar una acción irreversible, la aplicación debe mostrar el alcance y pedir una confirmación explícita.

## 24. Arquitectura del demo
El repositorio contiene tres piezas para mostrar dos recorridos distintos: la aplicación WebMCP expone acciones dentro de la página; el cliente Node inicia por `stdio` el servidor MCP con el inventario y conecta un LLM. La web de esta demo no llama directamente al servidor MCP.

## 25. Para llevarte
La idea central es simple: MCP estandariza la conexión con servicios; WebMCP estandariza cómo una página expone acciones a un agente. El agente decide, pero cada capa ejecuta en su propio contexto.

## 26. Recursos
Aquí están la especificación de MCP, la propuesta de WebMCP, la documentación de Chrome y el código completo para experimentar después.

## 27. Q&A
Cierro con una pregunta para la audiencia: ¿qué parte de una aplicación sería más útil exponer como tool? Muchas gracias.
