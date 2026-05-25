import "next-auth/jwt";

declare module "next-auth/jwt" {
    interface JWT {
        dbUserId?: string;
        identifier?: string;
        firstName?: string | null;
        lastName?: string | null;
        idToken?: string;
        accessToken?: string;
        groups?: string[];
        accessStatus?: "PENDING_REVIEW" | "ACTIVE" | "SUSPENDED" | "REJECTED";
        customerId?: string | null;
        supplierId?: string | null;
        refreshToken?: string;
        expiresAt?: number;
        error?: string;
    }
}
