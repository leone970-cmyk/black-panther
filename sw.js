// Black Panther: service worker só para os avisos do cronômetro (notificações que o relógio repete).
// Não guarda nada em cache e não mexe nos pedidos do site.
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('notificationclick',e=>{e.notification.close();e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(cs=>{for(const c of cs){if('focus' in c)return c.focus();}}));});
