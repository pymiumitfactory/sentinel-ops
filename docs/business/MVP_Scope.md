El objetivo del MVP de **Sentinel Ops** es validar la hipótesis central en sectores extractivos e industriales: *¿Puede una captura simple de datos operativos prevenir paradas críticas y ahorrar millones en Minería y Gran Agricultura?*

## 1. Módulos Core del MVP

### A. Gestión de Activos Críticos (Minería y Agro)
- Registro de perfil de maquinaria pesada/línea amarilla (Perforadoras, Excavadoras, Tractores, Cosechadoras).
- Clasificación por criticidad operativa en tajo o campo.
- Ficha técnica digital accesible por QR (opcional).

### B. Sentinel Mobile Checklist (Captura de Campo)
- Interfaz Progresiva (PWA) optimizada para baja conectividad.
- "Checklist de Bienestar": 5 a 10 preguntas clave diarias (ej. ¿Nivel de aceite OK? ¿Ruidos extraños? ¿Fugas visibles?).
- Carga de fotos de evidencia directamente desde la cámara del celular.
- Funcionamiento Offline: Los datos se guardan localmente y se sincronizan al detectar señal.

### C. Semáforo de Riesgo (Panel de Control)
- Dashboard centralizado para el Gerente de Operaciones.
- Visualización de estado por colores:
    - **VERDE:** Operación normal.
    - **AMARILLO:** Anomalía detectada (ej. subida de temperatura recurrente), requiere inspección.
    - **ROJO:** Riesgo inminente de parada o mantenimiento vencido.
- Reporte automático de "Horas Hombre" vs "Horas Máquina".

## 2. Indicadores de Éxito (KPIs del MVP)
- Reducción del tiempo de reporte (de papel a digital).
- Detección de al menos 1 falla potencial antes de que ocurra la parada.
- Adopción del operario (facilidad de uso).

## 3. Lo que NO incluye el MVP (Exclusiones)
- Integración con dispositivos IoT/Sensores automáticos (se hará manual vía operario).
- Modelos de Deep Learning complejos (se usarán reglas heurísticas iniciales).
- Gestión de compras y almacén de repuestos completa.
