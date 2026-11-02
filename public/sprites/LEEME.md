# Sprites de los personajes

Hoy las 4 clases usan los sprites del Guerrero. Todo el sistema esta en `public/index.html`, en el bloque
**SISTEMA DE SPRITES Y ANIMACION** (busca ese titulo). Ahi estan `SPRITES`, `ANIM_DEF` y `ANIM_RULES`.

## Archivos
Hojas horizontales de 4 cuadros de 32x32 (formato "Sheet" de Aseprite). Nombre: `<prefijo>_<animacion>.png` y `<prefijo>_<animacion>_back.png`.

| Animacion   | Archivo (normal / back)                              | Cuando se usa                                 |
|-------------|------------------------------------------------------|-----------------------------------------------|
| idle        | `guerrero_idle.png` / `guerrero_idle_back.png`       | quieto, respirando                            |
| caminando   | `guerrero_caminando.png` / `..._back.png`            | movimiento lento                              |
| corriendo   | `guerrero_corriendo.png` / `..._back.png`            | velocidad alta (mas de `runSpeed`)            |
| atacando    | `guerrero_atacando.png` / `..._back.png`             | ataque y, por ahora, los 4 poderes            |

## Orientacion
- Sprite normal = mirando **abajo-derecha**. Sprite `_back` = mirando **arriba-derecha**.
- Abajo-izquierda y arriba-izquierda = los mismos sprites **espejados**.
- Al atacar, el personaje mira hacia el enemigo mas cercano; al moverse, hacia donde camina.

## Reglas (ANIM_RULES) y hitbox
- Puedes moverte y atacar a la vez. Como no hay sprite de "atacar corriendo", **en movimiento se ve caminar/correr** y el ataque o poder se aplica igual; la animacion de ataque se ve cuando estas quieto. Si te mueves a mitad de un ataque, el golpe pendiente se aplica al instante y pasas a caminar.
- Interruptores en `ANIM_RULES` (todos en `false` ahora): `attackNeedsIdle` y `skillsNeedIdle` (solo atacar/lanzar poderes quieto), `lockWhileActing` (no moverse al atacar), `finishCycle` (terminar el ciclo de caminar al soltar). `moveAnimPriority:true` es lo que muestra caminar/correr mientras te mueves.
- El golpe/efecto se aplica en el cuadro `hit` de la animacion (cuadro 1 del ataque).
- **Tamano y hitbox:** la altura del personaje se ajusta sola para medir lo mismo que el arquero (28 px): `scale:null` en `ANIM_DEF` calcula `REF_H / bodyH`. El hitbox se escala con el sprite: su centro es el centro del cuerpo (`cy`) y su radio es `hitR` (a escala 1). Si tus sprites nuevos tienen otro tamano, ajusta `bodyH` (altura visible), `cy` (centro del cuerpo) y `ay` (pies); o fija un `scale` numerico.
- Teclas: poderes **U I O P**, pausa **Esc**.

## Ataque caminando y corriendo
El sistema ya los espera: cuando pongas los PNG en esta carpeta se usan solos, sin tocar codigo.

| Animacion        | Archivos (normal y back)                                                   | Se usa cuando                           |
|------------------|-----------------------------------------------------------------------------|-----------------------------------------|
| atacar caminando | `guerrero_caminando_atacando.png` y `guerrero_caminando_atacando_back.png`  | atacas o lanzas un poder a baja velocidad |
| atacar corriendo | `guerrero_corriendo_atacando.png` y `guerrero_corriendo_atacando_back.png`  | atacas o lanzas un poder a alta velocidad |

- Si tus archivos tienen otro nombre, cambia `file` en `ANIM_DEF` (`walkattack` y `runattack`). Si tienen otro numero de cuadros, cambia `n`; y `hit` es el cuadro del golpe.
- Si falta alguno, esa velocidad sigue mostrando caminar/correr y el golpe se aplica igual.
- Los poderes tambien usan estas animaciones al lanzarse en movimiento (hasta que tengan las suyas).
- Para otra clase, ponle sus archivos con su prefijo (ver abajo) y se usan igual.

## Cambiar los sprites del hechicero, asesino o barbaro
1. Pon sus 8 PNG en esta carpeta: `hechicero_idle.png`, `hechicero_idle_back.png`, `hechicero_caminando.png`, ... `hechicero_atacando_back.png`.
2. En `SPRITES` cambia `hechicero:{prefix:'guerrero'}` por `hechicero:{prefix:'hechicero'}`.
3. Si su hoja tiene otro tamano o numero de cuadros, agrega esos datos en la misma entrada:
   `hechicero:{prefix:'hechicero',fw:48,fh:48,ax:24,ay:44,anims:{walk:{file:'caminando',n:6,fps:10}}}`

## Poderes con sprites propios
Cada poder (`skill1` a `skill4`) usa hoy la animacion `attack`. Para darle una propia:
`hechicero:{prefix:'hechicero',anims:{skill1:{file:'poder1',n:6,hit:3}}}` y crea `hechicero_poder1.png` / `hechicero_poder1_back.png`.
(`hit` es el cuadro en el que se aplica el efecto del poder.)

La carpeta `archive/` guarda las hojas y el script de la version anterior (no se despliega).
