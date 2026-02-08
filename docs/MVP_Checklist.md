# Checklist de Desarrollo para Sentinel Ops MVP (v1.0)

Este documento rastrea el progreso técnico para cumplir con el alcance definido en `business/MVP_Scope.md`.

## 🟢 1. Infraestructura y Base de Datos
- [x] **Configuración de Proyecto Supabase**: Crear proyecto en plataforma.
- [x] **Esquema de Base de Datos**: Ejecutar script SQL (`src/db/schema.sql`) para crear tablas `assets`, `organizations`, `daily_logs`, etc.    
- [x] **Políticas de Seguridad (RLS)**: Implementar reglas para aislamiento de datos por `org_id`.
- [x] **Generación de Tipos**: Sincronizar tipos de TypeScript con la DB real. *(Manual)*

## 🟡 2. Módulo de Gestión de Activos (Web Admin)
- [x] **Listado de Flota**: Visualización de tarjetas con estado (Verde/Amarillo/Rojo). *(Integrado con Supabase)*
- [x] **Detalle de Activo**: Vista individual con historial completo de mantenimientos. *(Implementado)*
- [ ] **Gestión (CRUD)**: Formularios para Agregar/Editar máquinas y asignarles criticidad.
- [ ] **Generación de QR**: Botón para imprimir el código QR que se pegará en la máquina.

## 🟡 3. Mobile Checklist (PWA para Operarios)
- [x] **Interfaz de Formulario**: Pantalla de ingreso de horómetro y checks básicos. *(Implementado)*
- [x] **Captura de Evidencia**: Implementar input de cámara/fotos en `ChecklistForm`.
- [ ] **Subida de Fotos**: Configurar Bucket en Supabase y subir archivos reales. *(MANDATORIO)*
- [x] **Persistencia Offline (Dexie.js)**: Guardar reportes en IndexedDB cuando no hay señal.
- [x] **Sincronización Background**: Service Worker que envíe los datos al recuperar conexión.
- [x] **Manifiesto PWA**: Configurar iconos y `manifest.json` para que sea instalable.

## 🟡 4. Semáforo y Dashboard (Inteligencia)
- [x] **Panel de Alertas**: Visualización de alertas críticas. *(Integrado con Supabase)*
- [x] **Gráficos de Tendencia**: Componentes visuales básicos. *(Implementado)*
- [x] **Lógica de "Semáforo"**: Función en Backend (Edge Function) que analice los reportes entrantes y cambie el estado del activo automáticamente.
- [ ] **Reporte ROI**: Widget específico que calcule "Horas de Parada Evitadas" vs "Costo".

## 🔴 5. Despliegue y Validación
- [x] **CI/CD**: Configurar Vercel/Netlify para despliegue automático desde GitHub.
- [x] **Pruebas de Campo**: Validación de UX con un usuario real (simulado) en móvil.

## 🔵 6. UX & Polish (Mejoras de Experiencia)
- [x] **Industrial Dark Theme**: Diseño de alto contraste para visibilidad en campo.
- [x] **Toast Notifications**: Reemplazo de alertas nativas por notificaciones no intrusivas.
- [x] **Robusto Offline (Stale-While-Revalidate)**: Carga instantánea desde caché local.
