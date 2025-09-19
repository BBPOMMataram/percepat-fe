export interface LoginPayload {
    email: string;
    password: string;
}

export interface Role {
    id: number;
    level: string; // "superadmin", "admin", dll
    description: string | null;
    created_at: string | null;
    updated_at: string | null;
}

export interface Employee {
    id: number;
    user_id: number;
    position: string;
    nip: string | null;
    unit_kerja: string;
    fungsi_id: number;
    jabatan: string;
    pangkat: string | null;
    golongan: string | null;
    gelar_depan: string | null;
    gelar_belakang: string | null;
    extra: string | null;
    created_at: string | null; // ISO date string | null
    updated_at: string | null; // ISO date string | null
}

export interface User {
    id: number;
    name: string;
    call_name: string | null;
    nik: string;
    email: string;
    email_verified_at: string | null;
    photo_path: string | null;
    signature_path: string | null;
    role_id: number;
    role?: Role;
    employee?: Employee | null;
    created_at: string;
    updated_at: string;
}

export interface LoginResponse {
    message?: string;
    expires_in?: number;
    user: User;
}
