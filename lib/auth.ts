import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { db } from "./db/client";
import * as schema from "./db/schema";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg", // using postgres driver
        schema: schema, // Provide the schema object 
    }),
    emailAndPassword: {
        enabled: true,
        async sendResetPassword({ user, url }) {
            console.log(`Reset password link for ${user.email}: ${url}`);
            // In production, use a real email service:
            // await resend.emails.send({ ... });
        },
    },
    // Better Auth can be extended with custom user fields
    user: {
        additionalFields: {
            phoneNumber: {
                type: "string",
                required: false,
            },
            bvnVerified: {
                type: "boolean",
                required: false,
            },
            bvnHash: {
                type: "string",
                required: false,
            }
        }
    }
});
