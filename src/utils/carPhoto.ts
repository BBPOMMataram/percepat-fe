/**
 * Utility untuk mendapatkan URL foto mobil / armada dinas PAULA.
 * Jika kendaraan belum memiliki foto kustom di database,
 * fungsi ini mengembalikan fallback foto armada dinas resmi atau ilustrasi representatif.
 */
export function getMobilPhotoUrl(mobil?: { foto?: string | null; nama?: string; plat_nomor?: string } | null): string {
    if (mobil?.foto && typeof mobil.foto === 'string' && mobil.foto.trim() !== '') {
        const foto = mobil.foto.trim();
        if (foto.startsWith('http://') || foto.startsWith('https://') || foto.startsWith('data:')) {
            return foto;
        }
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL_PAULA;
        return `${backendUrl}${foto.startsWith('/') ? '' : '/'}${foto}`;
    }

    // Default fallback foto armada resmi PAULA
    return '/assets/images/paula/cars.webp';
}
