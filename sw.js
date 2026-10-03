// Black Panther: service worker só para os avisos do cronômetro (notificações que o relógio repete).
// Não guarda nada em cache e não mexe nos pedidos do site.
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
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
