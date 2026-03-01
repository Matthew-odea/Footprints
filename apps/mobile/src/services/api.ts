import { API_BASE_URL } from "../lib/constants";
import { CompletionItem, Prompt, TokenResponse, UserResponse } from "../types/api";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        headers: {
            "Content-Type": "application/json",
            ...(options.headers ?? {}),
        },
        ...options,
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Request failed: ${response.status}`);
    }

    return (await response.json()) as T;
}

export async function login(username: string, password: string): Promise<TokenResponse> {
    return request<TokenResponse>("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
    });
}

export async function getActivePrompts(token: string): Promise<Prompt[]> {
    const response = await request<{ items: Prompt[] }>("/api/v1/prompts/active", {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return response.items;
}

export async function getPromptById(token: string, promptId: string): Promise<Prompt> {
    return request<Prompt>(`/api/v1/prompts/${promptId}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}

export async function createCompletion(
    token: string,
    payload: {
        prompt_id: string;
        note: string;
        date: string;
        location: string;
        photo_url: string;
        share_with_friends: boolean;
    }
): Promise<CompletionItem> {
    const response = await request<{ item: CompletionItem }>("/api/v1/completions", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });
    return response.item;
}

export async function getHistory(token: string): Promise<CompletionItem[]> {
    const response = await request<{ items: CompletionItem[] }>("/api/v1/history", {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return response.items;
}

export async function getMe(token: string): Promise<UserResponse> {
    return request<UserResponse>("/api/v1/me", {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}

export async function updateSettings(token: string, shareByDefault: boolean): Promise<UserResponse> {
    return request<UserResponse>("/api/v1/me/settings", {
        method: "PATCH",
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ share_by_default: shareByDefault }),
    });
}
