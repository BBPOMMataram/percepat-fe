/* Service Worker Web Push Notification — Portal SI MANDALIKA BBPOM di Mataram */

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = {
    title: "Pemberitahuan SI MANDALIKA",
    body: "Ada pembaruan notifikasi baru untuk Anda.",
    url: "/",
    tag: "bpom-notif",
    type: "info",
    module: "system",
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      payload = { ...payload, ...parsed };
    } catch {
      const text = event.data.text();
      if (text) payload.body = text;
    }
  }

  const options = {
    body: payload.body,
    icon: "/assets/images/bpomri_without_label.png",
    badge: "/assets/images/bpomri_without_label.png",
    tag: payload.tag || "bpom-notif",
    renotify: true,
    requireInteraction: payload.type === "danger",
    data: {
      url: payload.url || "/",
      module: payload.module || "system",
    },
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const rawUrl = event.notification?.data?.url || "/";
  const targetUrl = new URL(rawUrl, self.location.origin).href;

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === targetUrl && "focus" in client) {
            return client.focus();
          }
        }
        for (const client of clientList) {
          if (
            client.url.startsWith(self.location.origin) &&
            "focus" in client &&
            "navigate" in client
          ) {
            return client.navigate(targetUrl).then((navigated) => navigated?.focus());
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
        return undefined;
      })
  );
});
