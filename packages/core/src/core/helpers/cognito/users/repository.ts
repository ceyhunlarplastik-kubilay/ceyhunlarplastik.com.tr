import config from "../../../.././../../../config";
import {
    CognitoIdentityProviderClient,
    AdminGetUserCommand,
    AdminAddUserToGroupCommand,
    AdminRemoveUserFromGroupCommand,
    AdminDeleteUserAttributesCommand,
    AdminUpdateUserAttributesCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const cognitoClient = new CognitoIdentityProviderClient({
    region: config.AWS_REGION || "eu-west-1",
})

export interface ICognitoUserRepository {
    getUser(userPoolId: string, username: string): Promise<any>;
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
}

export const cognitoUserRepository = (): ICognitoUserRepository => {
    const getUser = async (userPoolId: string, username: string) => {
        return cognitoClient.send(
            new AdminGetUserCommand({
                UserPoolId: userPoolId,
                Username: username,
            })
        );
    };

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
                updates.push({ Name: "phone_number_verified", Value: "true" })
            } else {
                deletes.push("phone_number", "phone_number_verified")
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

    return {
        getUser,
        addToGroup,
        removeFromGroup,
        updateAttributes,
    };
};
