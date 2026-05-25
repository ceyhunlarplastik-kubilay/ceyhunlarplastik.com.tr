import { PostConfirmationTriggerEvent } from "aws-lambda";
import { userRepository } from "@/core/helpers/prisma/users/repository";
import { buildUserDisplayName } from "@/core/helpers/users/displayName";

export const handler = async (
    event: PostConfirmationTriggerEvent
): Promise<PostConfirmationTriggerEvent> => {

    // sadece confirm signup'ta çalışsın
    if (event.triggerSource !== "PostConfirmation_ConfirmSignUp") {
        return event;
    }

    const attrs = event.request.userAttributes;

    const cognitoSub = attrs.sub;
    const email = attrs.email;
    const firstName = attrs.given_name?.trim() || null;
    const lastName = attrs.family_name?.trim() || null;

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
            identifier: buildUserDisplayName({ firstName, lastName, email }) || email.split("@")[0],
            firstName,
            lastName,
            phone: attrs.phone_number?.trim() || null,
            groups: ["user"],
            accessStatus: "PENDING_REVIEW",
            accessStatusChangedAt: new Date(),
            isActive: true,
        } as any);
    }

    return event;
};
