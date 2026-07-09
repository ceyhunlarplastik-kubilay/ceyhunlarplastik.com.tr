import config from "../config";
import { vpc, rds } from "./db";
import { userPool, userPoolClient } from "./cognito";
import { publicBucket } from "./storage";
import { businessApprovalWorkflow } from "./businessWorkflow";
import { apiCors } from "./cors";
import { apiRouteLambdaNamer } from "./lambdaNaming";

const folderPrefix = 'packages/functions/src/ProtectedApi/functions';

export const protectedApi = new sst.aws.ApiGatewayV2("CeyhunlarProtectedApi", {
    cors: apiCors,
    transform: {
        stage: (args) => {
            args.defaultRouteSettings = {
                throttlingRateLimit: 100,
                throttlingBurstLimit: 200,
            };
        },
        route: {
            handler: apiRouteLambdaNamer("protected"),
        },
    },
    domain:
        $app.stage === "prod"
            ? {
                name: `protected.api.${config.DOMAIN}`,
                dns: sst.aws.dns({
                    zone: config.HOSTED_ZONE_ID,
                }),
            }
            : $app.stage === "dev"
                ? {
                    name: `protected.dev.api.${config.DOMAIN}`,
                    dns: sst.aws.dns({
                        zone: config.HOSTED_ZONE_ID,
                    }),
                }
                : undefined,
});

const jwtAuthorizer = protectedApi.addAuthorizer({
    name: "ProtectedJWTAuthorizer",
    jwt: {
        issuer: $interpolate`https://cognito-idp.${aws.getRegionOutput().name}.amazonaws.com/${userPool.id}`,
        // issuer: https://cognito-idp.eu-central-1.amazonaws.com/eu-central-1_2zgv1k8Dy/.well-known/jwks.json,
        audiences: [userPoolClient.id],
        // identitySource: "$request.header.AccessToken"
        identitySource: "$request.header.Authorization"
    }
})

const defaultRouteOptions: Omit<sst.aws.FunctionArgs, 'handler'> = {
    // :::tip If you link the function to a resource, the permissions to access it are automatically added. :::
    /* permissions: [
      {
        actions: ["dynamodb:Query", "dynamodb:GetItem","dynamodb:PutItem", "states:StartExecution"],
        resources: [table.arn]
        // resources: ["arn:aws:dynamodb:eu-central-1:657914290529:table/portfolio-kubilay-kubilay-PortfolioTable-wzcszuuz"]
      }
    ] */
    runtime: 'nodejs22.x',
    vpc: vpc,
    link: [rds, userPool, publicBucket],
    // P1.6 — structured logging (Powertools). retention "1 month" = SST varsayılanı (30gün).
    logging: { retention: "1 month" },
    environment: {
        BUCKET_NAME: publicBucket.name,
        POWERTOOLS_SERVICE_NAME: "ceyhunlar-protected-api",
        POWERTOOLS_LOG_LEVEL: $app.stage === "prod" ? "INFO" : "DEBUG",
        ASSET_PUBLIC_BASE_URL:
            $app.stage === "prod"
                ? `https://cdn.${config.DOMAIN}`
                : $app.stage === "dev"
                    ? `https://dev.${config.DOMAIN}`
                    : $interpolate`https://${publicBucket.name}.s3.amazonaws.com`
    }
}

const frontendBaseUrl =
    $app.stage === "prod"
        ? `https://${config.DOMAIN}`
        : $app.stage === "dev"
            ? `https://dev.${config.DOMAIN}`
            : $app.stage === "test-1"
                ? "https://d32mxh4ylm3z1k.cloudfront.net"
                : "http://localhost:3000"

const portalCustomerInviteRouteOptions: Omit<sst.aws.FunctionArgs, "handler"> = {
    ...defaultRouteOptions,
    environment: {
        ...defaultRouteOptions.environment,
        MAIL_TRANSPORT_MODE: process.env.MAIL_TRANSPORT_MODE ?? "gmail",
        GMAIL_SMTP_USER: process.env.GMAIL_SMTP_USER ?? "",
        GMAIL_SMTP_APP_PASSWORD: process.env.GMAIL_SMTP_APP_PASSWORD ?? "",
        INVITE_FROM_EMAIL: process.env.INVITE_FROM_EMAIL ?? "",
        INVITE_FROM_NAME: process.env.INVITE_FROM_NAME ?? "",
        FRONTEND_BASE_URL: frontendBaseUrl,
    },
}

const businessWorkflowRouteOptions: Omit<sst.aws.FunctionArgs, "handler"> = {
    ...defaultRouteOptions,
    link: [rds, userPool, publicBucket],
    environment: {
        ...defaultRouteOptions.environment,
        BUSINESS_APPROVAL_WORKFLOW_ARN: businessApprovalWorkflow.arn,
    },
    permissions: [
        {
            actions: ["states:*"],
            resources: [
                businessApprovalWorkflow.arn,
                businessApprovalWorkflow.arn.apply((arn) => `${arn.replace("stateMachine", "execution")}:*`),
            ],
        },
        {
            actions: ["states:SendTaskSuccess", "states:SendTaskFailure", "states:SendTaskHeartbeat"],
            resources: ["*"],
        },
    ],
}

// 🔁 reusable auth config
const defaultAuthOptions: sst.aws.ApiGatewayV2RouteArgs = {
    auth: {
        jwt: {
            authorizer: jwtAuthorizer.id,
        },
    },
};

/*----------------------- USERS -----------------------*/

protectedApi.route('GET /users', {
    handler: `${folderPrefix}/users/actions.listUsers`,
    ...defaultRouteOptions
}, { ...defaultAuthOptions });

protectedApi.route('GET /users/{id}', {
    handler: `${folderPrefix}/users/actions.getUser`,
    ...defaultRouteOptions
}, { ...defaultAuthOptions });

protectedApi.route('GET /me', {
    handler: `${folderPrefix}/users/actions.getMe`,
    ...defaultRouteOptions
}, { ...defaultAuthOptions });

protectedApi.route('PUT /me/profile', {
    handler: `${folderPrefix}/users/actions.updateMyProfile`,
    ...defaultRouteOptions
}, { ...defaultAuthOptions });

protectedApi.route('POST /me/profile-image/presign', {
    handler: `${folderPrefix}/users/actions.createMyProfileImageUpload`,
    ...defaultRouteOptions
}, { ...defaultAuthOptions });

protectedApi.route('PUT /me/profile-image', {
    handler: `${folderPrefix}/users/actions.updateMyProfileImage`,
    ...defaultRouteOptions
}, { ...defaultAuthOptions });

protectedApi.route('GET /me/permissions', {
    handler: `${folderPrefix}/users/actions.mePermissions`,
    ...defaultRouteOptions
}, { ...defaultAuthOptions });

protectedApi.route('GET /me/access', {
    handler: `${folderPrefix}/users/actions.getMyAccess`,
    ...defaultRouteOptions
}, { ...defaultAuthOptions });

protectedApi.route('GET /me/notifications', {
    handler: `${folderPrefix}/users/actions.listMyNotifications`,
    ...defaultRouteOptions
}, { ...defaultAuthOptions });

protectedApi.route('POST /me/notifications/{id}/read', {
    handler: `${folderPrefix}/users/actions.markMyNotificationRead`,
    ...defaultRouteOptions
}, { ...defaultAuthOptions });

/*----------------------- COLORS -----------------------*/

protectedApi.route('GET /colors', {
    handler: `${folderPrefix}/colors/actions.listColors`,
    ...defaultRouteOptions
}, { ...defaultAuthOptions });

protectedApi.route('GET /colors/{id}', {
    handler: `${folderPrefix}/colors/actions.getColor`,
    ...defaultRouteOptions
}, { ...defaultAuthOptions });

protectedApi.route('POST /colors', {
    handler: `${folderPrefix}/colors/actions.createColor`,
    ...defaultRouteOptions
}, { ...defaultAuthOptions });

protectedApi.route('PATCH /colors/{id}', {
    handler: `${folderPrefix}/colors/actions.updateColor`,
    ...defaultRouteOptions
}, { ...defaultAuthOptions });

/*----------------------- SUPPLIER VARIANT PRICES -----------------------*/

protectedApi.route('GET /supplier/variant-prices', {
    handler: `${folderPrefix}/supplierVariantPrices/actions.listSupplierVariantPrices`,
    ...defaultRouteOptions
}, { ...defaultAuthOptions });

protectedApi.route('GET /supplier/profile', {
    handler: `${folderPrefix}/supplierVariantPrices/actions.getSupplierProfile`,
    ...defaultRouteOptions
}, { ...defaultAuthOptions });

protectedApi.route('PUT /supplier/profile', {
    handler: `${folderPrefix}/businessRequests/actions.requestSupplierProfileBusinessRequest`,
    ...businessWorkflowRouteOptions
}, { ...defaultAuthOptions });

protectedApi.route('GET /supplier/products', {
    handler: `${folderPrefix}/supplierVariantPrices/actions.listSupplierProducts`,
    ...defaultRouteOptions
}, { ...defaultAuthOptions });

protectedApi.route('PUT /supplier/variant-prices/{id}', {
    handler: `${folderPrefix}/businessRequests/actions.requestSupplierVariantPricingBusinessRequest`,
    ...businessWorkflowRouteOptions
}, { ...defaultAuthOptions });

protectedApi.route('GET /supplier/approval-requests', {
    handler: `${folderPrefix}/businessRequests/actions.listSupplierBusinessRequests`,
    ...defaultRouteOptions
}, { ...defaultAuthOptions });

protectedApi.route('GET /supplier/requests', {
    handler: `${folderPrefix}/businessRequests/actions.listSupplierBusinessRequests`,
    ...defaultRouteOptions
}, { ...defaultAuthOptions });

protectedApi.route('POST /supplier/requests', {
    handler: `${folderPrefix}/businessRequests/actions.createSupplierBusinessRequest`,
    ...businessWorkflowRouteOptions
}, { ...defaultAuthOptions });

protectedApi.route('GET /supplier/request-references/variant', {
    handler: `${folderPrefix}/businessRequests/actions.getSupplierVariantRequestReferences`,
    ...defaultRouteOptions
}, { ...defaultAuthOptions });

protectedApi.route('GET /purchasing/variant-prices', {
    handler: `${folderPrefix}/supplierVariantPrices/actions.listSupplierVariantPrices`,
    ...defaultRouteOptions
}, { ...defaultAuthOptions });

protectedApi.route('GET /purchasing/products', {
    handler: `${folderPrefix}/supplierVariantPrices/actions.listSupplierProducts`,
    ...defaultRouteOptions
}, { ...defaultAuthOptions });

protectedApi.route('PUT /purchasing/variant-prices/{id}', {
    handler: `${folderPrefix}/supplierVariantPrices/actions.updateSupplierVariantPrice`,
    ...defaultRouteOptions
}, { ...defaultAuthOptions });

protectedApi.route('GET /sales/variant-prices', {
    handler: `${folderPrefix}/supplierVariantPrices/actions.listSupplierVariantPrices`,
    ...defaultRouteOptions
}, { ...defaultAuthOptions });

protectedApi.route('GET /sales/products', {
    handler: `${folderPrefix}/supplierVariantPrices/actions.listSupplierProducts`,
    ...defaultRouteOptions
}, { ...defaultAuthOptions });

protectedApi.route('GET /sales/customers', {
    handler: `${folderPrefix}/crm/actions.listManagedCustomers`,
    ...defaultRouteOptions
}, { ...defaultAuthOptions });

protectedApi.route('GET /sales/customers/map', {
    handler: `${folderPrefix}/crm/actions.listManagedCustomersMap`,
    ...defaultRouteOptions
}, { ...defaultAuthOptions });

protectedApi.route('GET /sales/customers/{id}', {
    handler: `${folderPrefix}/crm/actions.getManagedCustomer`,
    ...defaultRouteOptions
}, { ...defaultAuthOptions });

protectedApi.route('GET /sales/company-contacts', {
    handler: `${folderPrefix}/crm/actions.listManagedCompanyContacts`,
    ...defaultRouteOptions
}, { ...defaultAuthOptions });

protectedApi.route('PUT /sales/customers/{id}', {
    handler: `${folderPrefix}/crm/actions.updateManagedCustomer`,
    ...defaultRouteOptions
}, { ...defaultAuthOptions });

protectedApi.route('POST /sales/customers/{id}/addresses', {
    handler: `${folderPrefix}/crm/actions.createManagedCustomerAddress`,
    ...defaultRouteOptions
}, { ...defaultAuthOptions });

protectedApi.route('PATCH /sales/customers/{id}/addresses/{addressId}', {
    handler: `${folderPrefix}/crm/actions.updateManagedCustomerAddress`,
    ...defaultRouteOptions
}, { ...defaultAuthOptions });

protectedApi.route('DELETE /sales/customers/{id}/addresses/{addressId}', {
    handler: `${folderPrefix}/crm/actions.deleteManagedCustomerAddress`,
    ...defaultRouteOptions
}, { ...defaultAuthOptions });

protectedApi.route('POST /sales/customers/{id}/convert', {
    handler: `${folderPrefix}/crm/actions.convertManagedCustomer`,
    ...defaultRouteOptions
}, { ...defaultAuthOptions });

protectedApi.route('GET /portal/customer/orders', {
    handler: `${folderPrefix}/orders/actions.listPortalOrders`,
    ...defaultRouteOptions
}, { ...defaultAuthOptions });

protectedApi.route('GET /sales/orders', {
    handler: `${folderPrefix}/orders/actions.listSalesOrders`,
    ...defaultRouteOptions
}, { ...defaultAuthOptions });

protectedApi.route('GET /sales/customers/{id}/featured-products', {
    handler: `${folderPrefix}/crm/actions.listManagedCustomerFeaturedProducts`,
    ...defaultRouteOptions
}, { ...defaultAuthOptions });

protectedApi.route('PUT /sales/customers/{id}/featured-products', {
    handler: `${folderPrefix}/crm/actions.replaceManagedCustomerFeaturedProducts`,
    ...defaultRouteOptions
}, { ...defaultAuthOptions });

protectedApi.route('GET /sales/customers/{id}/assigned-products', {
    handler: `${folderPrefix}/crm/actions.listManagedCustomerAssignedProducts`,
    ...defaultRouteOptions
}, { ...defaultAuthOptions });

protectedApi.route('PUT /sales/customers/{id}/assigned-products', {
    handler: `${folderPrefix}/crm/actions.replaceManagedCustomerAssignedProducts`,
    ...defaultRouteOptions
}, { ...defaultAuthOptions });

protectedApi.route('GET /sales/customers/{id}/special-prices', {
    handler: `${folderPrefix}/crm/actions.listManagedCustomerSpecialPrices`,
    ...defaultRouteOptions
}, { ...defaultAuthOptions });

protectedApi.route('GET /sales/customers/{id}/special-prices/{specialPriceId}', {
    handler: `${folderPrefix}/crm/actions.getManagedCustomerSpecialPrice`,
    ...defaultRouteOptions
}, { ...defaultAuthOptions });

protectedApi.route('POST /sales/customers/{id}/special-prices', {
    handler: `${folderPrefix}/crm/actions.createManagedCustomerSpecialPrice`,
    ...defaultRouteOptions
}, { ...defaultAuthOptions });

protectedApi.route('PUT /sales/customers/{id}/special-prices/{specialPriceId}', {
    handler: `${folderPrefix}/crm/actions.updateManagedCustomerSpecialPrice`,
    ...defaultRouteOptions
}, { ...defaultAuthOptions });

protectedApi.route('DELETE /sales/customers/{id}/special-prices/{specialPriceId}', {
    handler: `${folderPrefix}/crm/actions.deactivateManagedCustomerSpecialPrice`,
    ...defaultRouteOptions
}, { ...defaultAuthOptions });

protectedApi.route('GET /sales/customers/{id}/visits', {
    handler: `${folderPrefix}/crm/actions.listManagedCustomerVisits`,
    ...defaultRouteOptions
}, { ...defaultAuthOptions });

protectedApi.route('POST /sales/customers/{id}/visits', {
    handler: `${folderPrefix}/crm/actions.createManagedCustomerVisit`,
    ...defaultRouteOptions
}, { ...defaultAuthOptions });

protectedApi.route('PUT /sales/customers/{id}/visits/{visitId}', {
    handler: `${folderPrefix}/crm/actions.updateManagedCustomerVisit`,
    ...defaultRouteOptions
}, { ...defaultAuthOptions });

protectedApi.route('DELETE /sales/customers/{id}/visits/{visitId}', {
    handler: `${folderPrefix}/crm/actions.deleteManagedCustomerVisit`,
    ...defaultRouteOptions
}, { ...defaultAuthOptions });

protectedApi.route('GET /sales/approval-requests', {
    handler: `${folderPrefix}/businessRequests/actions.listSalesBusinessRequests`,
    ...defaultRouteOptions,
}, { ...defaultAuthOptions });

protectedApi.route('POST /sales/approval-requests/{id}/decision', {
    handler: `${folderPrefix}/businessRequests/actions.decideBusinessRequest`,
    ...businessWorkflowRouteOptions,
}, { ...defaultAuthOptions });

protectedApi.route('GET /purchasing/suppliers', {
    handler: `${folderPrefix}/crm/actions.listManagedSuppliers`,
    ...defaultRouteOptions
}, { ...defaultAuthOptions });

protectedApi.route('GET /purchasing/suppliers/{id}', {
    handler: `${folderPrefix}/crm/actions.getManagedSupplier`,
    ...defaultRouteOptions
}, { ...defaultAuthOptions });

protectedApi.route('GET /portal/customer', {
    handler: `${folderPrefix}/crm/actions.getPortalCustomer`,
    ...defaultRouteOptions
}, { ...defaultAuthOptions });

protectedApi.route('GET /portal/customer/special-prices', {
    handler: `${folderPrefix}/crm/actions.listPortalCustomerSpecialPrices`,
    ...defaultRouteOptions
}, { ...defaultAuthOptions });

protectedApi.route('POST /portal/customer/addresses', {
    handler: `${folderPrefix}/crm/actions.createPortalCustomerAddress`,
    ...defaultRouteOptions
}, { ...defaultAuthOptions });

protectedApi.route('POST /portal/customer/users', {
    handler: `${folderPrefix}/crm/actions.createPortalCustomerUser`,
    ...portalCustomerInviteRouteOptions,
}, { ...defaultAuthOptions });

protectedApi.route('PATCH /portal/customer/addresses/{addressId}', {
    handler: `${folderPrefix}/crm/actions.updatePortalCustomerAddress`,
    ...defaultRouteOptions
}, { ...defaultAuthOptions });

protectedApi.route('DELETE /portal/customer/addresses/{addressId}', {
    handler: `${folderPrefix}/crm/actions.deletePortalCustomerAddress`,
    ...defaultRouteOptions
}, { ...defaultAuthOptions });

protectedApi.route('GET /portal/customer/featured-products', {
    handler: `${folderPrefix}/crm/actions.getPortalCustomerFeaturedProducts`,
    ...defaultRouteOptions
}, { ...defaultAuthOptions });

protectedApi.route('GET /portal/customer/assigned-products', {
    handler: `${folderPrefix}/crm/actions.getPortalCustomerAssignedProducts`,
    ...defaultRouteOptions
}, { ...defaultAuthOptions });

protectedApi.route('GET /portal/customer/requests', {
    handler: `${folderPrefix}/businessRequests/actions.listPortalBusinessRequests`,
    ...defaultRouteOptions,
}, { ...defaultAuthOptions });

protectedApi.route('POST /portal/customer/requests', {
    handler: `${folderPrefix}/businessRequests/actions.createPortalBusinessRequest`,
    ...businessWorkflowRouteOptions,
}, { ...defaultAuthOptions });

protectedApi.route('POST /portal/customer/requests/{id}/decision', {
    handler: `${folderPrefix}/businessRequests/actions.decideBusinessRequest`,
    ...businessWorkflowRouteOptions,
}, { ...defaultAuthOptions });

protectedApi.route('GET /purchasing/approval-requests', {
    handler: `${folderPrefix}/businessRequests/actions.listPurchasingBusinessRequests`,
    ...defaultRouteOptions,
}, { ...defaultAuthOptions });

protectedApi.route('POST /purchasing/approval-requests/{id}/decision', {
    handler: `${folderPrefix}/businessRequests/actions.decideBusinessRequest`,
    ...businessWorkflowRouteOptions,
}, { ...defaultAuthOptions });
