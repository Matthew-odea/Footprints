import React from "react";
import { StatusBar } from "expo-status-bar";

import { AppNavigator } from "./src/navigation/AppNavigator";
import { AuthProvider } from "./src/state/AuthContext";

export default function App() {
    return (
        <AuthProvider>
            <StatusBar style="auto" />
            <AppNavigator />
        </AuthProvider>
    );
}
