import config from "../../../.././../../../config";
import {
    CognitoIdentityProviderClient,
    AdminCreateUserCommand,
    AdminDeleteUserCommand,
    AdminGetUserCommand,
    AdminAddUserToGroupCommand,
    AdminRemoveUserFromGroupCommand,
    AdminDeleteUserAttributesCommand,
    AdminSetUserPasswordCommand,
    AdminUpdateUserAttributesCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const cognitoClient = new CognitoIdentityProviderClient({
    // region: config.AWS_REGION || "eu-west-1",
    region: config.AWS_REGION,
})

export interface ICognitoUserRepository {
    createUser(
        userPoolId: string,
        input: {
            username: string
            temporaryPassword: string
            email: string
            firstName?: string | null
            lastName?: string | null
            name?: string | null
        }
    ): Promise<{
        username: string
        cognitoSub: string | null
    }>;
    getUser(userPoolId: string, username: string): Promise<any>;
    deleteUser(userPoolId: string, username: string): Promise<void>;
    addToGroup(
        userPoolId: string,
        username: string,
        groupName: string
    ): Promise<void>;
    removeFromGroup(
        userPoolId: string,
        username: string,
        groupName: string
    ): Promise<void>;
    updateAttributes(
        userPoolId: string,
        username: string,
        attributes: {
            email?: string | null
            phoneNumber?: string | null
            firstName?: string | null
            lastName?: string | null
            name?: string | null
        }
    ): Promise<void>;
    setPermanentPassword(
        userPoolId: string,
        username: string,
        password: string
    ): Promise<void>;
}

export const cognitoUserRepository = (): ICognitoUserRepository => {
    const createUser = async (
        userPoolId: string,
        input: {
            username: string
            temporaryPassword: string
            email: string
            firstName?: string | null
            lastName?: string | null
            name?: string | null
        },
    ) => {
        const response = await cognitoClient.send(
            new AdminCreateUserCommand({
                UserPoolId: userPoolId,
                Username: input.username,
                TemporaryPassword: input.temporaryPassword,
                MessageAction: "SUPPRESS",
                UserAttributes: [
                    { Name: "email", Value: input.email },
                    { Name: "email_verified", Value: "true" },
                    ...(input.firstName ? [{ Name: "given_name", Value: input.firstName }] : []),
                    ...(input.lastName ? [{ Name: "family_name", Value: input.lastName }] : []),
                    ...(input.name ? [{ Name: "name", Value: input.name }] : []),
                ],
            }),
        )

        const cognitoSub = response.User?.Attributes?.find((attribute) => attribute.Name === "sub")?.Value ?? null

        return {
            username: input.username,
            cognitoSub,
        }
    }

    const getUser = async (userPoolId: string, username: string) => {
        return cognitoClient.send(
            new AdminGetUserCommand({
                UserPoolId: userPoolId,
                Username: username,
            })
        );
    };

    const deleteUser = async (userPoolId: string, username: string) => {
        await cognitoClient.send(
            new AdminDeleteUserCommand({
                UserPoolId: userPoolId,
                Username: username,
            }),
        )
    }

    const addToGroup = async (
        userPoolId: string,
        username: string,
        groupName: string
    ) => {
        await cognitoClient.send(
            new AdminAddUserToGroupCommand({
                UserPoolId: userPoolId,
                Username: username,
                GroupName: groupName,
            })
        );
    };

    const removeFromGroup = async (
        userPoolId: string,
        username: string,
        groupName: string
    ) => {
        await cognitoClient.send(
            new AdminRemoveUserFromGroupCommand({
                UserPoolId: userPoolId,
                Username: username,
                GroupName: groupName,
            })
        );
    };

    const updateAttributes = async (
        userPoolId: string,
        username: string,
        attributes: {
            email?: string | null
            phoneNumber?: string | null
            firstName?: string | null
            lastName?: string | null
            name?: string | null
        },
    ) => {
        const updates: Array<{ Name: string; Value: string }> = []
        const deletes: string[] = []

        if (attributes.email !== undefined && attributes.email) {
            updates.push({ Name: "email", Value: attributes.email })
            updates.push({ Name: "email_verified", Value: "true" })
        }

        if (attributes.phoneNumber !== undefined) {
            if (attributes.phoneNumber) {
                updates.push({ Name: "phone_number", Value: attributes.phoneNumber })
            } else {
                deletes.push("phone_number")
            }
        }

        if (attributes.firstName !== undefined) {
            if (attributes.firstName) {
                updates.push({ Name: "given_name", Value: attributes.firstName })
            } else {
                deletes.push("given_name")
            }
        }

        if (attributes.lastName !== undefined) {
            if (attributes.lastName) {
                updates.push({ Name: "family_name", Value: attributes.lastName })
            } else {
                deletes.push("family_name")
            }
        }

        if (attributes.name !== undefined) {
            if (attributes.name) {
                updates.push({ Name: "name", Value: attributes.name })
            } else {
                deletes.push("name")
            }
        }

        if (updates.length > 0) {
            await cognitoClient.send(
                new AdminUpdateUserAttributesCommand({
                    UserPoolId: userPoolId,
                    Username: username,
                    UserAttributes: updates,
                }),
            )
        }

        if (deletes.length > 0) {
            await cognitoClient.send(
                new AdminDeleteUserAttributesCommand({
                    UserPoolId: userPoolId,
                    Username: username,
                    UserAttributeNames: deletes,
                }),
            )
        }
    };

    const setPermanentPassword = async (
        userPoolId: string,
        username: string,
        password: string,
    ) => {
        await cognitoClient.send(
            new AdminSetUserPasswordCommand({
                UserPoolId: userPoolId,
                Username: username,
                Password: password,
                Permanent: true,
            }),
        )
    }

    return {
        createUser,
        getUser,
        deleteUser,
        addToGroup,
        removeFromGroup,
        updateAttributes,
        setPermanentPassword,
    };
};
