import { useMemo, useState } from "react";
import { Alert, SafeAreaView, StyleSheet, ScrollView, View, Image, Switch } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";

import { RootStackParamList } from "../navigation/types";
import { createCompletion } from "../services/api";
import { requestUploadUrl, uploadPhotoToS3 } from "../services/upload";
import { useAuth } from "../state/AuthContext";
import { Title, Label, Body, Button, VStack, HStack, Input, LoadingSpinner } from "../components";
import { theme } from "../theme";

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
            <ScrollView contentContainerStyle={styles.content}>
                <VStack space="lg">
                    <Title>Complete prompt</Title>

                    {/* Photo Section */}
                    <VStack space="sm">
                        <Label>Photo</Label>
                        {photoUri ? (
                            <VStack space="md">
                                <Image source={{ uri: photoUri }} style={styles.previewImage} />
                                <Button
                                    label="Remove photo"
                                    onPress={() => setPhotoUri(null)}
                                    variant="outline"
                                    size="sm"
                                />
                            </VStack>
                        ) : (
                            <HStack space="sm">
                                <Button
                                    label="📸 Take Photo"
                                    onPress={takePhoto}
                                    variant="secondary"
                                    flex={1}
                                />
                                <Button
                                    label="🖼️ Choose"
                                    onPress={pickImage}
                                    variant="secondary"
                                    flex={1}
                                />
                            </HStack>
                        )}
                    </VStack>

                    {/* Note Section */}
                    <Input
                        label="Note"
                        placeholder="What did you do?"
                        value={note}
                        onChangeText={setNote}
                        multiline
                        disabled={loading || uploading}
                    />

                    {/* Location Section */}
                    <Input
                        label="Location"
                        placeholder="City, neighborhood, etc."
                        value={location}
                        onChangeText={setLocation}
                        disabled={loading || uploading}
                    />

                    {/* Share Toggle */}
                    <HStack justify="space-between" align="center">
                        <Body>Share with friends</Body>
                        <Switch
                            value={shareWithFriends}
                            onValueChange={setShareWithFriends}
                            disabled={loading || uploading}
                            trackColor={{
                                false: theme.colors.border,
                                true: theme.colors.secondary,
                            }}
                            thumbColor={
                                shareWithFriends ? theme.colors.primary : theme.colors.border
                            }
                        />
                    </HStack>

                    {/* Loading Indicator */}
                    {uploading && <LoadingSpinner message="Uploading photo..." fullScreen={false} />}

                    {/* Submit Button */}
                    <Button
                        label={loading ? "Submitting..." : "Submit completion"}
                        onPress={onSubmit}
                        disabled={loading || uploading}
                        loading={loading}
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
    previewImage: {
        width: "100%",
        height: 250,
        borderRadius: theme.radius.base,
        marginBottom: theme.spacing.sm,
    },
});
