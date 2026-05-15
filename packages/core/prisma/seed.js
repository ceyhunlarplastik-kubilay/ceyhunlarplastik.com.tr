// import { prisma } from "./prismaClient.js";
import { prisma } from "../src/core/db/prisma.js";
async function main() {
    const email = "kubilayuysal.ceyhunlarplastik+owner@gmail.com";
    const cognitoSub = "seed-owner"; // ⚠️ Bu geçici. Cognito login olduğunda overwrite edilecek.
    const existing = await prisma.user.findUnique({
        where: { email },
    });
    if (existing) {
        console.log("✅ Seed user already exists:", existing.email);
        return;
    }
    const user = await prisma.user.create({
        data: {
            cognitoSub,
            email,
            identifier: "owner",
            groups: ["owner", "admin"],
            isActive: true,
        },
    });
    console.log("🌱 Seed user created:", {
        id: user.id,
        email: user.email,
        groups: user.groups,
    });
}
main()
    .catch((e) => {
    console.error("❌ Seed failed", e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
