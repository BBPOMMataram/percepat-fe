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
    role: Role;
    created_at: string;
    updated_at: string;
}

export interface LoginResponse {
    message?: string;
    expires_in?: number;
    user: User;
}
