import config from "../config";
import { rds } from "./db";
import { userPool, userPoolClient } from "./cognito";

const folderPrefix = "packages/functions/src/AdminApi/functions";

export const adminApi = new sst.aws.ApiGatewayV2("CeyhunlarAdminApi", {
    domain:
        $app.stage === "prod"
            ? {
                name: `admin.api.${config.DOMAIN}`,
                dns: sst.aws.dns({
                    zone: config.HOSTED_ZONE_ID,
                }),
            }
            : $app.stage === "dev"
                ? {
                    name: `admin.dev.api.${config.DOMAIN}`,
                    dns: sst.aws.dns({
                        zone: config.HOSTED_ZONE_ID,
                    }),
                }
                : undefined,
});

/* ------------------------
 * JWT Authorizer (Cognito)
 * ------------------------ */
const jwtAuthorizer = adminApi.addAuthorizer({
    name: "AdminJwtAuthorizer",
    jwt: {
        issuer: $interpolate`https://cognito-idp.${aws.getRegionOutput().name}.amazonaws.com/${userPool.id}`,
        audiences: [userPoolClient.id],
        identitySource: "$request.header.Authorization",
    },
});

/* ------------------------
 * Default Lambda Route options
 * ------------------------ */
const defaultRouteOptions: Omit<sst.aws.FunctionArgs, "handler"> = {
    runtime: "nodejs20.x",
    link: [rds, userPool],
};

// 🔁 reusable auth config
const defaultAuthOptions: sst.aws.ApiGatewayV2RouteArgs = {
    auth: {
        jwt: {
            authorizer: jwtAuthorizer.id,
        },
    },
};

/*----------------------- USERS -----------------------*/
adminApi.route("GET /users", {
    handler: `${folderPrefix}/users/actions.listUsers`,
    ...defaultRouteOptions,
}, { ...defaultAuthOptions });

/*----------------------- CATEGORIES -----------------------*/
adminApi.route("POST /categories", {
    handler: `${folderPrefix}/categories/actions.createCategory`,
    ...defaultRouteOptions,
}, { ...defaultAuthOptions });

adminApi.route("GET /categories/{id}", {
    handler: `${folderPrefix}/categories/actions.getCategory`,
    ...defaultRouteOptions,
}, { ...defaultAuthOptions });

adminApi.route("GET /categories", {
    handler: `${folderPrefix}/categories/actions.listCategories`,
    ...defaultRouteOptions,
}, { ...defaultAuthOptions });

adminApi.route("DELETE /categories/{id}", {
    handler: `${folderPrefix}/categories/actions.deleteCategory`,
    ...defaultRouteOptions,
}, { ...defaultAuthOptions });

adminApi.route("PUT /categories/{id}", {
    handler: `${folderPrefix}/categories/actions.updateCategory`,
    ...defaultRouteOptions,
}, { ...defaultAuthOptions });

/*----------------------- COLORS -----------------------*/
adminApi.route("POST /colors", {
    handler: `${folderPrefix}/colors/actions.createColor`,
    ...defaultRouteOptions,
}, { ...defaultAuthOptions });

adminApi.route("GET /colors/{id}", {
    handler: `${folderPrefix}/colors/actions.getColor`,
    ...defaultRouteOptions,
}, { ...defaultAuthOptions });

adminApi.route("GET /colors", {
    handler: `${folderPrefix}/colors/actions.listColors`,
    ...defaultRouteOptions,
}, { ...defaultAuthOptions });

adminApi.route("DELETE /colors/{id}", {
    handler: `${folderPrefix}/colors/actions.deleteColor`,
    ...defaultRouteOptions,
}, { ...defaultAuthOptions });

adminApi.route("PUT /colors/{id}", {
    handler: `${folderPrefix}/colors/actions.updateColor`,
    ...defaultRouteOptions,
}, { ...defaultAuthOptions });

/*----------------------- SUPPLIERS -----------------------*/
adminApi.route("POST /suppliers", {
    handler: `${folderPrefix}/suppliers/actions.createSupplier`,
    ...defaultRouteOptions,
}, { ...defaultAuthOptions });

adminApi.route("GET /suppliers/{id}", {
    handler: `${folderPrefix}/suppliers/actions.getSupplier`,
    ...defaultRouteOptions,
}, { ...defaultAuthOptions });

adminApi.route("GET /suppliers", {
    handler: `${folderPrefix}/suppliers/actions.listSuppliers`,
    ...defaultRouteOptions,
}, { ...defaultAuthOptions });

adminApi.route("DELETE /suppliers/{id}", {
    handler: `${folderPrefix}/suppliers/actions.deleteSupplier`,
    ...defaultRouteOptions,
}, { ...defaultAuthOptions });

adminApi.route("PUT /suppliers/{id}", {
    handler: `${folderPrefix}/suppliers/actions.updateSupplier`,
    ...defaultRouteOptions,
}, { ...defaultAuthOptions });

/*----------------------- PRODUCT SUPPLIERS -----------------------*/
adminApi.route("POST /product-suppliers", {
    handler: `${folderPrefix}/productSuppliers/actions.createProductSupplier`,
    ...defaultRouteOptions,
}, { ...defaultAuthOptions });

adminApi.route("GET /product-suppliers/{id}", {
    handler: `${folderPrefix}/productSuppliers/actions.getProductSupplier`,
    ...defaultRouteOptions,
}, { ...defaultAuthOptions });

adminApi.route("GET /product-suppliers", {
    handler: `${folderPrefix}/productSuppliers/actions.listProductsSuppliers`,
    ...defaultRouteOptions,
}, { ...defaultAuthOptions });

adminApi.route("PUT /product-suppliers/{id}", {
    handler: `${folderPrefix}/productSuppliers/actions.updateProductSupplier`,
    ...defaultRouteOptions,
}, { ...defaultAuthOptions });

adminApi.route("DELETE /product-suppliers/{id}", {
    handler: `${folderPrefix}/productSuppliers/actions.deleteProductSupplier`,
    ...defaultRouteOptions,
}, { ...defaultAuthOptions });


/*----------------------- PRODUCTS -----------------------*/
adminApi.route("GET /products", {
    handler: `${folderPrefix}/products/actions.listProducts`,
    ...defaultRouteOptions,
}, { ...defaultAuthOptions });
