import config from "../config";
import { vpc, rds } from "./db";
import { userPool } from "./cognito";
import { publicBucket } from "./storage";
import { apiCors } from "./cors";
import { apiRouteLambdaNamer } from "./lambdaNaming";
import { publicApiThrottle, publicProductReservedConcurrency } from "./apiLimits";
const folderPrefix = 'packages/functions/src/PublicApi/functions';

export const publicApi = new sst.aws.ApiGatewayV2("CeyhunlarPublicApi", {
    cors: apiCors,
    transform: {
        stage: (args) => {
            args.defaultRouteSettings = { ...publicApiThrottle };
        },
        route: {
            handler: apiRouteLambdaNamer("public"),
        },
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
    runtime: 'nodejs24.x',
    vpc: vpc,
    link: [rds, publicBucket],
    // P1.6 pilot — structured logging (Powertools). Yalnız PublicApi'de deneniyor;
    // uygun görülürse ProtectedApi/AdminApi/OwnerApi defaultOptions'larına kopyalanır.
    // retention "1 month" SST'nin zaten uyguladığı varsayılanla (30 gün) aynıdır —
    // davranış değişmez, niyet belgelenir + gelecekte kazara "forever"'a kaymayı önler.
    logging: { retention: "1 month" },
    environment: {
        BUCKET_NAME: publicBucket.name,
        POWERTOOLS_SERVICE_NAME: "ceyhunlar-public-api",
        POWERTOOLS_LOG_LEVEL: $app.stage === "prod" ? "INFO" : "DEBUG",
        ASSET_PUBLIC_BASE_URL:
            $app.stage === "prod"
                ? `https://cdn.${config.DOMAIN}`
                : $app.stage === "dev"
                    ? `https://dev.${config.DOMAIN}`
                    : $interpolate`https://${publicBucket.name}.s3.amazonaws.com`
    }
}

/**
 * DB'ye dokunan public ÜRÜN route'ları.
 *
 * Reserved concurrency yalnız buraya uygulanır: prod RDS t4g.micro ve asıl
 * darboğaz veritabanı. Rezervasyon hem TAVAN (bir anonim sel burada takılır)
 * hem GARANTİ (bu kadarı her zaman ayrılmış). Bütçe aritmetiği apiLimits.ts'te.
 *
 * Diğer 29 public route bilinçli olarak rezervasyonsuz: hafifler (geo lookup,
 * kategori listesi) ve dördü de rezerve edilseydi hesap kotası yetmezdi.
 */
const publicProductRouteOptions: Omit<sst.aws.FunctionArgs, "handler"> = {
    ...defaultOptions,
    memory: "1536 MB",
    // Non-prod'da UNDEFINED: kubi/dev eu-west-1'e gidiyor ve oradaki kota 10.
    // Rezervasyon istemek deploy'u düşürüyordu (bkz. apiLimits.ts).
    ...(publicProductReservedConcurrency
        ? { concurrency: { reserved: publicProductReservedConcurrency } }
        : {}),
};

const customerInvitationRouteOptions: Omit<sst.aws.FunctionArgs, "handler"> = {
    ...defaultOptions,
    link: [rds, publicBucket, userPool],
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

/*----------------------- GEO -----------------------*/
publicApi.route("GET /geo/countries", {
    handler: `${folderPrefix}/geo/actions.listCountries`,
    ...defaultOptions,
})

publicApi.route("GET /geo/countries/{countryId}/states", {
    handler: `${folderPrefix}/geo/actions.listStates`,
    ...defaultOptions,
})

publicApi.route("GET /geo/states/{stateId}/cities", {
    handler: `${folderPrefix}/geo/actions.listCities`,
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

/*----------------------- MATERIALS -----------------------*/
publicApi.route("GET /materials", {
    handler: `${folderPrefix}/materials/actions.listMaterials`,
    ...defaultOptions,
});

publicApi.route("GET /materials/{id}", {
    handler: `${folderPrefix}/materials/actions.getMaterial`,
    ...defaultOptions,
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

/*----------------------- PRODUCTS -----------------------*/
export const listProductsRoute = publicApi.route("GET /products", {
    handler: `${folderPrefix}/products/actions.listProducts`,
    ...publicProductRouteOptions,
});

// `GET /products/{id}` rezervasyonsuz: SSR bu ucu kullanmıyor (sayfalar slug
// üzerinden gidiyor), yani bütçeden pay ayırmaya değmez.
publicApi.route("GET /products/{id}", {
    handler: `${folderPrefix}/products/actions.getProduct`,
    ...defaultOptions,
});

export const getProductBySlugRoute = publicApi.route("GET /products/slug/{slug}", {
    handler: `${folderPrefix}/products/actions.getProductBySlug`,
    ...publicProductRouteOptions,
})

export const getProductVariantTableRoute = publicApi.route("GET /products/{id}/variant-table", {
    handler: `${folderPrefix}/products/actions.getProductVariantTable`,
    ...publicProductRouteOptions,
})

// Tek ölçünün varyantları (`?m=` ölçü anahtarı). Varyant detay sayfası eskiden
// tablo ucundan 500 satır çekip istemcide filtreliyordu (P1.8 F1.1).
export const getProductVariantsByMeasurementRoute = publicApi.route("GET /products/{id}/variant-measurements", {
    handler: `${folderPrefix}/products/actions.getProductVariantsByMeasurement`,
    ...publicProductRouteOptions,
})
/*----------------------- MATERIALS -----------------------*/
/*----------------------- ASSETS -----------------------*/

/*----------------------- PRODUCT ATTRIBUTE VALUES -----------------------*/
publicApi.route("GET /product-attributes/with-values", {
    handler: `${folderPrefix}/productAttributes/actions.listAttributesWithValues`,
    ...defaultOptions,
});

publicApi.route("POST /customers", {
    handler: `${folderPrefix}/customers/actions.createCustomer`,
    ...defaultOptions,
});

publicApi.route("GET /customer-invitations/{token}", {
    handler: `${folderPrefix}/customerInvitations/actions.getCustomerInvitation`,
    ...customerInvitationRouteOptions,
});

publicApi.route("POST /customer-invitations/accept", {
    handler: `${folderPrefix}/customerInvitations/actions.acceptCustomerInvitation`,
    ...customerInvitationRouteOptions,
});

publicApi.route("POST /web-requests", {
    handler: `${folderPrefix}/webRequests/actions.createWebRequest`,
    ...defaultOptions,
});

publicApi.route("GET /product-attribute-values", {
    handler: `${folderPrefix}/productAttributeValues/actions.listProductAttributeValues`,
    ...defaultOptions,
});
