import '@testing-library/jest-native/extend-expect';

// Mock global fetch
global.fetch = jest.fn();

// Mock React Navigation
jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useFocusEffect: (callback: () => void) => {
    // Run callback immediately in tests
    callback();
  },
  useNavigation: () => ({
    navigate: jest.fn(),
    push: jest.fn(),
    reset: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
}));

// Mock expo-image-picker
jest.mock("expo-image-picker", () => ({
  launchCameraAsync: jest.fn(() =>
    Promise.resolve({
      assets: [
        {
          uri: "file:///mock/image.jpg",
          width: 1080,
          height: 1920,
        },
      ],
      canceled: false,
    })
  ),
  launchImageLibraryAsync: jest.fn(() =>
    Promise.resolve({
      assets: [
        {
          uri: "file:///mock/image.jpg",
          width: 1080,
          height: 1920,
        },
      ],
      canceled: false,
    })
  ),
  getCameraPermissionsAsync: jest.fn(() =>
    Promise.resolve({ granted: true })
  ),
  requestCameraPermissionsAsync: jest.fn(() =>
    Promise.resolve({ granted: true })
  ),
}));

// Mock expo-file-system
jest.mock("expo-file-system", () => ({
  readAsStringAsync: jest.fn(() => Promise.resolve("base64string")),
  documentDirectory: "/mock/",
}));

// Silence console warnings during tests
const originalConsole = { ...console };
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};
