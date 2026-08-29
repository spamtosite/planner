/* ПРАВКА №45: service worker — оффлайн-кеш приложения.
   При выкладке новой версии сборки меняй 'planner-v1' на 'planner-v2' и т.д. */
const CACHE='planner-v6';
const ASSETS=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png','./fav.png'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const url=new URL(e.request.url);
  /* чужие домены (Google API, GSI) не трогаем — они идут в сеть напрямую */
  if(url.origin!==location.origin)return;
  e.respondWith(
    caches.match(e.request,{ignoreSearch:true}).then(hit=>{
      const fresh=fetch(e.request).then(res=>{
        if(res&&res.ok){const cl=res.clone();caches.open(CACHE).then(c=>c.put(e.request,cl))}
        return res;
      }).catch(()=>hit);
      return hit||fresh;
    })
  );
});
