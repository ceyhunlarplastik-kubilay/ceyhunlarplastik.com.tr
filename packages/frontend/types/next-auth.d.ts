import "next-auth";
import type { DefaultSession } from "next-auth"

declare module "next-auth" {
    interface Session {
        idToken?: string;
        accessToken?: string;
        error?: string;
        user?: DefaultSession["user"] & {
            id?: string;
            dbUserId?: string;
            identifier?: string;
            firstName?: string | null;
            lastName?: string | null;
            name?: string | null;
            email?: string | null;
            image?: string | null;
            groups?: string[];
            accessStatus?: "PENDING_REVIEW" | "ACTIVE" | "SUSPENDED" | "REJECTED";
            customerId?: string | null;
            supplierId?: string | null;
            isActive?: boolean;
        };
    }
}
