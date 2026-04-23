
import middy from "@middy/core";
import { APIGatewayProxyResultV2 } from "aws-lambda";
import createError from "http-errors";

import { prisma } from "@/core/db/prisma";
import { IAPIGatewayProxyEventWithUser } from "@/core/helpers/utils/api/types";

export type IPermissionGroups = {
  requiredPermissionGroups?: string[];
};

export interface IAuthMiddlewareOptions extends IPermissionGroups {
  optional?: boolean;
}

const ROLE_HIERARCHY = {
  owner: 3,
  admin: 2,
  user: 1,
} as const;

type Role = keyof typeof ROLE_HIERARCHY;
const KNOWN_GROUPS = ["owner", "admin", "supplier", "user"] as const;

const normalizeGroups = (groups: string[]): string[] => {
  const cleaned = groups
    .map((group) => group.trim().toLowerCase())
    .filter(Boolean);

  if (cleaned.length === 1) {
    const merged = cleaned[0];
    const extracted = KNOWN_GROUPS.filter((group) => merged.includes(group));
    if (extracted.length > 1) return extracted;
  }

  return Array.from(new Set(cleaned));
};

const parseCognitoGroups = (rawGroups: unknown): string[] => {
  if (Array.isArray(rawGroups)) {
    return normalizeGroups(rawGroups
      .filter((group): group is string => typeof group === "string")
      .map((group) => group.trim().toLowerCase())
      .filter(Boolean));
  }

  if (typeof rawGroups !== "string") return [];

  const normalized = rawGroups
    .replace(/]\s*\[/g, ",")
    .replace(/[\[\]"]/g, "")
    .trim();

  if (!normalized) return [];

  return normalizeGroups(normalized
    .split(/[,\s]+/)
    .map((group) => group.trim().toLowerCase())
    .filter(Boolean));
};

const authMiddleware = (opts?: IAuthMiddlewareOptions) => {
  const { requiredPermissionGroups, optional } = opts || {};

  const before: middy.MiddlewareFn<
    IAPIGatewayProxyEventWithUser,
    APIGatewayProxyResultV2
  > = async (request) => {
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

    const sub = claims.sub as string | undefined;
    const email = claims.email as string | undefined;

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
          isActive: true,
        },
      });
    } else {
      // 🔄 Cognito ↔ DB role sync
      const needsGroupSync =
        JSON.stringify(user.groups.slice().sort()) !==
        JSON.stringify(cognitoGroups.slice().sort());

      if (needsGroupSync) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { groups: cognitoGroups },
        });
      }
    }

    if (!user.isActive) {
      throw createError.Forbidden("User is disabled");
    }

    event.user = {
      id: user.id,
      identifier: user.identifier,
      email: user.email,
      groups: user.groups,
      supplierId: user.supplierId,
      isOwner: user.groups.includes("owner"),
      isAdmin: user.groups.includes("admin"),
      isSupplier: user.groups.includes("supplier"),
    };

    // 🔐 Role check
    if (requiredPermissionGroups?.length) {
      const coreRoles = new Set<Role>(["owner", "admin", "user"]);
      const userGroups = event.user.groups;

      const hasDirectGroupMatch = requiredPermissionGroups.some((group) =>
        userGroups.includes(group)
      );

      const coreRequired = requiredPermissionGroups.filter((group) =>
        coreRoles.has(group as Role)
      ) as Role[];

      const userCoreMaxRoleLevel = Math.max(
        0,
        ...userGroups
          .filter((group): group is Role => coreRoles.has(group as Role))
          .map((group) => ROLE_HIERARCHY[group])
      );

      const requiredCoreMaxRoleLevel = coreRequired.length
        ? Math.max(...coreRequired.map((group) => ROLE_HIERARCHY[group]))
        : 0;

      const hasHierarchyMatch =
        coreRequired.length > 0 &&
        userCoreMaxRoleLevel >= requiredCoreMaxRoleLevel;

      if (!hasDirectGroupMatch && !hasHierarchyMatch) {
        throw createError.Forbidden("User does not have permission");
      }
    }

  };

  return { before };
};

export default authMiddleware;
