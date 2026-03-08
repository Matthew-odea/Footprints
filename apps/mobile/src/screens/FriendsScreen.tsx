import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import { AddFriendModal } from "../components/AddFriendModal";
import {
    acceptFriendRequest,
    addFriend,
    getIncomingFriendRequests,
    getOutgoingFriendRequests,
    listFriends,
    rejectFriendRequest,
    removeFriend,
    searchUsers,
} from "../services/friends";
import { useAuth } from "../state/AuthContext";
import { FriendItem, FriendRequestItem } from "../types/api";

export function FriendsScreen() {
    const { token } = useAuth();
    const [friends, setFriends] = useState<FriendItem[]>([]);
    const [incomingRequests, setIncomingRequests] = useState<FriendRequestItem[]>([]);
    const [outgoingRequests, setOutgoingRequests] = useState<FriendRequestItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [requestActionId, setRequestActionId] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [modalVisible, setModalVisible] = useState(false);

    const loadFriendsData = async () => {
        if (!token) {
            return;
        }
        setLoading(true);
        setError("");
        try {
            const [friendItems, incoming, outgoing] = await Promise.all([
                listFriends(token),
                getIncomingFriendRequests(token),
                getOutgoingFriendRequests(token),
            ]);
            setFriends(friendItems);
            setIncomingRequests(incoming);
            setOutgoingRequests(outgoing);
        } catch (err) {
            setError(String(err));
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            void loadFriendsData();
        }, [token])
    );

    const handleRemove = (friend: FriendItem) => {
        Alert.alert(
            "Remove friend",
            `Remove @${friend.username} from your friends?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Remove",
                    style: "destructive",
                    onPress: async () => {
                        if (!token) {
                            return;
                        }
                        setSaving(true);
                        setError("");
                        try {
                            await removeFriend(token, friend.friend_id);
                            await loadFriendsData();
                        } catch (err) {
                            setError(String(err));
                        } finally {
                            setSaving(false);
                        }
                    },
                },
            ]
        );
    };

    const handleAddFriend = async (username: string) => {
        if (!token) {
            return;
        }
        setSaving(true);
        setError("");
        try {
            await addFriend(token, username);
            await loadFriendsData();
            setModalVisible(false);
        } catch (err) {
            setError(String(err));
        } finally {
            setSaving(false);
        }
    };

    const handleAcceptRequest = async (request: FriendRequestItem) => {
        if (!token) {
            return;
        }
        setRequestActionId(request.request_id);
        setError("");
        try {
            await acceptFriendRequest(token, request.request_id);
            await loadFriendsData();
        } catch (err) {
            setError(String(err));
        } finally {
            setRequestActionId(null);
        }
    };

    const handleRejectRequest = async (request: FriendRequestItem) => {
        if (!token) {
            return;
        }
        setRequestActionId(request.request_id);
        setError("");
        try {
            await rejectFriendRequest(token, request.request_id);
            await loadFriendsData();
        } catch (err) {
            setError(String(err));
        } finally {
            setRequestActionId(null);
        }
    };

    const handleSearch = async (query: string) => {
        if (!token) {
            return [];
        }
        return searchUsers(token, query);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Friends</Text>
                <Pressable style={styles.addAction} onPress={() => setModalVisible(true)}>
                    <Text style={styles.addActionText}>Add Friend</Text>
                </Pressable>
            </View>

            {loading ? <ActivityIndicator style={styles.loader} /> : null}
            {error ? <Text style={styles.error}>{error}</Text> : null}

            {!loading && friends.length === 0 ? (
                <View style={styles.emptyWrap}>
                    <Text style={styles.emptyTitle}>No friends yet</Text>
                    <Text style={styles.emptyText}>Add a friend to start sharing activity.</Text>
                </View>
            ) : null}

            {incomingRequests.length > 0 ? (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Incoming Requests</Text>
                    {incomingRequests.map((request) => {
                        const busy = requestActionId === request.request_id;
                        return (
                            <View key={request.request_id} style={styles.card}>
                                <View style={styles.cardTextWrap}>
                                    <Text style={styles.name}>{request.display_name}</Text>
                                    <Text style={styles.username}>@{request.username}</Text>
                                </View>
                                <View style={styles.requestActions}>
                                    <Pressable
                                        style={[styles.acceptButton, busy ? styles.removeButtonDisabled : null]}
                                        disabled={busy}
                                        onPress={() => {
                                            void handleAcceptRequest(request);
                                        }}
                                    >
                                        <Text style={styles.acceptButtonText}>Accept</Text>
                                    </Pressable>
                                    <Pressable
                                        style={[styles.removeButton, busy ? styles.removeButtonDisabled : null]}
                                        disabled={busy}
                                        onPress={() => {
                                            void handleRejectRequest(request);
                                        }}
                                    >
                                        <Text style={styles.removeButtonText}>Reject</Text>
                                    </Pressable>
                                </View>
                            </View>
                        );
                    })}
                </View>
            ) : null}

            {outgoingRequests.length > 0 ? (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Outgoing Requests</Text>
                    {outgoingRequests.map((request) => (
                        <View key={request.request_id} style={styles.card}>
                            <View style={styles.cardTextWrap}>
                                <Text style={styles.name}>{request.display_name}</Text>
                                <Text style={styles.username}>@{request.username}</Text>
                            </View>
                            <View style={styles.pendingPill}>
                                <Text style={styles.pendingPillText}>Pending</Text>
                            </View>
                        </View>
                    ))}
                </View>
            ) : null}

            <FlatList
                data={friends}
                keyExtractor={(item) => item.friend_id}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <View style={styles.cardTextWrap}>
                            <Text style={styles.name}>{item.display_name}</Text>
                            <Text style={styles.username}>@{item.username}</Text>
                        </View>
                        <Pressable
                            style={[styles.removeButton, saving ? styles.removeButtonDisabled : null]}
                            disabled={saving}
                            onPress={() => handleRemove(item)}
                        >
                            <Text style={styles.removeButtonText}>Remove</Text>
                        </Pressable>
                    </View>
                )}
            />

            <AddFriendModal
                visible={modalVisible}
                loading={saving}
                error={error}
                onClose={() => setModalVisible(false)}
                onSearch={handleSearch}
                onAddFriend={handleAddFriend}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        gap: 10,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    title: {
        fontSize: 24,
        fontWeight: "700",
    },
    addAction: {
        backgroundColor: "#007AFF",
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    addActionText: {
        color: "#fff",
        fontWeight: "700",
    },
    loader: {
        marginTop: 8,
    },
    error: {
        color: "crimson",
        fontSize: 13,
    },
    emptyWrap: {
        paddingVertical: 20,
        alignItems: "center",
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: "700",
    },
    emptyText: {
        color: "#666",
        marginTop: 6,
    },
    section: {
        gap: 8,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "700",
    },
    list: {
        paddingVertical: 8,
        gap: 10,
    },
    card: {
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 8,
        padding: 12,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    cardTextWrap: {
        gap: 2,
    },
    name: {
        fontWeight: "700",
    },
    username: {
        color: "#666",
    },
    removeButton: {
        borderWidth: 1,
        borderColor: "crimson",
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    removeButtonDisabled: {
        opacity: 0.6,
    },
    requestActions: {
        flexDirection: "row",
        gap: 8,
    },
    acceptButton: {
        borderWidth: 1,
        borderColor: "#1E8E3E",
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    acceptButtonText: {
        color: "#1E8E3E",
        fontWeight: "700",
    },
    pendingPill: {
        borderWidth: 1,
        borderColor: "#888",
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    pendingPillText: {
        color: "#666",
        fontWeight: "700",
        fontSize: 12,
    },
    removeButtonText: {
        color: "crimson",
        fontWeight: "700",
    },
});
