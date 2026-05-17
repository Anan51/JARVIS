// ==========================================
// JARVIS — Auth Service (Cognito + Amplify)
// ==========================================

import { Amplify } from 'aws-amplify';
import {
  signIn,
  signUp,
  signOut,
  confirmSignUp,
  getCurrentUser,
  fetchAuthSession,
  fetchUserAttributes,
  resendSignUpCode,
} from 'aws-amplify/auth';
import { cognitoUserPoolsTokenProvider } from 'aws-amplify/auth/cognito';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { config } from '../constants/config';

// Create a robust, platform-agnostic storage adapter
const platformStorage = {
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      window.localStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  },
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return window.localStorage.getItem(key);
    } else {
      return await SecureStore.getItemAsync(key);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      window.localStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  },
  clear: async (): Promise<void> => {
    if (Platform.OS === 'web') {
      window.localStorage.clear();
    }
  }
};

// Override Amplify's default storage (bypasses AsyncStorage)
cognitoUserPoolsTokenProvider.setKeyValueStorage(platformStorage);

// Initialize Amplify
export function configureAuth() {
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: config.cognitoUserPoolId,
        userPoolClientId: config.cognitoUserPoolClientId,
        identityPoolId: config.cognitoIdentityPoolId,
        loginWith: {
          email: true,
        },
      },
    },
  });
}

export async function login(email: string, password: string) {
  return signIn({
    username: email,
    password,
    options: {
      authFlowType: 'USER_PASSWORD_AUTH'
    }
  });
}

export async function register(email: string, password: string, fullName?: string) {
  return signUp({
    username: email,
    password,
    options: {
      userAttributes: {
        email,
        ...(fullName ? { name: fullName } : {}),
      },
    },
  });
}

export async function confirmRegistration(email: string, code: string) {
  return confirmSignUp({ username: email, confirmationCode: code });
}

export async function resendConfirmation(email: string) {
  return resendSignUpCode({ username: email });
}

export async function logout() {
  return signOut();
}

export async function getAuthToken(): Promise<string> {
  const session = await fetchAuthSession();
  const token = session.tokens?.idToken?.toString();
  if (!token) throw new Error('No auth token available');
  return token;
}

export async function getUser() {
  try {
    const user = await getCurrentUser();
    const attributes = await fetchUserAttributes();
    return { ...user, attributes };
  } catch {
    return null;
  }
}
