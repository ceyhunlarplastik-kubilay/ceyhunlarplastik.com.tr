import { Resource } from "sst";
import { PrismaClient } from "../../../prisma/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const parsePositiveInteger = (value: string | undefined, fallback: number) => {
    if (!value) return fallback

    const parsed = Number.parseInt(value, 10)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

const isDevelopment = process.env.NODE_ENV === "development"

type LinkedNeonPostgres = {
    url: string
}

type LinkedRdsPostgres = {
    database: string
    host: string
    password: string
    port: number | string
    username: string
}

type LinkedPostgres = LinkedNeonPostgres | LinkedRdsPostgres

const hasConnectionUrl = (resource: LinkedPostgres): resource is LinkedNeonPostgres =>
    "url" in resource && typeof resource.url === "string" && resource.url.length > 0

const buildConnectionString = (resource: LinkedPostgres) => {
    if (hasConnectionUrl(resource)) return resource.url

    return (
        `postgresql://${resource.username}` +
        `:${resource.password}` +
        `@${resource.host}` +
        `:${resource.port}` +
        `/${resource.database}`
    )
}

const connectionString = buildConnectionString(
    Resource.MyPostgres as unknown as LinkedPostgres,
)

const adapter = new PrismaPg({
    connectionString,
    max: parsePositiveInteger(process.env.DATABASE_POOL_MAX, isDevelopment ? 10 : 1),
    connectionTimeoutMillis: parsePositiveInteger(
        process.env.DATABASE_CONNECTION_TIMEOUT_MS,
        5_000,
    ),
    idleTimeoutMillis: parsePositiveInteger(
        process.env.DATABASE_IDLE_TIMEOUT_MS,
        10_000,
    ),
});

declare global {
    var __prisma: PrismaClient | undefined;
}

const globalForPrisma = globalThis as typeof globalThis & {
    __prisma?: PrismaClient
}

const basePrisma =
    globalForPrisma.__prisma ??
    new PrismaClient({
        adapter,
        log:
            process.env.NODE_ENV === "development"
                ? ["query", "error", "warn"]
                : ["error"],
    });

globalForPrisma.__prisma = basePrisma;

/* --------------------------------------------------
   SOFT DELETE EXTENSION (Prisma 7)
-------------------------------------------------- */

export const prisma = basePrisma.$extends({
    query: {
        color: {
            async findMany({ args, query }) {
                args.where = {
                    ...args.where,
                    isActive: true,
                };
                return query(args);
            },

            async findUnique({ args, query }) {
                args.where = {
                    ...args.where,
                    isActive: true,
                }
                return query(args)
            },

            // OrThrow varyantları ayrı operasyonlardır; override edilmezlerse
            // soft-delete filtresini atlarlar (colors repository findUniqueOrThrow kullanıyor).
            async findUniqueOrThrow({ args, query }) {
                args.where = {
                    ...args.where,
                    isActive: true,
                }
                return query(args)
            },

            async findFirst({ args, query }) {
                args.where = {
                    ...args.where,
                    isActive: true,
                };
                return query(args);
            },

            async findFirstOrThrow({ args, query }) {
                args.where = {
                    ...args.where,
                    isActive: true,
                };
                return query(args);
            },

            async count({ args, query }) {
                args.where = {
                    ...args.where,
                    isActive: true,
                };
                return query(args);
            },

            async delete({ args }) {
                return basePrisma.color.update({
                    where: args.where,
                    data: { isActive: false },
                });
            },

            async deleteMany({ args }) {
                return basePrisma.color.updateMany({
                    where: args.where,
                    data: { isActive: false },
                });
            },
        },
        supplier: {
            async findMany({ args, query }) {
                args.where = {
                    ...args.where,
                    isActive: true
                }
                return query(args)
            },
            // findUnique/OrThrow override'ları color ile simetrik olmak zorunda;
            // eksik kaldıklarında soft-delete edilmiş supplier id ile geri okunabiliyordu.
            async findUnique({ args, query }) {
                args.where = {
                    ...args.where,
                    isActive: true
                }
                return query(args)
            },
            async findUniqueOrThrow({ args, query }) {
                args.where = {
                    ...args.where,
                    isActive: true
                }
                return query(args)
            },
            async findFirst({ args, query }) {
                args.where = {
                    ...args.where,
                    isActive: true
                }
                return query(args)
            },
            async findFirstOrThrow({ args, query }) {
                args.where = {
                    ...args.where,
                    isActive: true
                }
                return query(args)
            },
            async count({ args, query }) {
                args.where = {
                    ...args.where,
                    isActive: true
                }
                return query(args)
            },
            async delete({ args }) {
                return basePrisma.supplier.update({
                    where: args.where,
                    data: { isActive: false },
                })
            },
            async deleteMany({ args }) {
                return basePrisma.supplier.updateMany({
                    where: args.where,
                    data: { isActive: false },
                })
            },
        },
    }
});
