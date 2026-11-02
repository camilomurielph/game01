# Supervivencia por Rondas

RPG de supervivencia por rondas en pixel art. Juego web (canvas) + servidor Node sin dependencias
para cuentas y ranking. Instalable como PWA.

## Controles
- Mover: WASD / flechas, o arrastrar en pantalla tactil
- Poderes: **U I O P** (o los botones en pantalla)
- Pausa: **Esc** (o el boton II)  |  Silencio: M
- El personaje ataca solo, tambien mientras se mueve (reglas de animacion en `public/sprites/LEEME.md`)

## Estructura
- `public/` juego estatico (index.html, manifest, service worker, iconos, sprites)
- `server.js` sirve `public/` y la API (`/api/register`, `/api/login`, `/api/me`, `/api/score`, `/api/leaderboard`)
- `Dockerfile` imagen node:22-alpine

## Probar en local
    PORT=3000 DATA_DIR=./data node server.js     # abre http://localhost:3000

## Despliegue en Coolify
1. Sube el repo a GitHub y crealo en Coolify (New Resource > Repository).
2. Build Pack: **Dockerfile**. Ports Exposes: **3000**.
3. **Persistent Storage**: agrega un volumen montado en `/data` (si no, el ranking se borra en cada deploy).
4. Asigna el dominio (Coolify emite HTTPS; el service worker y la PWA lo requieren) y despliega.

## Instalar como app
- iPhone: Safari > Compartir > Anadir a pantalla de inicio.
- Android: Chrome > menu > Instalar app.

## Notas
- Las contrasenas se guardan con scrypt + sal; las sesiones usan tokens aleatorios (se guarda su hash).
- Los puntajes los envia el cliente, asi que un jugador tecnico podria falsificarlos.
