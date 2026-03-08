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
import { addFriend, listFriends, removeFriend, searchUsers } from "../services/friends";
import { useAuth } from "../state/AuthContext";
import { FriendItem } from "../types/api";

export function FriendsScreen() {
    const { token } = useAuth();
    const [friends, setFriends] = useState<FriendItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [modalVisible, setModalVisible] = useState(false);

    const loadFriends = async () => {
        if (!token) {
            return;
        }
        setLoading(true);
        setError("");
        try {
            const items = await listFriends(token);
            setFriends(items);
        } catch (err) {
            setError(String(err));
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            void loadFriends();
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
                            await loadFriends();
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
            await loadFriends();
            setModalVisible(false);
        } catch (err) {
            setError(String(err));
        } finally {
            setSaving(false);
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
    removeButtonText: {
        color: "crimson",
        fontWeight: "700",
    },
});
