import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { ErrorBoundary } from "../components/ErrorBoundary";
import { HomeScreen } from "../screens/HomeScreen";
import { HistoryScreen } from "../screens/HistoryScreen";
import { FeedScreen } from "../screens/FeedScreen";
import { LoginScreen } from "../screens/LoginScreen";
import { PromptDetailScreen } from "../screens/PromptDetailScreen";
import { PromptUploadScreen } from "../screens/PromptUploadScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { useAuth } from "../state/AuthContext";
import { AppTabParamList, RootStackParamList } from "./types";

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<AppTabParamList>();

function AppTabs() {
    return (
        <Tab.Navigator>
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Feed" component={FeedScreen} />
            <Tab.Screen name="History" component={HistoryScreen} />
            <Tab.Screen name="Settings" component={SettingsScreen} />
        </Tab.Navigator>
    );
}

export function AppNavigator() {
    const { token } = useAuth();

    return (
        <ErrorBoundary>
            <NavigationContainer>
                <RootStack.Navigator>
                    {!token ? (
                        <RootStack.Screen
                            name="Login"
                            component={LoginScreen}
                            options={{ headerShown: false }}
                        />
                    ) : (
                        <>
                            <RootStack.Screen
                                name="AppTabs"
                                component={AppTabs}
                                options={{ headerShown: false }}
                            />
                            <RootStack.Screen
                                name="PromptDetail"
                                component={PromptDetailScreen}
                                options={{ title: "Prompt details" }}
                            />
                            <RootStack.Screen
                                name="PromptUpload"
                                component={PromptUploadScreen}
                                options={{ title: "Upload completion" }}
                            />
                        </>
                    )}
                </RootStack.Navigator>
            </NavigationContainer>
        </ErrorBoundary>
    );
}
