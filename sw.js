// Black Panther: service worker.
// 1) Site guardado no aparelho para abrir sem internet: as páginas (index.html, banco.html) e o config.js vão pela rede
//    primeiro (versão nova sempre que tem internet) e, sem internet ou com a rede travada, saem da cópia guardada.
//    As bibliotecas fixas (React, Supabase, fontes do Google) ficam guardadas e saem da cópia.
//    Nunca guarda dados: chamadas ao Supabase, Strava, IA, imagens de outros sites e qualquer .json passam direto pela rede.
// 2) Avisos do cronômetro: tocar no aviso volta para a aba do app que mandou.
const V='bp-site-v1';   // trocar o número apaga a cópia antiga no próximo acesso
const SCOPE=self.registration.scope;   // https://ultrahybrid.com.br/ ou https://leone970-cmyk.github.io/black-panther/
const ROOT=new URL(SCOPE).pathname;
const HOME=new URL('./',SCOPE).href,BANCO=new URL('banco.html',SCOPE).href,CONFIG=new URL('config.js',SCOPE).href;
const LIBS=['https://unpkg.com/react@18.3.1/umd/react.production.min.js','https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js','https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2'];
const LIB_HOSTS=['unpkg.com','cdn.jsdelivr.net','fonts.googleapis.com','fonts.gstatic.com'];

const okPage=r=>r&&r.ok&&!r.redirected&&r.type==='basic';
async function keep(key,res){try{const c=await caches.open(V);await c.put(key,res);}catch(e){}}

self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil((async()=>{
  const c=await caches.open(V);
  await Promise.all([
    ...[HOME,BANCO,CONFIG].map(u=>fetch(new Request(u,{cache:'no-cache'})).then(r=>okPage(r)?c.put(u,r):null).catch(()=>null)),
    ...LIBS.map(u=>c.match(u).then(h=>h||fetch(new Request(u,{mode:'cors',credentials:'omit'})).then(r=>r.ok?c.put(u,r):null)).catch(()=>null))]);
})());});
self.addEventListener('activate',e=>e.waitUntil((async()=>{
  for(const k of await caches.keys())if(k.startsWith('bp-site-')&&k!==V)await caches.delete(k);
  await self.clients.claim();
})()));

// página: rede primeiro; sem internet (ou rede que não responde em ms) usa a cópia; a resposta nova sempre atualiza a cópia
async function netFirst(req,key,ms){
  const c=await caches.open(V);
  const net=fetch(req).then(r=>{if(okPage(r))keep(key,r.clone());return r;});
  const hit=await c.match(key);
  if(!hit)return net;
  return new Promise(res=>{let done=false;const t=setTimeout(()=>{if(!done){done=true;res(hit);}},ms);
    net.then(r=>{if(done)return;done=true;clearTimeout(t);res(r.ok||r.type==='opaqueredirect'?r:hit);},()=>{if(done)return;done=true;clearTimeout(t);res(hit);});});
}
// biblioteca com versão fixa: cópia guardada primeiro; se não tem, busca (com CORS, para não guardar resposta opaca)
async function cacheFirst(req){
  const c=await caches.open(V),hit=await c.match(req.url);if(hit)return hit;
  try{const r=await fetch(new Request(req.url,{mode:'cors',credentials:'omit'}));if(r.ok)keep(req.url,r.clone());return r;}
  catch(e){return fetch(req);}
}
self.addEventListener('fetch',e=>{
  const req=e.request;if(req.method!=='GET')return;let u;try{u=new URL(req.url);}catch(x){return;}
  if(/\.json$/i.test(u.pathname))return;   // dados nunca entram na cópia
  if(u.origin===self.location.origin){
    if(req.mode==='navigate'){
      const p=u.pathname,key=p===ROOT||p===ROOT+'index.html'?HOME:p===ROOT+'banco.html'?BANCO:null;
      if(key)e.respondWith(netFirst(req,key,4000));
      return;
    }
    if(u.pathname===ROOT+'config.js')e.respondWith(netFirst(req,CONFIG,3000));
    return;
  }
  const lib=LIB_HOSTS.includes(u.hostname)&&(u.hostname.startsWith('fonts.')||/@\d/.test(u.pathname));
  if(lib)e.respondWith(cacheFirst(req));
});

// tocar no aviso: volta para a aba do app que mandou (nunca a tela da TV), ou abre o app se a aba foi fechada
function bpPick(cs,url,scope){
  const app=c=>c.url.startsWith(scope)&&!/[?&]tv(=|&|$)/.test(c.url);
  return cs.find(c=>c.url.split('#')[0]===url&&app(c))||cs.find(c=>app(c)&&c.focused)||cs.find(app)||null;
}
self.addEventListener('notificationclick',e=>{
  e.notification.close();
  const scope=self.registration.scope;let url=(e.notification.data&&e.notification.data.url)||scope;
  if(typeof url!=='string'||!url.startsWith(scope)||/[?&]tv(=|&|$)/.test(url))url=scope;
  e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(cs=>{
    const c=bpPick(cs,url,scope);
    if(c&&'focus' in c)return c.focus();
    if(self.clients.openWindow)return self.clients.openWindow(url);
  }));
});
