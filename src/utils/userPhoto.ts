/**
 * Mengembalikan URL foto profil user yang valid dari database Auth BPOM.
 * Menangani URL lengkap (S3 / CDN / direct host), path relatif /storage/,
 * maupun fallback ke noimage.svg jika belum ada foto profil.
 */
export const getUserPhotoUrl = (photoPath?: string | null): string => {
    if (!photoPath) return "/assets/images/noimage.svg";
    if (photoPath.startsWith("http://") || photoPath.startsWith("https://")) {
        return photoPath;
    }
    const authUrl = process.env.NEXT_PUBLIC_BACKEND_URL_AUTH || "http://localhost:8000";
    const cleanAuthUrl = authUrl.endsWith("/") ? authUrl.slice(0, -1) : authUrl;
    const cleanPath = photoPath.startsWith("/") ? photoPath : `/${photoPath}`;
    if (!cleanPath.startsWith("/storage/")) {
        return `${cleanAuthUrl}/storage${cleanPath}`;
    }
    return `${cleanAuthUrl}${cleanPath}`;
};

