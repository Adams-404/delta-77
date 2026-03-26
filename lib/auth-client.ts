import { createAuthClient } from "better-auth/react";

const getBaseUrl = () => {
  // Try to use the user-defined URL first
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  // Fall back to Vercel's automatic URL if available
  if (process.env.NEXT_PUBLIC_VERCEL_URL) return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  // Default to localhost for development
  return "http://localhost:3000";
};

export const authClient = createAuthClient({
  baseURL: getBaseUrl(),
  user: {
    additionalFields: {
      phoneNumber: {
        type: "string",
      },
      bvnVerified: {
        type: "boolean",
      }
    }
  }
});
