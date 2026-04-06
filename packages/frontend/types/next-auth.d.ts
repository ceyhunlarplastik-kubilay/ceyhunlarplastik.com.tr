import "next-auth";

declare module "next-auth" {
    interface Session {
        idToken?: string;
        accessToken?: string;
        error?: string;
        user?: {
            name?: string | null;
            email?: string | null;
            image?: string | null;
            groups?: string[];
        };
    }
}