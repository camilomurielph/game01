const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const PORT=+process.env.PORT||3000,DATA=process.env.DATA_DIR||'/data',FILE=path.join(DATA,'db.json'),PUB=path.join(__dirname,'public');
const MIME={'.html':'text/html; charset=utf-8','.js':'application/javascript','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png','.md':'text/plain; charset=utf-8'};
fs.mkdirSync(DATA,{recursive:true});
let db={users:{}};try{db=JSON.parse(fs.readFileSync(FILE,'utf8'))}catch(e){}
function save(){const t=FILE+'.tmp';fs.writeFileSync(t,JSON.stringify(db));fs.renameSync(t,FILE)}
const sha=s=>crypto.createHash('sha256').update(s).digest('hex'),hp=(p,s)=>crypto.scryptSync(p,s,32).toString('hex');
const hits=new Map();function limited(k,max){const n=Date.now(),a=(hits.get(k)||[]).filter(t=>n-t<60000);a.push(n);hits.set(k,a);return a.length>max}
setInterval(()=>hits.clear(),600000).unref();
const send=(res,c,o)=>{res.writeHead(c,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(o))};
const readBody=req=>new Promise(r=>{let b='';req.on('data',d=>{b+=d;if(b.length>2000)req.destroy()});req.on('end',()=>{try{r(JSON.parse(b))}catch(e){r({})}})});
const who=req=>{const t=(req.headers.authorization||'').slice(7);if(!t)return null;const h=sha(t);return Object.values(db.users).find(u=>(u.toks||[]).includes(h))||null};
const ranked=()=>Object.values(db.users).filter(u=>u.best>0).sort((a,b)=>b.best-a.best||a.at-b.at);
const rank=u=>{const i=ranked().indexOf(u);return i<0?0:i+1};
function session(u){const t=crypto.randomBytes(24).toString('hex');u.toks=(u.toks||[]).concat(sha(t)).slice(-5);save();return{token:t,name:u.name,best:u.best,rank:rank(u)}}
http.createServer(async(req,res)=>{try{
 const ip=(req.headers['x-forwarded-for']||req.socket.remoteAddress||'').split(',')[0].trim(),url=new URL(req.url,'http://x');
 if(url.pathname.startsWith('/api/')){
  if(limited(ip,90))return send(res,429,{error:'Demasiadas peticiones, espera un momento'});
  const r=url.pathname.slice(5);
  if(req.method=='POST'&&(r=='register'||r=='login')){
   if(limited('a'+ip,12))return send(res,429,{error:'Demasiados intentos, espera un minuto'});
   const b=await readBody(req),name=String(b.name||''),pass=String(b.pass||''),key=name.toLowerCase();
   if(r=='register'){
    if(!/^[A-Za-z0-9_]{3,16}$/.test(name))return send(res,400,{error:'Usuario: 3-16 letras, numeros o _'});
    if(pass.length<6||pass.length>64)return send(res,400,{error:'Contrasena: minimo 6 caracteres'});
    if(db.users[key])return send(res,409,{error:'Ese usuario ya existe'});
    const salt=crypto.randomBytes(16).toString('hex');db.users[key]={name,salt,h:hp(pass,salt),best:0,at:Date.now(),toks:[]};return send(res,200,session(db.users[key]))}
   const u=db.users[key];
   if(!u||!crypto.timingSafeEqual(Buffer.from(hp(pass,u.salt)),Buffer.from(u.h)))return send(res,401,{error:'Usuario o contrasena incorrectos'});
   return send(res,200,session(u))}
  if(r=='leaderboard')return send(res,200,{top:ranked().slice(0,20).map(u=>({name:u.name,best:u.best}))});
  const u=who(req);if(!u)return send(res,401,{error:'Sesion invalida'});
  if(r=='me')return send(res,200,{name:u.name,best:u.best,rank:rank(u)});
  if(r=='score'&&req.method=='POST'){const b=await readBody(req),n=Math.floor(+b.round);
   if(!(n>=1&&n<=500))return send(res,400,{error:'Puntaje invalido'});
   if(n>u.best){u.best=n;u.at=Date.now();save()}return send(res,200,{best:u.best,rank:rank(u)})}
  return send(res,404,{error:'No encontrado'})}
 let p=decodeURIComponent(url.pathname);if(p.endsWith('/'))p+='index.html';const f=path.join(PUB,p);
 if(!f.startsWith(PUB+path.sep)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){res.writeHead(404);return res.end('No encontrado')}
 res.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream','Cache-Control':(p=='/sw.js'||p=='/index.html')?'no-cache':'public, max-age=3600'});fs.createReadStream(f).pipe(res)
}catch(e){send(res,500,{error:'Error del servidor'})}}).listen(PORT,()=>console.log('Escuchando en '+PORT));
