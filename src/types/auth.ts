export interface LoginPayload {
    email: string;
    password: string;
}

export interface LoginResponse {
    message?: string | undefined;
    expires_in?: number;
}