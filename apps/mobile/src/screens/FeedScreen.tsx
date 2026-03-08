import React, { useEffect, useState } from "react";
import {
    FlatList,
    StyleSheet,
    Text,
    View,
    Image,
    ActivityIndicator,
    RefreshControl,
    TouchableOpacity,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { getFeed, FeedItem } from "../services/upload";
import { useAuth } from "../state/AuthContext";

export function FeedScreen() {
    const { token } = useAuth();
    const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
    const [scope, setScope] = useState<"all" | "friends">("all");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [cursor, setCursor] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);

    const loadFeed = async (nextCursor?: string) => {
        try {
            if (!token) {
                setError("Not authenticated");
                setLoading(false);
                return;
            }

            const result = await getFeed(token, 20, nextCursor, scope);
            if (nextCursor) {
                setFeedItems((prev) => [...prev, ...result.items]);
            } else {
                setFeedItems(result.items);
            }
            setCursor(result.next_cursor || null);
            setError(null);
        } catch (err) {
            setError(String(err));
        } finally {
            setLoading(false);
            setRefreshing(false);
            setLoadingMore(false);
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            setLoading(true);
            setFeedItems([]);
            setCursor(null);
            loadFeed();
        }, [token, scope])
    );

    const onRefresh = () => {
        setRefreshing(true);
        setFeedItems([]);
        setCursor(null);
        loadFeed();
    };

    const onEndReached = () => {
        if (cursor && !loadingMore && !loading) {
            setLoadingMore(true);
            loadFeed(cursor);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
        });
    };

    const renderItem = ({ item }: { item: FeedItem }) => (
        <View style={styles.itemCard}>
            <View style={styles.itemHeader}>
                <Text style={styles.userName}>{item.user_display_name}</Text>
                <Text style={styles.date}>{formatDate(item.created_at)}</Text>
            </View>

            <Text style={styles.promptTitle}>{item.prompt_title}</Text>

            {item.photo_url && (
                <Image
                    source={{ uri: item.photo_url }}
                    style={styles.photo}
                    onError={() => console.log("Image failed to load")}
                />
            )}

            {item.note && <Text style={styles.note}>{item.note}</Text>}

            <View style={styles.metaRow}>
                {item.location && (
                    <Text style={styles.meta}>📍 {item.location}</Text>
                )}
                {item.date && <Text style={styles.meta}>📅 {item.date}</Text>}
            </View>
        </View>
    );

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No activity yet</Text>
            <Text style={styles.emptySubtext}>Check back soon for updates from your friends!</Text>
        </View>
    );

    const renderFooter = () => {
        if (!loadingMore) return null;
        return (
            <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#007AFF" />
            </View>
        );
    };

    if (loading && feedItems.length === 0) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    if (error && feedItems.length === 0) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.toggleRow}>
                <TouchableOpacity
                    style={[styles.toggleButton, scope === "all" && styles.toggleButtonActive]}
                    onPress={() => setScope("all")}
                >
                    <Text style={[styles.toggleText, scope === "all" && styles.toggleTextActive]}>All</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.toggleButton, scope === "friends" && styles.toggleButtonActive]}
                    onPress={() => setScope("friends")}
                >
                    <Text style={[styles.toggleText, scope === "friends" && styles.toggleTextActive]}>Friends</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={feedItems}
                renderItem={renderItem}
                keyExtractor={(item) => item.completion_id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={renderEmpty}
                ListFooterComponent={renderFooter}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                onEndReached={onEndReached}
                onEndReachedThreshold={0.5}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    toggleRow: {
        flexDirection: "row",
        gap: 8,
        paddingHorizontal: 12,
        paddingTop: 12,
    },
    toggleButton: {
        borderWidth: 1,
        borderColor: "#007AFF",
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 6,
    },
    toggleButtonActive: {
        backgroundColor: "#007AFF",
    },
    toggleText: {
        color: "#007AFF",
        fontWeight: "600",
    },
    toggleTextActive: {
        color: "#fff",
    },
    centerContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 16,
    },
    listContent: {
        padding: 12,
        gap: 12,
    },
    itemCard: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    itemHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    userName: {
        fontWeight: "700",
        fontSize: 16,
        color: "#000",
    },
    date: {
        fontSize: 12,
        color: "#666",
    },
    promptTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: "#333",
        marginBottom: 8,
    },
    photo: {
        width: "100%",
        height: 200,
        borderRadius: 8,
        marginBottom: 8,
        backgroundColor: "#f0f0f0",
    },
    note: {
        fontSize: 14,
        color: "#333",
        lineHeight: 20,
        marginBottom: 8,
    },
    metaRow: {
        flexDirection: "row",
        gap: 12,
        flexWrap: "wrap",
    },
    meta: {
        fontSize: 12,
        color: "#666",
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 32,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: "600",
        color: "#666",
        marginBottom: 8,
        textAlign: "center",
    },
    emptySubtext: {
        fontSize: 14,
        color: "#999",
        textAlign: "center",
    },
    errorText: {
        fontSize: 14,
        color: "#ff3b30",
        textAlign: "center",
        marginBottom: 16,
    },
    retryButton: {
        backgroundColor: "#007AFF",
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 8,
    },
    retryButtonText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 14,
    },
    footerLoader: {
        paddingVertical: 16,
        justifyContent: "center",
        alignItems: "center",
    },
});
