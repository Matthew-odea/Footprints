import { useState } from "react";
import { Alert, Button, SafeAreaView, StyleSheet, Text, TextInput, View } from "react-native";

import { login } from "../services/api";
import { useAuth } from "../state/AuthContext";

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
            <View style={styles.inner}>
                <Text style={styles.title}>Footprints</Text>
                <Text style={styles.subtitle}>Minimal milestone build</Text>

                <TextInput
                    style={styles.input}
                    placeholder="Username"
                    autoCapitalize="none"
                    value={username}
                    onChangeText={setUsername}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                />
                <Button title={loading ? "Signing in..." : "Sign in"} onPress={onSubmit} disabled={loading} />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
    },
    inner: {
        padding: 20,
        gap: 12,
    },
    title: {
        fontSize: 28,
        fontWeight: "700",
    },
    subtitle: {
        color: "#666",
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        padding: 10,
    },
});
