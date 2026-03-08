import { useEffect, useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet } from "react-native";
import { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";

import { RootStackParamList } from "../navigation/types";
import { getPromptById } from "../services/api";
import { useAuth } from "../state/AuthContext";
import { Prompt } from "../types/api";
import { Title, Heading, Body, Button, VStack, LoadingSpinner, EmptyState } from "../components";
import { theme } from "../theme";

type ScreenProps = NativeStackScreenProps<RootStackParamList, "PromptDetail">;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export function PromptDetailScreen({ route }: ScreenProps) {
    const navigation = useNavigation<Nav>();
    const { token } = useAuth();
    const [prompt, setPrompt] = useState<Prompt | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const run = async () => {
            if (!token) {
                return;
            }
            setLoading(true);
            const data = await getPromptById(token, route.params.promptId);
            setPrompt(data);
            setLoading(false);
        };
        void run();
    }, [route.params.promptId, token]);

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <LoadingSpinner />
            </SafeAreaView>
        );
    }

    if (!prompt) {
        return (
            <SafeAreaView style={styles.container}>
                <EmptyState
                    icon="🔍"
                    title="Prompt not found"
                    subtitle="This prompt may have been removed"
                />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <VStack space="lg">
                    <VStack space="sm">
                        <Title color={theme.colors.primary}>{prompt.title}</Title>
                        <Body color={theme.colors.textSecondary}>
                            {prompt.description}
                        </Body>
                    </VStack>

                    <VStack space="md">
                        <Heading>How to get started</Heading>
                        <VStack space="sm">
                            {prompt.guidance.map((item, index) => (
                                <Body key={`${item}-${index}`}>
                                    <Body
                                        style={{ fontWeight: "600" }}
                                        color={theme.colors.primary}
                                    >
                                        {index + 1}.{" "}
                                    </Body>
                                    {item}
                                </Body>
                            ))}
                        </VStack>
                    </VStack>

                    <Button
                        label="Upload completion"
                        onPress={() =>
                            navigation.navigate("PromptUpload", { promptId: prompt.id })
                        }
                        variant="primary"
                        size="lg"
                    />
                </VStack>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    content: {
        paddingHorizontal: theme.spacing.base,
        paddingVertical: theme.spacing.base,
    },
});
