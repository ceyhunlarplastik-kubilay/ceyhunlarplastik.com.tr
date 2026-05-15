import { userRepository } from "@/core/helpers/prisma/users/repository";
export const handler = async (event) => {
    // sadece confirm signup'ta çalışsın
    if (event.triggerSource !== "PostConfirmation_ConfirmSignUp") {
        return event;
    }
    const attrs = event.request.userAttributes;
    const cognitoSub = attrs.sub;
    const email = attrs.email;
    if (!cognitoSub || !email) {
        console.error("Missing cognito attributes", attrs);
        return event;
    }
    const repo = userRepository();
    const existing = await repo.getUserByCognitoSub?.(cognitoSub);
    if (!existing) {
        await repo.createUser({
            cognitoSub,
            email,
            identifier: email.split("@")[0],
            groups: ["user"],
            accessStatus: "PENDING_REVIEW",
            accessStatusChangedAt: new Date(),
            isActive: true,
        });
    }
    return event;
};
