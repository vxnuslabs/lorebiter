import { createAuthClient } from '@neondatabase/auth';
import { BetterAuthReactAdapter } from '@neondatabase/auth/react';

const getBaseUrl = () => {
  if (typeof window !== "undefined") return window.location.origin + "/api/auth";
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL + "/api/auth";
  return "http://localhost:3000/api/auth";
};

export const authClient = createAuthClient(getBaseUrl(), {
  adapter: BetterAuthReactAdapter(),
});

export const { useSession, signIn, signUp, signOut, forgetPassword } = authClient;
