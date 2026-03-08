const apiUrlFromEnv = (globalThis as { process?: { env?: { EXPO_PUBLIC_API_BASE_URL?: string } } }).process?.env
	?.EXPO_PUBLIC_API_BASE_URL;

export const API_BASE_URL = apiUrlFromEnv ?? "https://9fal46jhxe.execute-api.us-east-1.amazonaws.com";
