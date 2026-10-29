# Supervivencia por Rondas

RPG rápido de supervivencia por rondas con pixel art. 4 clases, jefes, puntos de control y biomas.
Todo el juego es un único archivo estático: `index.html` (sin dependencias, sin build).

## Controles
- Mover: WASD / flechas, o arrastrar en pantalla táctil
- Habilidades: teclas 1-4 o los botones en pantalla
- Pausa: P o Esc  |  Silencio: M

## Probar en local
Abre `index.html` en el navegador, o:
    python3 -m http.server 8080

## Desplegar en Coolify (VPS)
1. Sube esta carpeta a un repositorio de GitHub.
2. En Coolify: New Resource > Public/Private Repository > elige el repo y la rama.
3. Build Pack: **Dockerfile** (Port: 80). Alternativa: **Static** con directorio base `/`.
4. Asigna tu dominio y pulsa Deploy.
