/* RISE 서비스 워커: 화면 파일(같은 주소의 GET)만 기기에 담아 두고 바로 연다. 서버(앱스 스크립트)로 가는 요청은 건드리지 않는다.
   화면은 담아 둔 것을 먼저 보여 주고, 뒤에서 새 판을 받아 둔다(다음에 열 때 새 판). */
const V='rise-shell-f0c9c75bc7';
const SHELL=['./','./index.html','./manifest.webmanifest'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL.map(u=>new Request(u,{cache:'reload'})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.indexOf('rise-shell-f0c9c75bc7')===0&&k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const u=new URL(r.url);if(u.origin!==self.location.origin)return;
  e.respondWith(caches.open(V).then(c=>c.match(r,{ignoreSearch:true}).then(hit=>{
    /* 화면(페이지) 요청은 브라우저 저장본(10분) 말고 서버에 확인해서 받는다. navigate 요청은 옵션을 붙일 수 없어 주소로 새로 만든다 */
    const net=fetch(r.mode==='navigate'||u.pathname.endsWith('.html')||u.pathname.endsWith('/')?new Request(r.url,{cache:'no-cache',credentials:'same-origin'}):r).then(res=>{if(res&&res.ok)c.put(r,res.clone());return res}).catch(()=>hit);
    return hit||net;
  })));
});
/* 앱 알림: 서버가 암호화해 보낸 내용({t 제목, b 내용, tag, u})을 띄운다. 누르면 앱을 연다 */
self.addEventListener('push',e=>{
  let d={};try{d=e.data?e.data.json():{}}catch(x){d={t:'RISE',b:e.data?e.data.text():''}}
  e.waitUntil(self.registration.showNotification(d.t||'RISE',{body:d.b||'',tag:d.tag||'rise',renotify:true,icon:'icon-192.png',badge:'icon-192.png',data:{u:d.u||'./'}}));
});
self.addEventListener('notificationclick',e=>{
  e.notification.close();
  const sc=self.registration.scope,u=new URL((e.notification.data&&e.notification.data.u)||'./',sc).href;
  e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(ws=>{for(const w of ws){if(w.url.indexOf(sc)===0&&'focus' in w){if(u!==sc&&'navigate' in w)return w.navigate(u).then(x=>x&&x.focus());return w.focus()}}return self.clients.openWindow(u)}));
});
