export const getAuthStorageUrl = (
    filePath?: string | null,
    fallback = "/assets/images/noimage.svg",
): string => {
    if (!filePath) return fallback;

    const authUrl = process.env.NEXT_PUBLIC_BACKEND_URL_AUTH || "http://localhost:8000";
    const authBase = new URL(authUrl);

    if (filePath.startsWith("data:image/")) return filePath;

    if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
        const fileUrl = new URL(filePath);
        if (fileUrl.pathname.startsWith("/storage/")) {
            fileUrl.protocol = authBase.protocol;
            fileUrl.host = authBase.host;
            return fileUrl.toString();
        }
        return filePath;
    }

    const cleanPath = filePath.startsWith("/") ? filePath : `/${filePath}`;
    if (!cleanPath.startsWith("/storage/")) {
        return new URL(`/storage${cleanPath}`, authBase).toString();
    }
    return new URL(cleanPath, authBase).toString();
};

export const getUserPhotoUrl = (photoPath?: string | null): string =>
    getAuthStorageUrl(photoPath);

