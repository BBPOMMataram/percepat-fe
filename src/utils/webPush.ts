import api from "@/utils/axios";

export type PushPermissionState = NotificationPermission | "unsupported";

export function isWebPushSupported(): boolean {
  if (typeof window === "undefined") return false;
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window &&
    window.isSecureContext
  );
}

export function getPushPermissionState(): PushPermissionState {
  if (!isWebPushSupported()) return "unsupported";
  return Notification.permission;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64Url(buffer: ArrayBuffer | null): string {
  if (!buffer) return "";
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration("/sw.js");
  if (existing) {
    return existing;
  }
  await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  return navigator.serviceWorker.ready;
}

async function fetchVapidPublicKey(authUrl: string): Promise<string | null> {
  const res = await api.get(`${authUrl}/api/push/vapid-public-key`);
  return res.data?.public_key || null;
}

async function sendSubscriptionToBackend(
  authUrl: string,
  subscription: PushSubscription
): Promise<void> {
  const json = subscription.toJSON();
  const p256dh = json.keys?.p256dh || arrayBufferToBase64Url(subscription.getKey("p256dh"));
  const auth = json.keys?.auth || arrayBufferToBase64Url(subscription.getKey("auth"));

  await api.post(`${authUrl}/api/push/subscribe`, {
    endpoint: subscription.endpoint,
    keys: { p256dh, auth },
    content_encoding: "aes128gcm",
  });
}

export async function getExistingPushSubscription(): Promise<PushSubscription | null> {
  if (!isWebPushSupported()) return null;
  try {
    const reg = await navigator.serviceWorker.getRegistration("/sw.js");
    if (!reg) return null;
    return await reg.pushManager.getSubscription();
  } catch {
    return null;
  }
}

/**
 * Minta izin notifikasi ke browser, daftarkan Service Worker, dan simpan subscription ke Auth-BPOM.
 */
export async function subscribeWebPush(authUrl: string): Promise<{
  ok: boolean;
  status: "subscribed" | "denied" | "unsupported" | "error";
  message?: string;
}> {
  if (!isWebPushSupported()) {
    return {
      ok: false,
      status: "unsupported",
      message: "Browser ini belum mendukung Web Push Notification (atau belum menggunakan HTTPS).",
    };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return {
        ok: false,
        status: "denied",
        message: "Izin notifikasi ditolak oleh pengguna atau diblokir di browser.",
      };
    }

    const vapidPublicKey = await fetchVapidPublicKey(authUrl);
    if (!vapidPublicKey) {
      return {
        ok: false,
        status: "error",
        message: "Kunci VAPID server belum tersedia.",
      };
    }

    const registration = await getServiceWorkerRegistration();
    let subscription = await registration.pushManager.getSubscription();

    // Jika sudah ada subscription tapi VAPID key server berubah, perbarui subscription
    if (subscription) {
      const existingKey = arrayBufferToBase64Url(subscription.options.applicationServerKey);
      if (existingKey && existingKey !== vapidPublicKey) {
        await subscription.unsubscribe();
        subscription = null;
      }
    }

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
    }

    await sendSubscriptionToBackend(authUrl, subscription);

    return { ok: true, status: "subscribed" };
  } catch (err: any) {
    console.error("Gagal mengaktifkan Web Push:", err);
    return {
      ok: false,
      status: "error",
      message: err?.response?.data?.message || err?.message || "Gagal mengaktifkan notifikasi perangkat.",
    };
  }
}

/**
 * Sinkronisasi diam-diam saat user login & browser sudah memberikan izin notifikasi sebelumnya.
 */
export async function syncWebPushIfGranted(authUrl: string): Promise<boolean> {
  if (!isWebPushSupported() || Notification.permission !== "granted") {
    return false;
  }

  try {
    const registration = await getServiceWorkerRegistration();
    let subscription = await registration.pushManager.getSubscription();

    const vapidPublicKey = await fetchVapidPublicKey(authUrl);
    if (!vapidPublicKey) return false;

    if (subscription) {
      const existingKey = arrayBufferToBase64Url(subscription.options.applicationServerKey);
      if (existingKey && existingKey !== vapidPublicKey) {
        await subscription.unsubscribe();
        subscription = null;
      }
    }

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
    }

    await sendSubscriptionToBackend(authUrl, subscription);
    return true;
  } catch {
    return false;
  }
}

/**
 * Lepas subscription perangkat dari akun user saat ini (dipanggil saat logout atau user mematikan push).
 */
export async function unsubscribeWebPush(
  authUrl: string,
  revokeBrowserSubscription = true
): Promise<boolean> {
  if (!isWebPushSupported()) return false;

  try {
    const subscription = await getExistingPushSubscription();
    if (!subscription) return true;

    try {
      await api.post(`${authUrl}/api/push/unsubscribe`, {
        endpoint: subscription.endpoint,
      });
    } catch {
      // Abaikan jika sesi sudah kedaluwarsa saat logout
    }

    if (revokeBrowserSubscription) {
      await subscription.unsubscribe();
    }

    return true;
  } catch {
    return false;
  }
}
