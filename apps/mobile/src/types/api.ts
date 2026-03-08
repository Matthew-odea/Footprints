export type TokenResponse = {
    access_token: string;
    token_type: string;
};

export type Prompt = {
    id: string;
    title: string;
    description: string;
    category: string;
    guidance: string[];
    active: boolean;
};

export type CompletionItem = {
    completion_id: string;
    prompt_id: string;
    prompt_title: string;
    category?: string | null;
    note: string;
    date: string;
    location: string;
    photo_url: string;
    share_with_friends: boolean;
};

export type UserResponse = {
    profile: {
        user_id: string;
        username: string;
        display_name: string;
    };
    settings: {
        share_by_default: boolean;
    };
    completed_count: number;
};

export type FriendItem = {
    request_id?: string;
    friend_id: string;
    username: string;
    display_name: string;
    status: string;
    created_at: string;
    requested_by?: string;
};

export type FriendsListResponse = {
    items: FriendItem[];
    total: number;
};

export type FriendRequestItem = {
    request_id: string;
    user_id: string;
    username: string;
    display_name: string;
    created_at: string;
    direction: "incoming" | "outgoing";
};

export type FriendRequestsListResponse = {
    items: FriendRequestItem[];
    total: number;
};

export type AcceptFriendRequestResponse = {
    friend_id: string;
    username: string;
    display_name: string;
    status: string;
    accepted_at: string;
};
