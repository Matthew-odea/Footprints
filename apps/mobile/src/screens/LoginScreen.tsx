import { useState } from "react";
import { Alert, SafeAreaView, StyleSheet } from "react-native";

import { login } from "../services/api";
import { useAuth } from "../state/AuthContext";
import { Title, Body, VStack, Input, Button } from "../components";
import { theme } from "../theme";

export function LoginScreen() {
    const { setToken } = useAuth();
    const [username, setUsername] = useState("demo_user");
    const [password, setPassword] = useState("password123");
    const [loading, setLoading] = useState(false);

    const onSubmit = async () => {
        setLoading(true);
        try {
            const result = await login(username, password);
            setToken(result.access_token);
        } catch (error) {
            Alert.alert("Login failed", String(error));
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <VStack space="lg" style={styles.inner}>
                <VStack space="sm" align="center">
                    <Title color={theme.colors.primary}>Footprints</Title>
                    <Body color={theme.colors.textSecondary}>
                        Minimal milestone build
                    </Body>
                </VStack>

                <VStack space="md">
                    <Input
                        label="Username"
                        placeholder="demo_user"
                        autoCapitalize="none"
                        value={username}
                        onChangeText={setUsername}
                        disabled={loading}
                    />
                    <Input
                        label="Password"
                        placeholder="password123"
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                        disabled={loading}
                    />
                </VStack>

                <Button
                    label={loading ? "Signing in..." : "Sign in"}
                    onPress={onSubmit}
                    disabled={loading}
                    loading={loading}
                    variant="primary"
                    size="lg"
                />
            </VStack>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        backgroundColor: theme.colors.background,
    },
    inner: {
        paddingHorizontal: theme.spacing.base,
        paddingVertical: theme.spacing.lg,
    },
});
