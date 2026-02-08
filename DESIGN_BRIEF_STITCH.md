# Prompt de Diseño UI/UX para Sentinel Ops
**Contexto:** Aplicación PWA Offline-First para Gestión de Activos Industriales y Mantenimiento de Campo.
**Estilo Visual:** Industrial Dark Mode, Rugged, High Contrast, Minimalista.
**Usuario:** Operarios de campo con guantes/prisa (necesitan botones grandes y claridad) y Gerentes de Flota (necesitan datos densos pero limpios).

---

## Instrucciones Generales de Diseño
Diseña una interfaz de usuario completa para "Sentinel Ops" con las siguientes características:
1.  **Paleta de Colores:** 
    -   Fondo: `#0d1117` (Casi negro, GitHub Dark Dimmed).
    -   Superficies: `#161b22` (Tarjetas y paneles).
    -   Acento Primario: `#d29922` (Safety Yellow/Orange) para acciones principales.
    -   Estado OK: `#238636` (Verde terminal).
    -   Estado Alerta: `#f85149` (Rojo semáforo).
    -   Texto: `#c9d1d9` (Blanco hueso, legible).
2.  **Tipografía:** Inter o Roboto Mono para datos técnicos. Títulos en negrita fuerte (700/800).
3.  **UX Industrial:** 
    -   Targets táctiles mínimos de 48px.
    -   Bordes redondeados sutiles (4px-6px), no píldoras exageradas.
    -   Feedback visual inmediato en cada toque.

---

## Vistas a Diseñar

### 1. Pantalla de Login (The "Door")
-   **Vibe:** Segura, Búnker virtual.
-   **Elementos:**
    -   Logo minimalista (Triángulo de Alerta) centrado y brillando tenuemente.
    -   Inputs (Email/Pass) con fondo oscuro y borde sutil, que se iluminan al foco.
    -   Botón "Acceder al Sistema" ancho completo, color `#d29922`, texto negro negrita.
    -   Pie de página discreto: "Estado del Sistema: En Línea / Offline".

### 2. Dashboard Principal (The "Cockpit")
-   **Header:** Compacto. Logo a la izquierda, estado de conexión (punto verde/gris) y avatar a la derecha.
-   **Tarjetas de Métricas (Top):**
    -   *Salud de Flota:* Un gráfico de Dónut minimalista (CSS puro). Verde (Activos), Amarillo (Mant.), Gris (Offline).
    -   *Riesgo:* Tarjeta con número grande en Rojo indicando "Alertas Críticas".
-   **Grid de Activos (Cuerpo):**
    -   Lista scrolleable de tarjetas.
    -   Cada tarjeta muestra: Foto del activo (thumbnail), Nombre ("Excavadora CAT-01"), Estado (Badge de color), y última ubicación.
    -   Botón flotante (FAB) "+" en la esquina inferior derecha para agregar activo.

### 3. Detalle de Activo (The "Dossier") - *Slide-out Drawer*
-   No es una página nueva, es un panel que desliza desde la derecha (o abajo en móvil).
-   **Header del Panel:** Foto grande, Nombre del activo y Botón de "Cerrar" (X).
-   **Tabs de Navegación:** "Resumen", "Historial", "Checklist".
-   **Contenido Resumen:** Datos técnicos en grilla (Marca, Modelo, Horas de uso).
-   **Acción Principal:** Botón gigante "Iniciar Inspección" (Primary Color).

### 4. Checklist de Mantenimiento (The "Work")
-   **Filosofía:** Cero fricción.
-   **Items:** Lista de verificaciones. Cada ítem tiene 3 botones grandes: 
    -   [Pass (Verde)] [Fail (Rojo)] [N/A (Gris)].
    -   Al marcar "Fail", se despliega automáticamente un campo de texto para comentarios.
-   **Evidencia:** Botón "Agregar Foto" que abre la cámara nativa. Muestra thumbnail de la foto tomada.
-   **Firma:** Área de lienzo simple para firmar con el dedo si es necesario.
-   **Submit:** Botón "Finalizar Reporte" que, al pulsar, muestra animación de "Guardando en dispositivo..." (Offline feedback).

### 5. Historial de Logs (The "Audit")
-   Línea de tiempo vertical (Timeline).
-   Cada evento muestra: Fecha, Operador (Avatar), y un icono de estado (Check o Alerta).
-   Si hay foto, se muestra un cuadrado pequeño con la imagen.

### 6. Mapa de Flota (The "Radar")
-   Mapa oscuro (estilo CartoDB Dark Matter).
-   Pines de colores según el estado del activo (Verde/Amarillo/Rojo).
-   Al hacer clic en un pin, abre un pequeño popup con el resumen del activo y botón "Ver Detalles".

### 7. Gestión de Equipo (Admin)
-   Lista tabular limpia.
-   Columnas: Avatar, Nombre/Email, Badge de Rol (Admin/Operador).
-   Botón "Invitar" en la parte superior.

---

## Interacciones Clave (Micro-interacciones)
-   **Offline Switch:** Cuando se pierde la conexión, la barra superior debe mostrar una franja sutil naranja "Modo Offline - Datos guardados localmente".
-   **Sync Spinner:** Un icono giratorio pequeño cuando se recupera la red y suben los datos.
-   **Toast Messages:** Notificaciones negras con borde de color que aparecen abajo al completar acciones ("Activo Guardado").
