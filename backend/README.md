# Backend — CEA Fénix + La Nacional Mocoa

Servidor Node.js + Express con PostgreSQL. Sirve ambos frontends y el dashboard.

## Estructura del proyecto completo

```
proyecto_cea/
├── backend/          ← este repositorio
│   ├── server/app.js ← punto de entrada
│   ├── dashboard/    ← panel de administración
│   └── package.json
├── ceafenix/         ← frontend CEA Fénix (repo separado)
└── cealanacional/    ← frontend La Nacional Mocoa (repo separado)
```

## Correr en local (con PostgreSQL instalado)

```bash
# 1. Instalar dependencias
cd backend
npm install

# 2. Crear base de datos en PostgreSQL local
# psql -U postgres -c "CREATE DATABASE cea_db;"

# 3. Configurar variables de entorno
cp .env.example .env
# Edita .env con tu DATABASE_URL local

# 4. Arrancar
npm run dev
```

## URLs locales

- CEA Fénix:   http://localhost:3000/
- La Nacional: http://localhost:3000/lanacional
- Dashboard:   http://localhost:3000/dashboard/login.html
- Credenciales: admin/admin123 | gerente/gerente123

## Despliegue en Railway

1. Crear nuevo proyecto en Railway
2. Conectar este repositorio de GitHub
3. Agregar plugin PostgreSQL en Railway (crea DATABASE_URL automáticamente)
4. En Variables de entorno agregar:
   - SECRET=tu_clave_secreta_segura
   - NODE_ENV=production
5. Railway detecta el package.json y corre `npm start` automáticamente

## Variables de entorno requeridas en producción

| Variable       | Descripción                          |
|----------------|--------------------------------------|
| DATABASE_URL   | Railway la genera automáticamente    |
| SECRET         | Clave JWT — elige una clave segura   |
| NODE_ENV       | production                           |
| PORT           | Railway la asigna automáticamente    |


## Despliegue en Heroku