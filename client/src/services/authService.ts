import { ApiError, postJson, fetchJson } from "./apiClient";

export interface UserInfo {
    id: number;
    email: string;
}

let currentUser: UserInfo | null = null;

export async function login(email: string, password: string): Promise<UserInfo> {
    const result = await postJson<{ id: number; email: string }>('/api/auth/login', { email, password });
    currentUser = { id: result.id, email: result.email };
    return currentUser;
}

export async function register(email: string, password: string): Promise<string> {
    const result = await postJson<string>("/api/auth/register", { email, password });
    return result;
}

export async function logout(): Promise<void> {
    try {
        await postJson<void>("/api/auth/logout", {});
    } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
            // Ignore missing logout endpoint and clear auth state anyways.
        } else {
            throw error;
        }
    } finally {
        currentUser = null;
    }
}

export function getCurrentUser(): UserInfo | null {
    return currentUser;
}

export async function isLoggedIn(): Promise<boolean> {
    if (currentUser) {
        return true;
    }

    try {
        await fetchJson<unknown>("/api/history", { method: "GET" });
        return true;
    } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
            return false;
        }
        throw error;
    }
}
