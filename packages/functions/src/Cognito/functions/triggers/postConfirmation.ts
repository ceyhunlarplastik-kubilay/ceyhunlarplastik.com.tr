import { PostConfirmationTriggerEvent } from "aws-lambda";
import { userRepository } from "@/core/helpers/prisma/users/repository";

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
            isActive: true,
        });
    }

    return event;
};
