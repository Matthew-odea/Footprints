import {
    AcceptFriendRequestResponse,
    FriendItem,
    FriendRequestItem,
    FriendRequestsListResponse,
    FriendsListResponse,
} from "../types/api";
import { API_BASE_URL } from "../lib/constants";

async function request<T>(path: string, token: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            ...(options.headers ?? {}),
        },
        ...options,
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Request failed: ${response.status}`);
    }

    if (response.status === 204) {
        return undefined as T;
    }

    return (await response.json()) as T;
}

export async function listFriends(token: string): Promise<FriendItem[]> {
    const result = await request<FriendsListResponse>("/api/v1/friends", token);
    return result.items;
}

export async function searchUsers(token: string, query: string): Promise<FriendItem[]> {
    const encoded = encodeURIComponent(query);
    const result = await request<FriendsListResponse>(`/api/v1/friends/search?q=${encoded}`, token);
    return result.items;
}

export async function addFriend(token: string, username: string): Promise<FriendItem> {
    return request<FriendItem>("/api/v1/friends", token, {
        method: "POST",
        body: JSON.stringify({ username }),
    });
}

export async function removeFriend(token: string, friendId: string): Promise<void> {
    await request<void>(`/api/v1/friends/${friendId}`, token, {
        method: "DELETE",
    });
}

export async function getIncomingFriendRequests(token: string): Promise<FriendRequestItem[]> {
    const result = await request<FriendRequestsListResponse>("/api/v1/friends/requests/incoming", token);
    return result.items;
}

export async function getOutgoingFriendRequests(token: string): Promise<FriendRequestItem[]> {
    const result = await request<FriendRequestsListResponse>("/api/v1/friends/requests/outgoing", token);
    return result.items;
}

export async function acceptFriendRequest(
    token: string,
    requestId: string
): Promise<AcceptFriendRequestResponse> {
    return request<AcceptFriendRequestResponse>(`/api/v1/friends/requests/${requestId}/accept`, token, {
        method: "POST",
    });
}

export async function rejectFriendRequest(token: string, requestId: string): Promise<void> {
    await request<void>(`/api/v1/friends/requests/${requestId}/reject`, token, {
        method: "POST",
    });
}
