import { useMemo, useState } from "react";
import { Alert, Button, SafeAreaView, StyleSheet, Switch, Text, TextInput, View, Image, ActivityIndicator } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";

import { RootStackParamList } from "../navigation/types";
import { createCompletion } from "../services/api";
import { requestUploadUrl, uploadPhotoToS3 } from "../services/upload";
import { useAuth } from "../state/AuthContext";

type ScreenProps = NativeStackScreenProps<RootStackParamList, "PromptUpload">;

export function PromptUploadScreen({ route, navigation }: ScreenProps) {
    const { token } = useAuth();
    const [note, setNote] = useState("");
    const [location, setLocation] = useState("");
    const [photoUri, setPhotoUri] = useState<string | null>(null);
    const [shareWithFriends, setShareWithFriends] = useState(true);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    const date = useMemo(() => new Date().toISOString().slice(0, 10), []);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
            Alert.alert("Permission needed", "Please grant camera roll access");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            setPhotoUri(result.assets[0].uri);
        }
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
            Alert.alert("Permission needed", "Please grant camera access");
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            setPhotoUri(result.assets[0].uri);
        }
    };

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
            let photoUrl = "";

            // Upload photo if selected
            if (photoUri) {
                setUploading(true);
                const urlData = await requestUploadUrl(token, "image/jpeg");
                await uploadPhotoToS3(urlData.upload_url, urlData.upload_fields, photoUri);
                photoUrl = `s3://${urlData.s3_key}`;
                setUploading(false);
            }

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
            setUploading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.label}>Photo</Text>
                <View style={styles.photoSection}>
                    {photoUri ? (
                        <View>
                            <Image source={{ uri: photoUri }} style={styles.previewImage} />
                            <Button title="Remove photo" onPress={() => setPhotoUri(null)} />
                        </View>
                    ) : (
                        <View style={styles.photoButtons}>
                            <Button title="📸 Take Photo" onPress={takePhoto} />
                            <Button title="🖼️ Choose from Library" onPress={pickImage} />
                        </View>
                    )}
                </View>

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

                <View style={styles.switchRow}>
                    <Text>Share with friends</Text>
                    <Switch value={shareWithFriends} onValueChange={setShareWithFriends} />
                </View>

                {uploading && <ActivityIndicator size="large" color="#007AFF" />}

                <Button 
                    title={loading ? "Submitting..." : "Submit completion"} 
                    onPress={onSubmit} 
                    disabled={loading || uploading} 
                />
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
        flex: 1,
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
    photoSection: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        padding: 12,
        minHeight: 120,
        justifyContent: "center",
    },
    photoButtons: {
        gap: 8,
    },
    previewImage: {
        width: "100%",
        height: 200,
        borderRadius: 8,
        marginBottom: 8,
    },
    switchRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
});
