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
import { config } from '../constants/config';

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
  return signIn({ username: email, password });
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
