import "next-auth/jwt";

declare module "next-auth/jwt" {
    interface JWT {
        idToken?: string;
        accessToken?: string;
        groups?: string[];
    }
}