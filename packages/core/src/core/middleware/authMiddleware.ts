
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
    let cognitoGroups: string[] = [];

    if (cognitoGroups.length === 0) {
      cognitoGroups = ["user"];
    }

    if (Array.isArray(rawGroups)) {
      cognitoGroups = rawGroups;
    } else if (typeof rawGroups === "string") {
      cognitoGroups = rawGroups
        .replace(/[\[\]\s]/g, "")
        .split(",")
        .filter(Boolean);
    }

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
      isOwner: user.groups.includes("owner"),
      isAdmin: user.groups.includes("admin"),
    };

    // 🔐 Role check
    if (requiredPermissionGroups?.length) {
      const userMaxRoleLevel = Math.max(
        ...event.user!.groups.map((g) =>
          ROLE_HIERARCHY[g as Role] ?? 0
        )
      );

      const requiredMaxRoleLevel = Math.max(
        ...requiredPermissionGroups.map((g) =>
          ROLE_HIERARCHY[g as Role] ?? 0
        )
      );

      if (userMaxRoleLevel < requiredMaxRoleLevel) {
        throw createError.Forbidden("User does not have permission");
      }
    }

  };

  return { before };
};

export default authMiddleware;
