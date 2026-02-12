import { Resource } from "sst";
import { PrismaClient } from "../../../prisma/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString =
    `postgresql://${Resource.MyPostgres.username}` +
    `:${Resource.MyPostgres.password}` +
    `@${Resource.MyPostgres.host}` +
    `:${Resource.MyPostgres.port}` +
    `/${Resource.MyPostgres.database}`;

const adapter = new PrismaPg({ connectionString });

declare global {
    var __prisma: PrismaClient | undefined;
}

const basePrisma =
    global.__prisma ??
    new PrismaClient({
        adapter,
        log:
            process.env.NODE_ENV === "development"
                ? ["query", "error", "warn"]
                : ["error"],
    });

if (process.env.NODE_ENV !== "production") {
    global.__prisma = basePrisma;
}

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

            async findFirst({ args, query }) {
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
            async findFirst({ args, query }) {
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
        },
    }
});
