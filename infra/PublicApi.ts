import config from "../config";
import { rds } from "./db";
const folderPrefix = 'packages/functions/src/PublicApi/functions';

export const publicApi = new sst.aws.ApiGatewayV2("CeyhunlarPublicApi", {
    domain:
        $app.stage === "prod"
            ? {
                name: `api.${config.DOMAIN}`,
                dns: sst.aws.dns({
                    zone: config.HOSTED_ZONE_ID,
                }),
            }
            : $app.stage === "dev"
                ? {
                    name: `dev.api.${config.DOMAIN}`,
                    dns: sst.aws.dns({
                        zone: config.HOSTED_ZONE_ID,
                    }),
                }
                : undefined,
});

const defaultOptions: Omit<sst.aws.FunctionArgs, 'handler'> = {
    // :::tip If you link the function to a resource, the permissions to access it are automatically added. :::
    /* permissions: [
      {
        actions: ["dynamodb:Query", "dynamodb:GetItem","dynamodb:PutItem", "states:StartExecution"],
        resources: [table.arn]
        // resources: ["arn:aws:dynamodb:eu-central-1:657914290529:table/portfolio-kubilay-kubilay-PortfolioTable-wzcszuuz"]
      }
    ] */
    runtime: 'nodejs20.x',
    link: [rds],
}

publicApi.route('GET /users/{id}', {
    handler: `${folderPrefix}/users/actions.getUser`,
    ...defaultOptions,
})
publicApi.route('POST /users', {
    handler: `${folderPrefix}/users/actions.createUser`,
    ...defaultOptions,
})
