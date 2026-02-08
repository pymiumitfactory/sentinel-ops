# Sentinel Ops: Arquitectura Técnica Inicial

Para asegurar que Sentinel Ops sea escalable y robusto desde el inicio, utilizaremos un stack moderno y eficiente diseñado para iteraciones rápidas.

## 1. Stack Tecnológico Sugerido

| Capa | Tecnología | Justificación |
| :--- | :--- | :--- |
| **Frontend** | React + Vite + Tailwind CSS | Velocidad de desarrollo y excelente UX/UI. |
| **Mobile** | PWA (Progressive Web App) | No requiere descarga en App Store, soporte offline nativo vía Service Workers. |
| **Backend** | Supabase (PostgreSQL) | Auth lista para usar, DB relacional sólida y APIs automáticas. |
| **Hosting** | Vercel / Netlify | Despliegue continuo (CI/CD) fácil y gratuito para el MVP. |
| **Alertas** | Twilio / SendGrid | Integración sencilla para notificaciones críticas. |

## 2. Estructura de Datos (Esquema Inicial de Base de Datos)
*A desarrollar en `Data_Schema.md` próximamente.*

### Entidades Principales:
1. **Organizations:** Empresas clientes.
2. **Users:** Operadores, Supervisores y Administradores (RBAC).
3. **Assets (Activos):** Las máquinas con su metadata técnica.
4. **Logs (Chequeos):** Cada reporte diario enviado por el operario.
5. **Incidents (Incidentes):** Alarmas generadas por el sistema o reportadas manualmente.
6. **MaintenanceLogs:** Registro de cuando una máquina fue efectivamente reparada.

## 3. Estrategia de Sincronización Offline
Utilizaremos **IndexedDB** a través de una librería como `Dexie.js` para persistir los reportes de los operarios en el navegador del celular. Al recuperar la conexión a internet, un proceso de background sincronizará las entradas pendientes con la base de datos central en Supabase.
