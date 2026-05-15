import config from "../../../.././../../../config";
import { CognitoIdentityProviderClient, AdminGetUserCommand, AdminAddUserToGroupCommand, AdminRemoveUserFromGroupCommand, } from "@aws-sdk/client-cognito-identity-provider";
const cognitoClient = new CognitoIdentityProviderClient({
    region: config.AWS_REGION || "eu-west-1",
});
export const cognitoUserRepository = () => {
    const getUser = async (userPoolId, username) => {
        return cognitoClient.send(new AdminGetUserCommand({
            UserPoolId: userPoolId,
            Username: username,
        }));
    };
    const addToGroup = async (userPoolId, username, groupName) => {
        await cognitoClient.send(new AdminAddUserToGroupCommand({
            UserPoolId: userPoolId,
            Username: username,
            GroupName: groupName,
        }));
    };
    const removeFromGroup = async (userPoolId, username, groupName) => {
        await cognitoClient.send(new AdminRemoveUserFromGroupCommand({
            UserPoolId: userPoolId,
            Username: username,
            GroupName: groupName,
        }));
    };
    return {
        getUser,
        addToGroup,
        removeFromGroup,
    };
};
