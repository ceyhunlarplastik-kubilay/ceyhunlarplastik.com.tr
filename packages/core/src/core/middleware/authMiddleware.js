import createError from "http-errors";
import { prisma } from "@/core/db/prisma";
const ROLE_HIERARCHY = {
    owner: 3,
    admin: 2,
    user: 1,
};
const KNOWN_GROUPS = ["owner", "admin", "purchasing", "sales", "sales_director", "supplier", "customer", "user"];
const normalizeGroups = (groups) => {
    const cleaned = groups
        .map((group) => group.trim().toLowerCase())
        .filter(Boolean);
    return Array.from(new Set(cleaned));
};
const parseCognitoGroups = (rawGroups) => {
    if (Array.isArray(rawGroups)) {
        return normalizeGroups(rawGroups
            .filter((group) => typeof group === "string")
            .flatMap((group) => group
            .replace(/[\[\]"]/g, "")
            .split(/[,\s]+/))
            .map((group) => group.trim().toLowerCase())
            .filter((group) => KNOWN_GROUPS.includes(group)));
    }
    if (typeof rawGroups !== "string")
        return [];
    const normalized = rawGroups
        .replace(/]\s*\[/g, ",")
        .replace(/[\[\]"]/g, "")
        .trim();
    if (!normalized)
        return [];
    return normalizeGroups(normalized
        .split(/[,\s]+/)
        .map((group) => group.trim().toLowerCase())
        .filter((group) => KNOWN_GROUPS.includes(group)));
};
const authMiddleware = (opts) => {
    const { requiredPermissionGroups, optional, allowInactive } = opts || {};
    const before = async (request) => {
        const { event } = request;
        const claims = event.requestContext.authorizer?.jwt?.claims;
        // console.log("FULL CLAIMS RAW:", event.requestContext.authorizer?.jwt);
        // 🔓 Optional auth
        if (!claims) {
            if (requiredPermissionGroups?.length) {
                throw createError.Unauthorized("Missing authorizer context");
            }
            if (!optional) {
                throw createError.Unauthorized("Authentication required");
            }
            return;
        }
        const sub = claims.sub;
        const email = claims.email;
        if (!sub) {
            throw createError.Unauthorized("Invalid token");
        }
        const rawGroups = claims["cognito:groups"];
        const parsedGroups = parseCognitoGroups(rawGroups);
        const cognitoGroups = parsedGroups.length > 0 ? parsedGroups : ["user"];
        // console.log("PARSED GROUPS:", cognitoGroups);
        if (!sub || !email) {
            throw createError.Unauthorized("Invalid user context from authorizer");
        }
        // 🔁 Auto-create / sync user
        let user = await prisma.user.findUnique({
            where: { cognitoSub: sub },
        });
        if (!user) {
            user = await prisma.user.create({
                data: {
                    cognitoSub: sub,
                    email,
                    identifier: email.split("@")[0],
                    groups: cognitoGroups,
                    accessStatus: cognitoGroups.includes("user") ? "PENDING_REVIEW" : "ACTIVE",
                    isActive: true,
                },
            });
        }
        else if (user.email !== email) {
            user = await prisma.user.update({
                where: { id: user.id },
                data: { email },
            });
        }
        if (!user.isActive) {
            throw createError.Forbidden("User is disabled");
        }
        if (user.accessStatus !== "ACTIVE" && !allowInactive) {
            throw createError.Forbidden("User access is not active");
        }
        event.user = {
            id: user.id,
            dbUserId: user.id,
            identifier: user.identifier,
            email: user.email,
            groups: user.groups,
            accessStatus: user.accessStatus,
            supplierId: user.supplierId,
            customerId: user.customerId,
            isOwner: user.groups.includes("owner"),
            isAdmin: user.groups.includes("admin"),
            isSupplier: user.groups.includes("supplier"),
            isPurchasing: user.groups.includes("purchasing"),
            isSales: user.groups.includes("sales"),
            isSalesDirector: user.groups.includes("sales_director"),
            isCustomer: user.groups.includes("customer"),
        };
        // 🔐 Role check
        if (requiredPermissionGroups?.length) {
            const coreRoles = new Set(["owner", "admin", "user"]);
            const userGroups = event.user.groups;
            const hasDirectGroupMatch = requiredPermissionGroups.some((group) => userGroups.includes(group));
            const coreRequired = requiredPermissionGroups.filter((group) => coreRoles.has(group));
            const userCoreMaxRoleLevel = Math.max(0, ...userGroups
                .filter((group) => coreRoles.has(group))
                .map((group) => ROLE_HIERARCHY[group]));
            const requiredCoreMaxRoleLevel = coreRequired.length
                ? Math.max(...coreRequired.map((group) => ROLE_HIERARCHY[group]))
                : 0;
            const hasHierarchyMatch = coreRequired.length > 0 &&
                userCoreMaxRoleLevel >= requiredCoreMaxRoleLevel;
            if (!hasDirectGroupMatch && !hasHierarchyMatch) {
                throw createError.Forbidden("User does not have permission");
            }
        }
    };
    return { before };
};
export default authMiddleware;
