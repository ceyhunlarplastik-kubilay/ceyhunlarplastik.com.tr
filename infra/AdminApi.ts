import config from "../config";
import { vpc, rds } from "./db";
import { userPool, userPoolClient } from "./cognito";

const folderPrefix = "packages/functions/src/AdminApi/functions";

export const adminApi = new sst.aws.ApiGatewayV2("CeyhunlarAdminApi", {
    transform: {
        stage: (args) => {
            args.defaultRouteSettings = {
                throttlingRateLimit: 100,
                throttlingBurstLimit: 200,
            };
        }
    },
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
 * WAF (Web Application Firewall) 100 $ / month
 * ------------------------ */
/* const webAcl = new aws.wafv2.WebAcl("AdminRunningWebAcl", {
    defaultAction: { allow: {} },
    scope: "REGIONAL",
    visibilityConfig: {
        cloudwatchMetricsEnabled: true,
        metricName: "AdminApiWebAcl",
        sampledRequestsEnabled: true,
    },
    rules: [
        {
            name: "RateLimitRule",
            priority: 1,
            action: { block: {} },
            statement: {
                rateBasedStatement: {
                    limit: 1000,
                    aggregateKeyType: "IP",
                },
            },
            visibilityConfig: {
                cloudwatchMetricsEnabled: true,
                metricName: "RateLimitRule",
                sampledRequestsEnabled: true,
            },
        },
    ],
});

new aws.wafv2.WebAclAssociation("AdminApiWebAclAssociation", {
    resourceArn: $interpolate`arn:aws:apigateway:${aws.getRegionOutput().name}::/apis/${adminApi.nodes.api.id}/stages/$default`,
    webAclArn: webAcl.arn,
}); */

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
    runtime: "nodejs22.x",
    vpc: vpc,
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
/* adminApi.route("POST /product-suppliers", {
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
}, { ...defaultAuthOptions }); */

/*----------------------- MEASUREMENT TYPES -----------------------*/

adminApi.route("POST /measurement-types", {
    handler: `${folderPrefix}/measurementTypes/actions.createMeasurementType`,
    ...defaultRouteOptions,
}, { ...defaultAuthOptions });

adminApi.route("GET /measurement-types/{id}", {
    handler: `${folderPrefix}/measurementTypes/actions.getMeasurementType`,
    ...defaultRouteOptions,
}, { ...defaultAuthOptions });

adminApi.route("GET /measurement-types", {
    handler: `${folderPrefix}/measurementTypes/actions.listMeasurementTypes`,
    ...defaultRouteOptions,
}, { ...defaultAuthOptions });

adminApi.route("PUT /measurement-types/{id}", {
    handler: `${folderPrefix}/measurementTypes/actions.updateMeasurementType`,
    ...defaultRouteOptions,
}, { ...defaultAuthOptions });

// NOTE: Foreign key constraint nedeniyle silme işlemi yapılamıyor.
/* adminApi.route("DELETE /measurement-types/{id}", {
    handler: `${folderPrefix}/measurementTypes/actions.deleteMeasurementType`,
    ...defaultRouteOptions,
}, { ...defaultAuthOptions }); */

/*----------------------- PRODUCT VARIANT SUPPLIERS -----------------------*/
adminApi.route("GET /product-variant-suppliers", {
    handler: `${folderPrefix}/productVariantSuppliers/actions.listProductVariantSuppliers`,
    ...defaultRouteOptions,
}, { ...defaultAuthOptions });

adminApi.route("GET /product-variant-suppliers/{id}", {
    handler: `${folderPrefix}/productVariantSuppliers/actions.getProductVariantSupplier`,
    ...defaultRouteOptions,
}, { ...defaultAuthOptions });

adminApi.route("POST /product-variant-suppliers", {
    handler: `${folderPrefix}/productVariantSuppliers/actions.createProductVariantSupplier`,
    ...defaultRouteOptions,
}, { ...defaultAuthOptions });

adminApi.route("PUT /product-variant-suppliers/{id}", {
    handler: `${folderPrefix}/productVariantSuppliers/actions.updateProductVariantSupplier`,
    ...defaultRouteOptions,
}, { ...defaultAuthOptions });

adminApi.route("DELETE /product-variant-suppliers/{id}", {
    handler: `${folderPrefix}/productVariantSuppliers/actions.deleteProductVariantSupplier`,
    ...defaultRouteOptions,
}, { ...defaultAuthOptions });

/*----------------------- PRODUCT VARIANTS -----------------------*/
adminApi.route("GET /product-variants", {
    handler: `${folderPrefix}/productVariants/actions.listProductVariants`,
    ...defaultRouteOptions,
}, { ...defaultAuthOptions });

adminApi.route("GET /product-variants/{id}", {
    handler: `${folderPrefix}/productVariants/actions.getProductVariant`,
    ...defaultRouteOptions,
}, { ...defaultAuthOptions });

adminApi.route("POST /product-variants", {
    handler: `${folderPrefix}/productVariants/actions.createProductVariant`,
    ...defaultRouteOptions,
}, { ...defaultAuthOptions });

adminApi.route("PUT /product-variants/{id}", {
    handler: `${folderPrefix}/productVariants/actions.updateProductVariant`,
    ...defaultRouteOptions,
}, { ...defaultAuthOptions });

adminApi.route("DELETE /product-variants/{id}", {
    handler: `${folderPrefix}/productVariants/actions.deleteProductVariant`,
    ...defaultRouteOptions,
}, { ...defaultAuthOptions });

/*----------------------- PRODUCT MEASUREMENTS -----------------------*/
adminApi.route("GET /product-measurements", {
    handler: `${folderPrefix}/productMeasurements/actions.listProductMeasurements`,
    ...defaultRouteOptions,
}, { ...defaultAuthOptions });

adminApi.route("GET /product-measurements/{id}", {
    handler: `${folderPrefix}/productMeasurements/actions.getProductMeasurement`,
    ...defaultRouteOptions,
}, { ...defaultAuthOptions });

adminApi.route("POST /product-measurements", {
    handler: `${folderPrefix}/productMeasurements/actions.createProductMeasurement`,
    ...defaultRouteOptions,
}, { ...defaultAuthOptions });

adminApi.route("PUT /product-measurements/{id}", {
    handler: `${folderPrefix}/productMeasurements/actions.updateProductMeasurement`,
    ...defaultRouteOptions,
}, { ...defaultAuthOptions });

adminApi.route("DELETE /product-measurements/{id}", {
    handler: `${folderPrefix}/productMeasurements/actions.deleteProductMeasurement`,
    ...defaultRouteOptions,
}, { ...defaultAuthOptions });

/*----------------------- PRODUCTS -----------------------*/
adminApi.route("GET /products", {
    handler: `${folderPrefix}/products/actions.listProducts`,
    ...defaultRouteOptions,
}, { ...defaultAuthOptions });

adminApi.route("POST /products", {
    handler: `${folderPrefix}/products/actions.createProduct`,
    ...defaultRouteOptions,
}, { ...defaultAuthOptions });

adminApi.route("GET /products/{id}", {
    handler: `${folderPrefix}/products/actions.getProduct`,
    ...defaultRouteOptions,
}, { ...defaultAuthOptions });

adminApi.route("PUT /products/{id}", {
    handler: `${folderPrefix}/products/actions.updateProduct`,
    ...defaultRouteOptions,
}, { ...defaultAuthOptions });

adminApi.route("DELETE /products/{id}", {
    handler: `${folderPrefix}/products/actions.deleteProduct`,
    ...defaultRouteOptions,
}, { ...defaultAuthOptions });

/*----------------------- MATERIALS -----------------------*/
adminApi.route("GET /materials", {
    handler: `${folderPrefix}/materials/actions.listMaterials`,
    ...defaultRouteOptions,
}, { ...defaultAuthOptions });

adminApi.route("POST /materials", {
    handler: `${folderPrefix}/materials/actions.createMaterial`,
    ...defaultRouteOptions,
}, { ...defaultAuthOptions });

adminApi.route("GET /materials/{id}", {
    handler: `${folderPrefix}/materials/actions.getMaterial`,
    ...defaultRouteOptions,
}, { ...defaultAuthOptions });

adminApi.route("PUT /materials/{id}", {
    handler: `${folderPrefix}/materials/actions.updateMaterial`,
    ...defaultRouteOptions,
}, { ...defaultAuthOptions });

adminApi.route("DELETE /materials/{id}", {
    handler: `${folderPrefix}/materials/actions.deleteMaterial`,
    ...defaultRouteOptions,
}, { ...defaultAuthOptions });

/*----------------------- ASSETS -----------------------*/
adminApi.route("GET /assets", {
    handler: `${folderPrefix}/assets/actions.listAssets`,
    ...defaultRouteOptions,
}, { ...defaultAuthOptions });

adminApi.route("POST /assets", {
    handler: `${folderPrefix}/assets/actions.createAsset`,
    ...defaultRouteOptions,
}, { ...defaultAuthOptions });

adminApi.route("GET /assets/{id}", {
    handler: `${folderPrefix}/assets/actions.getAsset`,
    ...defaultRouteOptions,
}, { ...defaultAuthOptions });

adminApi.route("PUT /assets/{id}", {
    handler: `${folderPrefix}/assets/actions.updateAsset`,
    ...defaultRouteOptions,
}, { ...defaultAuthOptions });

adminApi.route("DELETE /assets/{id}", {
    handler: `${folderPrefix}/assets/actions.deleteAsset`,
    ...defaultRouteOptions,
}, { ...defaultAuthOptions });
