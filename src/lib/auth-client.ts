import { createAuthClient } from "better-auth/client";

// Get the server URL from environment variables
// In React Native Expo, environment variables must be prefixed with EXPO_PUBLIC_
const getServerURL = () => {
  // Check for Expo environment variables first
  if (process.env.EXPO_PUBLIC_SERVER_URL) {
    return process.env.EXPO_PUBLIC_SERVER_URL;
  }
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Fallback for web/server environments
  if (process.env.BETTER_AUTH_URL) {
    return process.env.BETTER_AUTH_URL;
  }

  // Default fallback - use your computer's IP instead of localhost for mobile
  return "http://192.168.0.137:3000";
};

const serverURL = getServerURL();
console.log("🔗 Auth client connecting to:", serverURL);

export const authClient = createAuthClient({
  baseURL: serverURL,
  // Add fetch options for mobile compatibility
  fetchOptions: {
    credentials: "include",
  },
});

export const { signUp, signIn, signOut, getSession, useSession } = authClient;
