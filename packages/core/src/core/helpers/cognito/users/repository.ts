import config from "../../../.././../../../config";
import {
    CognitoIdentityProviderClient,
    AdminGetUserCommand,
    AdminAddUserToGroupCommand,
    AdminRemoveUserFromGroupCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const cognitoClient = new CognitoIdentityProviderClient({
    region: config.AWS_REGION || "eu-central-1",
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

    return {
        getUser,
        addToGroup,
        removeFromGroup,
    };
};
