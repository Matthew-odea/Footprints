import { useMemo, useState } from "react";
import { Alert, Button, SafeAreaView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { RootStackParamList } from "../navigation/types";
import { createCompletion } from "../services/api";
import { useAuth } from "../state/AuthContext";

type ScreenProps = NativeStackScreenProps<RootStackParamList, "PromptUpload">;

export function PromptUploadScreen({ route, navigation }: ScreenProps) {
    const { token } = useAuth();
    const [note, setNote] = useState("");
    const [location, setLocation] = useState("");
    const [photoUrl, setPhotoUrl] = useState("s3://footprints/completions/example.jpg");
    const [shareWithFriends, setShareWithFriends] = useState(true);
    const [loading, setLoading] = useState(false);

    const date = useMemo(() => new Date().toISOString().slice(0, 10), []);

    const onSubmit = async () => {
        if (!token) {
            return;
        }
        if (!note || !location) {
            Alert.alert("Missing details", "Please fill in note and location.");
            return;
        }

        setLoading(true);
        try {
            await createCompletion(token, {
                prompt_id: route.params.promptId,
                note,
                date,
                location,
                photo_url: photoUrl,
                share_with_friends: shareWithFriends,
            });
            Alert.alert("Success", "Completion submitted.", [
                {
                    text: "OK",
                    onPress: () => navigation.navigate("AppTabs"),
                },
            ]);
        } catch (error) {
            Alert.alert("Submit failed", String(error));
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.label}>Note</Text>
                <TextInput
                    style={[styles.input, styles.textarea]}
                    multiline
                    value={note}
                    onChangeText={setNote}
                    placeholder="What did you do?"
                />

                <Text style={styles.label}>Location</Text>
                <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder="City" />

                <Text style={styles.label}>Photo URL (S3 path for now)</Text>
                <TextInput style={styles.input} value={photoUrl} onChangeText={setPhotoUrl} />

                <View style={styles.switchRow}>
                    <Text>Share with friends</Text>
                    <Switch value={shareWithFriends} onValueChange={setShareWithFriends} />
                </View>

                <Button title={loading ? "Submitting..." : "Submit completion"} onPress={onSubmit} disabled={loading} />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 16,
        gap: 10,
    },
    label: {
        fontWeight: "700",
    },
    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        padding: 10,
    },
    textarea: {
        minHeight: 90,
        textAlignVertical: "top",
    },
    switchRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
});
