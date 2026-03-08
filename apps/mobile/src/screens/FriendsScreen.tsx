import React, { useState } from "react";
import {
    Alert,
    FlatList,
    SafeAreaView,
    StyleSheet,
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
import { Title, Heading, Body, Button, Card, VStack, HStack, LoadingSpinner, EmptyState, Badge } from "../components";
import { theme } from "../theme";

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

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <LoadingSpinner message="Loading friends..." />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <VStack space="lg" style={{ flex: 1 }}>
                {/* Header */}
                <HStack justify="space-between" align="center">
                    <Title>Friends</Title>
                    <Button
                        label="Add Friend"
                        onPress={() => setModalVisible(true)}
                        size="sm"
                        variant="primary"
                    />
                </HStack>

                {/* Error Message */}
                {error ? <Body style={{ color: theme.colors.error }}>{error}</Body> : null}

                {/* Incoming Requests Section */}
                {incomingRequests.length > 0 && (
                    <VStack space="sm">
                        <Heading>Incoming Requests</Heading>
                        {incomingRequests.map((request) => {
                            const busy = requestActionId === request.request_id;
                            return (
                                <Card key={request.request_id} padding="md">
                                    <HStack justify="space-between" align="center">
                                        <VStack space="xs">
                                            <Heading size="sm">{request.display_name}</Heading>
                                            <Body size="sm" style={{ color: theme.colors.textSecondary }}>
                                                @{request.username}
                                            </Body>
                                        </VStack>
                                        <HStack space="sm">
                                            <Button
                                                label="Accept"
                                                onPress={() => handleAcceptRequest(request)}
                                                disabled={busy}
                                                variant="primary"
                                                size="sm"
                                            />
                                            <Button
                                                label="Reject"
                                                onPress={() => handleRejectRequest(request)}
                                                disabled={busy}
                                                variant="outline"
                                                size="sm"
                                            />
                                        </HStack>
                                    </HStack>
                                </Card>
                            );
                        })}
                    </VStack>
                )}

                {/* Outgoing Requests Section */}
                {outgoingRequests.length > 0 && (
                    <VStack space="sm">
                        <Heading>Outgoing Requests</Heading>
                        {outgoingRequests.map((request) => (
                            <Card key={request.request_id} padding="md">
                                <HStack justify="space-between" align="center">
                                    <VStack space="xs">
                                        <Heading size="sm">{request.display_name}</Heading>
                                        <Body size="sm" style={{ color: theme.colors.textSecondary }}>
                                            @{request.username}
                                        </Body>
                                    </VStack>
                                    <Badge label="Pending" />
                                </HStack>
                            </Card>
                        ))}
                    </VStack>
                )}

                {/* Friends List */}
                {friends.length === 0 && incomingRequests.length === 0 ? (
                    <EmptyState
                        icon="👋"
                        title="No friends yet"
                        subtitle="Add a friend to start sharing activity."
                    />
                ) : (
                    <FlatList
                        data={friends}
                        keyExtractor={(item) => item.friend_id}
                        scrollEnabled={false}
                        contentContainerStyle={styles.list}
                        renderItem={({ item }) => (
                            <Card padding="md">
                                <HStack justify="space-between" align="center">
                                    <VStack space="xs">
                                        <Heading size="sm">{item.display_name}</Heading>
                                        <Body size="sm" style={{ color: theme.colors.textSecondary }}>
                                            @{item.username}
                                        </Body>
                                    </VStack>
                                    <Button
                                        label="Remove"
                                        onPress={() => handleRemove(item)}
                                        disabled={saving}
                                        variant="outline"
                                        size="sm"
                                    />
                                </HStack>
                            </Card>
                        )}
                    />
                )}
            </VStack>

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
        backgroundColor: theme.colors.background,
        paddingHorizontal: theme.spacing.base,
        paddingVertical: theme.spacing.base,
    },
    list: {
        gap: theme.spacing.md,
    },
});
