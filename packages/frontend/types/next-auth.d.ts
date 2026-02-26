import "next-auth";

declare module "next-auth" {
    interface Session {
        idToken?: string;
        accessToken?: string;
        user?: {
            email?: string | null;
            groups?: string[];
        };
    }
}