import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import { FriendItem } from "../types/api";

type AddFriendModalProps = {
    visible: boolean;
    loading: boolean;
    error: string;
    onClose: () => void;
    onSearch: (query: string) => Promise<FriendItem[]>;
    onAddFriend: (username: string) => Promise<void>;
};

export function AddFriendModal({
    visible,
    loading,
    error,
    onClose,
    onSearch,
    onAddFriend,
}: AddFriendModalProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<FriendItem[]>([]);
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        if (!visible) {
            setQuery("");
            setResults([]);
            setSearching(false);
        }
    }, [visible]);

    const handleSearch = async () => {
        if (query.trim().length < 2) {
            setResults([]);
            return;
        }
        setSearching(true);
        try {
            const users = await onSearch(query.trim());
            setResults(users);
        } finally {
            setSearching(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <SafeAreaView style={styles.container}>
                <View style={styles.headerRow}>
                    <Text style={styles.title}>Add Friend</Text>
                    <Pressable onPress={onClose}>
                        <Text style={styles.closeText}>Done</Text>
                    </Pressable>
                </View>

                <TextInput
                    value={query}
                    onChangeText={setQuery}
                    style={styles.input}
                    autoCapitalize="none"
                    placeholder="Search username"
                />

                <Pressable style={styles.searchButton} onPress={handleSearch}>
                    <Text style={styles.searchButtonText}>Search</Text>
                </Pressable>

                {searching ? <ActivityIndicator style={styles.loader} /> : null}
                {error ? <Text style={styles.error}>{error}</Text> : null}

                <View style={styles.resultsList}>
                    {results.map((item) => (
                        <View key={item.friend_id} style={styles.resultRow}>
                            <View style={styles.resultTextWrap}>
                                <Text style={styles.resultName}>{item.display_name}</Text>
                                <Text style={styles.resultUsername}>@{item.username}</Text>
                            </View>
                            <Pressable
                                style={[styles.addButton, loading ? styles.addButtonDisabled : null]}
                                disabled={loading}
                                onPress={() => {
                                    void onAddFriend(item.username);
                                }}
                            >
                                <Text style={styles.addButtonText}>{loading ? "Adding..." : "Add"}</Text>
                            </Pressable>
                        </View>
                    ))}
                </View>
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        gap: 12,
    },
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    title: {
        fontSize: 22,
        fontWeight: "700",
    },
    closeText: {
        fontSize: 16,
        color: "#007AFF",
        fontWeight: "600",
    },
    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
    },
    searchButton: {
        backgroundColor: "#111",
        borderRadius: 8,
        paddingVertical: 10,
        alignItems: "center",
    },
    searchButtonText: {
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
    resultsList: {
        gap: 10,
        marginTop: 8,
    },
    resultRow: {
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 8,
        padding: 12,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    resultTextWrap: {
        gap: 2,
    },
    resultName: {
        fontWeight: "700",
    },
    resultUsername: {
        color: "#666",
    },
    addButton: {
        backgroundColor: "#007AFF",
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 14,
    },
    addButtonDisabled: {
        opacity: 0.6,
    },
    addButtonText: {
        color: "#fff",
        fontWeight: "700",
    },
});
