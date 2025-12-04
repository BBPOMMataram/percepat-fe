export interface RegisterPayload {
    role_id: number;
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    call_name: string | null;
    photo_path: string | null;
    signature_path: string | null;
    nik: string | null;
}

export interface LoginPayload {
    email: string;
    password: string;
    turnstile_token: string;
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
    fungsi: {
        name: string;
    };
    group_jabatan: {
        id: number;
        name: string;
    };
    is_katim_pengujian: boolean;
    petugas_bmn: {
        id: number;
        name: string;
    };
    is_ppk: boolean;
    is_pp: boolean;
}

export interface Student {
    id: number;
    user_id: number;
    nim: string;
    angkatan: string;
    jurusan: string;
    university: string;
    created_at: string | null;
    updated_at: string | null;
}

export interface Sites {
    clicks: number;
    desc: string;
    expansion_name: string | null;
    id: number;
    link: string;
    logo_path: string;
    name: string;
    pic: string;
    updated_at: string;
    created_at: string;
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
    student?: Student | null;
    sites?: Sites[] | [];
    created_at: string;
    updated_at: string;
}

export interface LoginOrRegisterResponse {
    message?: string;
    expires_in?: number;
    user: User;
}
