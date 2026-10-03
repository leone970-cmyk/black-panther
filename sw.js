// Black Panther: service worker só para os avisos do cronômetro (notificações que o relógio repete).
// Não guarda nada em cache e não mexe nos pedidos do site.
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
// tocar no aviso: volta para a aba do app (ou abre o app, se a aba foi fechada)
self.addEventListener('notificationclick',e=>{
  e.notification.close();
  const scope=self.registration.scope;let url=(e.notification.data&&e.notification.data.url)||scope;
  if(typeof url!=='string'||!url.startsWith(scope))url=scope;
  e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(cs=>{
    const c=cs.find(x=>x.url.split('#')[0]===url)||cs.find(x=>x.url.startsWith(scope));
    if(c&&'focus' in c)return c.focus();
    if(self.clients.openWindow)return self.clients.openWindow(url);
  }));
});
