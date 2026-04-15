import config from "../config";
import { vpc, rds } from "./db";
import { publicBucket } from "./storage";
const folderPrefix = 'packages/functions/src/PublicApi/functions';

export const publicApi = new sst.aws.ApiGatewayV2("CeyhunlarPublicApi", {
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
        // resources: ["arn:aws:dynamodb:eu-west-1:657914290529:table/portfolio-kubilay-kubilay-PortfolioTable-wzcszuuz"]
      }
    ] */
    runtime: 'nodejs22.x',
    vpc: vpc,
    link: [rds],
    environment: {
        ASSET_PUBLIC_BASE_URL:
            $app.stage === "prod"
                ? `https://cdn.${config.DOMAIN}`
                : $app.stage === "dev"
                    ? `https://dev.${config.DOMAIN}`
                    : $interpolate`https://${publicBucket.name}.s3.amazonaws.com`
    }
}

/*----------------------- USERS -----------------------*/
publicApi.route('GET /users/{id}', {
    handler: `${folderPrefix}/users/actions.getUser`,
    ...defaultOptions,
})
publicApi.route('GET /users', {
    handler: `${folderPrefix}/users/actions.listUsers`,
    ...defaultOptions,
})

/*----------------------- CATEGORIES -----------------------*/
publicApi.route("GET /categories/{id}", {
    handler: `${folderPrefix}/categories/actions.getCategory`,
    ...defaultOptions,
});

publicApi.route("GET /categories", {
    handler: `${folderPrefix}/categories/actions.listCategories`,
    ...defaultOptions,
});

publicApi.route("GET /categories/slug/{slug}", {
    handler: `${folderPrefix}/categories/actions.getCategoryBySlug`,
    ...defaultOptions,
});

/*----------------------- COLORS -----------------------*/
publicApi.route("GET /colors/{id}", {
    handler: `${folderPrefix}/colors/actions.getColor`,
    ...defaultOptions,
});

publicApi.route("GET /colors", {
    handler: `${folderPrefix}/colors/actions.listColors`,
    ...defaultOptions,
});

/*----------------------- SUPPLIERS -----------------------*/
publicApi.route("GET /suppliers/{id}", {
    handler: `${folderPrefix}/suppliers/actions.getSupplier`,
    ...defaultOptions,
});

publicApi.route("GET /suppliers", {
    handler: `${folderPrefix}/suppliers/actions.listSuppliers`,
    ...defaultOptions,
});

/*----------------------- MEASUREMENT TYPES -----------------------*/
publicApi.route("GET /measurement-types/{id}", {
    handler: `${folderPrefix}/measurementTypes/actions.getMeasurementType`,
    ...defaultOptions,
});

publicApi.route("GET /measurement-types", {
    handler: `${folderPrefix}/measurementTypes/actions.listMeasurementTypes`,
    ...defaultOptions,
});

/*----------------------- PRODUCT VARIANT SUPPLIERS -----------------------*/
publicApi.route("GET /product-variant-suppliers", {
    handler: `${folderPrefix}/productVariantSuppliers/actions.listProductVariantSuppliers`,
    ...defaultOptions
});

publicApi.route("GET /product-variant-suppliers/{id}", {
    handler: `${folderPrefix}/productVariantSuppliers/actions.getProductVariantSupplier`,
    ...defaultOptions
});

/*----------------------- PRODUCT VARIANTS -----------------------*/
publicApi.route("GET /product-variants", {
    handler: `${folderPrefix}/productVariants/actions.listProductVariants`,
    ...defaultOptions
});

publicApi.route("GET /product-variants/{id}", {
    handler: `${folderPrefix}/productVariants/actions.getProductVariant`,
    ...defaultOptions
});

/*----------------------- PRODUCT MEASUREMENTS -----------------------*/
publicApi.route("GET /product-measurements", {
    handler: `${folderPrefix}/productMeasurements/actions.listProductMeasurements`,
    ...defaultOptions,
});

publicApi.route("GET /product-measurements/{id}", {
    handler: `${folderPrefix}/productMeasurements/actions.getProductMeasurement`,
    ...defaultOptions,
});
/*----------------------- PRODUCTS -----------------------*/
publicApi.route("GET /products", {
    handler: `${folderPrefix}/products/actions.listProducts`,
    ...defaultOptions,
});

publicApi.route("GET /products/{id}", {
    handler: `${folderPrefix}/products/actions.getProduct`,
    ...defaultOptions,
});

publicApi.route("GET /products/slug/{slug}", {
    handler: `${folderPrefix}/products/actions.getProductBySlug`,
    ...defaultOptions,
})

publicApi.route("GET /products/{id}/variant-table", {
    handler: `${folderPrefix}/products/actions.getProductVariantTable`,
    ...defaultOptions,
})
/*----------------------- MATERIALS -----------------------*/
/*----------------------- ASSETS -----------------------*/

/*----------------------- PRODUCT ATTRIBUTE VALUES -----------------------*/
publicApi.route("GET /product-attributes/with-values", {
    handler: `${folderPrefix}/productAttributes/actions.listAttributesWithValues`,
    ...defaultOptions,
});

publicApi.route("GET /product-attribute-values", {
    handler: `${folderPrefix}/productAttributeValues/actions.listProductAttributeValues`,
    ...defaultOptions,
});
