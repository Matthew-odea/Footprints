import { useEffect, useState } from "react";
import { SafeAreaView, StyleSheet, Switch, ScrollView } from "react-native";

import { getMe, updateSettings } from "../services/api";
import { useAuth } from "../state/AuthContext";
import { Title, Body, Label, Card, VStack, HStack, Button, LoadingSpinner, Divider } from "../components";
import { theme } from "../theme";

export function SettingsScreen() {
    const { token, setToken } = useAuth();
    const [loading, setLoading] = useState(true);
    const [shareByDefault, setShareByDefault] = useState(true);
    const [username, setUsername] = useState("");

    useEffect(() => {
        const run = async () => {
            if (!token) {
                return;
            }
            setLoading(true);
            const me = await getMe(token);
            setShareByDefault(me.settings.share_by_default);
            setUsername(me.profile.username);
            setLoading(false);
        };
        void run();
    }, [token]);

    const onToggle = async (value: boolean) => {
        if (!token) {
            return;
        }
        setShareByDefault(value);
        await updateSettings(token, value);
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <LoadingSpinner message="Loading settings..." />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <VStack space="base" style={styles.header}>
                    <Title>Settings</Title>
                </VStack>

                {/* Profile Section */}
                <Card padding="md" shadow="subtle" style={styles.card}>
                    <VStack space="md">
                        <Label color={theme.colors.textSecondary}>Account</Label>
                        <Divider />
                        <VStack space="sm">
                            <Body color={theme.colors.textSecondary}>Signed in as</Body>
                            <Body color={theme.colors.text}>{username || "—"}</Body>
                        </VStack>
                    </VStack>
                </Card>

                {/* Privacy Section */}
                <Card padding="md" shadow="subtle" style={styles.card}>
                    <VStack space="md">
                        <Label color={theme.colors.textSecondary}>Privacy</Label>
                        <Divider />
                        <HStack justify="space-between" align="center">
                            <Body>Share entries by default</Body>
                            <Switch
                                value={shareByDefault}
                                onValueChange={onToggle}
                                trackColor={{
                                    false: theme.colors.border,
                                    true: theme.colors.secondary,
                                }}
                                thumbColor={
                                    shareByDefault ? theme.colors.primary : theme.colors.border
                                }
                            />
                        </HStack>
                    </VStack>
                </Card>

                {/* Logout Section */}
                <Button
                    label="Log out"
                    onPress={() => setToken(null)}
                    variant="outline"
                    style={styles.logoutButton}
                />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    scrollContent: {
        paddingHorizontal: theme.spacing.base,
        paddingVertical: theme.spacing.base,
        gap: theme.spacing.lg,
    },
    header: {
        marginBottom: theme.spacing.md,
    },
    card: {
        marginBottom: theme.spacing.md,
    },
    logoutButton: {
        marginTop: theme.spacing.lg,
    },
});
