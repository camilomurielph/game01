#!/usr/bin/env python3
"""Convierte las hojas de sprites originales (fondo verde, JPG) en atlas PNG transparentes para el juego.
Uso:  python3 tools/build_atlas.py        (requiere pillow, numpy, scipy)
Entrada: sprites_src/{guerrero,mago,asesino,barbaro}.jpg   Salida: public/sprites/{guerrero,hechicero,asesino,barbaro}.png
Atlas: 13 columnas x 6 filas de cuadros de 80x48 px. Filas: 0 camina abajo(10) 1 camina arriba(9) 2 camina lado(13)
       3 ataque lado(6) 4 ataque arriba(6) 5 ataque/skills extra(8). El pie del personaje queda en (40,44) de cada cuadro."""
import numpy as np, os
from PIL import Image
from scipy import ndimage as ndi
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BG=np.array([67,161,125]);EDGES=[243,483,722,958,1207];COUNTS=[10,9,13,6,6,8]
S=6;CW,CH,AX,AY=80,48,40,44
NAMES={'guerrero':'guerrero','mago':'hechicero','asesino':'asesino','barbaro':'barbaro'}
def split_rows(m):
    """Divide la imagen en filas (en el hueco mas limpio cerca de cada borde) y cada fila en cuadros por huecos verticales."""
    cuts=[0]+[min(range(e-8,e+8),key=lambda y:m[y].sum()) for e in EDGES]+[m.shape[0]]
    rows=[]
    for r in range(6):
        y0,y1=cuts[r],cuts[r+1];on=np.nonzero(m[y0:y1].sum(0)>0)[0]
        runs=[(g[0],g[-1]+1) for g in np.split(on,np.where(np.diff(on)>8)[0]+1)]
        area=[int(m[y0:y1,a:b].sum()) for a,b in runs];big=[list(runs[i]) for i,a in enumerate(area) if a>=800]
        for i,a in enumerate(area):                              # chispas sueltas se unen al cuadro mas cercano
            if a<800 and a>=15:
                b=min(big,key=lambda b:max(b[0]-runs[i][1],runs[i][0]-b[1],0))
                if max(b[0]-runs[i][1],runs[i][0]-b[1],0)<40:b[0]=min(b[0],runs[i][0]);b[1]=max(b[1],runs[i][1])
        frames=[]
        for x0,x1 in sorted(big):
            ys,xs=np.nonzero(m[y0:y1,x0:x1]);frames.append((ys+y0,xs+x0))
        assert len(frames)==COUNTS[r],(r,len(frames),COUNTS[r]);rows.append(frames)
    return rows
def build(src,dst):
    a=np.array(Image.open(src).convert('RGB')).astype(int);d=np.sqrt(((a-BG)**2).sum(2));luma=a.mean(2)
    m=ndi.binary_opening(d>45,iterations=1);rows=split_rows(m)
    atlas=Image.new('RGBA',(13*CW,6*CH),(0,0,0,0));clipped=0
    for r,row in enumerate(rows):
        med=int(np.median([ys.max() for ys,xs in row]))
        for col,(ys,xs) in enumerate(row):
            bottom=int(np.clip(ys.max(),med-10,med+10));sel=(ys>bottom-36)&(luma[ys,xs]<130)
            fx=xs[sel].mean() if sel.sum()>20 else (xs.min()+xs.max())/2
            ty=ys+(AY*S-bottom);tx=xs+int(AX*S-fx);ok=(ty>=0)&(ty<CH*S)&(tx>=0)&(tx<CW*S);clipped+=int((~ok).sum()>30)
            A=np.zeros((CH*S,CW*S));C=np.zeros((CH*S,CW*S,3));Wt=np.zeros((CH*S,CW*S))
            A[ty[ok],tx[ok]]=1;C[ty[ok],tx[ok]]=a[ys[ok],xs[ok]];Wt[ty[ok],tx[ok]]=(d[ys[ok],xs[ok]]>70)
            al=A.reshape(CH,S,CW,S).mean((1,3));w=Wt.reshape(CH,S,CW,S).sum((1,3));wa=A.reshape(CH,S,CW,S).sum((1,3))
            cs=(C*Wt[...,None]).reshape(CH,S,CW,S,3).sum((1,3));ca=(C*A[...,None]).reshape(CH,S,CW,S,3).sum((1,3))
            col_=np.where(w[...,None]>0,cs/np.maximum(w,1)[...,None],ca/np.maximum(wa,1)[...,None])
            atlas.paste(Image.fromarray(np.dstack([col_,np.where(al>.4,255,0)]).astype(np.uint8),'RGBA'),(col*CW,r*CH))
    atlas.save(dst,optimize=True);print(os.path.basename(dst),atlas.size,'frames con recorte:',clipped)
if __name__=='__main__':
    os.makedirs(f'{ROOT}/public/sprites',exist_ok=True)
    for k,v in NAMES.items():build(f'{ROOT}/sprites_src/{k}.jpg',f'{ROOT}/public/sprites/{v}.png')
