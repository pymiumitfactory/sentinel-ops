# Sentinel Ops: Diseño de Base de Datos y Mantenibilidad

Este documento detalla el esquema de base de datos relacional para el MVP, diseñado para ejecutarse sobre **Supabase (PostgreSQL)**, asegurando escalabilidad y facilidad de mantenimiento a largo plazo.

## 1. Diagrama de Entidades (ERD)

### A. Núcleo de Identidad y Acceso
- **`organizations`**: Empresas mineras o agroindustriales.
    - `id` (uuid, PK), `name`, `tax_id` (RUC), `industry_type` (enum: 'mining', 'agriculture'), `created_at`.
- **`profiles`**: Información extendida de usuarios vinculados a Auth.
    - `id` (uuid, PK, references auth.users), `org_id` (FK), `full_name`, `role` (enum: 'admin', 'supervisor', 'operator'), `phone`.

### B. Gestión de Activos (The "Gold" Data)
- **`assets`**: Maquinaria e infraestructura crítica.
    - `id` (uuid, PK), `org_id` (FK), `name`, `internal_id` (Placa/Código), `category` (enum: 'heavy_machinery', 'irrigation_system', 'transport'), `brand`, `model`, `current_hours` (numeric), `status` (enum: 'active', 'warning', 'down', 'maintenance'), `last_service_date`.
- **`checklists_definitions`**: Plantillas de preguntas por tipo de máquina.
    - `id` (uuid, PK), `asset_category`, `questions` (jsonb: array de {id, label, type, critical: bool}).

### C. Operación y Alertas (The "Sentinel" Logic)
- **`daily_logs`**: Reportes de los operarios.
    - `id` (uuid, PK), `asset_id` (FK), `operator_id` (FK), `hours_reading`, `answers` (jsonb), `photo_url`, `gps_location` (point), `created_at`.
- **`alerts`**: Notificaciones generadas por el sistema.
    - `id` (uuid, PK), `asset_id` (FK), `severity` (enum: 'low', 'medium', 'high'), `description`, `is_resolved` (bool), `resolved_by` (FK), `created_at`.

---

## 2. Notas para Mantenibilidad ("Future-Proofing")

Para que Sentinel Ops sea mantenible a lo largo de todo el stack, seguiremos estos principios:

### A. Capa de Base de Datos (PostgreSQL/Supabase)
- **RLS (Row Level Security):** Obligatorio. Ningún usuario puede leer datos de otra organización. La política debe ser: `org_id = user's org_id`.
- **Triggers de Auditoría:** Todas las tablas deben tener un trigger que guarde quién y cuándo modificó los registros para trazabilidad minera (ISO 9001).
- **Enums sobre Strings:** Usar tipos ENUM nativos para estados y roles para evitar errores tipográficos en el código.

### B. Capa de Aplicación (Backend/Edge Functions)
- **Validación Zod:** Usar esquemas de Zod en el frontend y backend para asegurar que la estructura del JSON de los checklists sea siempre consistente.
- **Tipado Estricto con TypeScript:** Generar tipos automáticamente desde la base de datos de Supabase (`supabase gen types typescript`).

### C. Capa de Frontend (React/PWA)
- **Patrón Repository:** No llamar a Supabase directamente desde los componentes. Usar una capa de servicios/repositorios. Así, si mañana cambiamos de base de datos, solo tocamos la capa de servicios.
- **Atomic Design:** Componentes pequeños y reutilizables (Botón, Card de Alerta, Selector de Máquina).

---

## 3. Trabajo Futuro y Escalabilidad

1. **Integración IoT (Fase 2):** El campo `daily_logs` está diseñado para recibir datos tanto de humanos como de una API de sensores sin cambiar el esquema.
2. **Offline Sync Pro:** Implementar un sistema de "optimistic UI" donde el operario vea su reporte como "enviado" aunque no haya señal, manejando la sincronización en segundo plano con estados de reintento.
3. **Multi-Región:** El uso de UUIDs como PKs permite migrar o consolidar bases de datos globales en el futuro sin colisión de IDs.

---

## 4. Script de Inicialización (SQL)
*Ubicación sugerida para el script: `/src/db/init.sql`*
