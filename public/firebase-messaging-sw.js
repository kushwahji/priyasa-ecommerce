/* Firebase Messaging service worker. The page sends the Firebase config before requesting its FCM token. */
importScripts('https://www.gstatic.com/firebasejs/12.4.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.4.0/firebase-messaging-compat.js');

let initialized=false;
self.addEventListener('message',event=>{
  if(event.data?.type!=='INIT_FIREBASE'||initialized)return;
  try{
    firebase.initializeApp(event.data.config);
    initialized=true;
    const messaging=firebase.messaging();
    messaging.onBackgroundMessage(payload=>{
      const notification=payload.notification||{};
      const title=notification.title||'PRIYASA';
      const options={body:notification.body||'You have an update from Priyasa.',icon:notification.icon||'/icon-192.png',data:payload.data||{}};
      self.registration.showNotification(title,options);
    });
  }catch(error){console.error('Priyasa FCM init failed',error);}
});

self.addEventListener('notificationclick',event=>{
  event.notification.close();
  event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{
    const existing=list.find(c=>c.url.includes(self.location.origin));
    if(existing)return existing.focus();
    return clients.openWindow('/');
  }));
});
