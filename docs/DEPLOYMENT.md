# Guía de Despliegue para Sentinel Ops MVP

## 1. Preparar Repositorio Git
Asegúrate de que tu código está en GitHub:
```bash
git init
git add .
git commit -m "MVP Ready for Deploy"
# Crea un repo en GitHub y sigue las instrucciones para hacer push:
git remote add origin https://github.com/TU_USUARIO/sentinel-ops.git
git push -u origin main
```

## 2. Desplegar en Vercel
1.  Ve a [vercel.com](https://vercel.com) e inicia sesión.
2.  Haz clic en **"Add New..."** button -> **Project**.
3.  Selecciona tu repositorio de GitHub `sentinel-ops`.
4.  Vercel detectará que es un proyecto **Vite**.

## 3. Configurar Variables de Entorno (IMPORTANTE)
Antes de darle a "Deploy", despliega la sección **Environment Variables** y agrega las mismas que tienes en tu `.env` local:

| Key | Value |
| --- | --- |
| `VITE_SUPABASE_URL` | `https://tu-proyecto.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (Tu clave larga) |

> **Nota**: Sin estas variables, la aplicación fallará al intentar conectarse a la base de datos desde internet.

## 4. Finalizar
Haz clic en **Deploy**.
En unos segundos tendrás una URL como `https://sentinel-ops.vercel.app`.
¡Ábrela en tu celular para probar la PWA!
