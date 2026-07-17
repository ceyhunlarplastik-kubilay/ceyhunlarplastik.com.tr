import { frontend } from "./frontend";
import {
    getProductBySlugRoute,
    getProductVariantTableRoute,
    listProductsRoute,
} from "./PublicApi";
import { adminListProductsRoute } from "./AdminApi";

function parsePositiveIntegerEnv(name: string, fallback: number) {
    const value = process.env[name];
    if (!value) return fallback;

    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

const isProd = $app.stage === "prod";

// Alarm bildirimleri bu adrese gider. SNS email aboneliği deploy sonrası
// e-postadaki onay linkine tıklanana kadar Pending kalır ve bildirim GÖNDERMEZ.
const ALARM_EMAIL = "kubilayuysal.ceyhunlarplastik@gmail.com";

if (isProd) {
    const alarmTopic = new aws.sns.Topic("ProdAlarmTopic", {
        name: "ceyhunlarweb-prod-alarms",
        tags: {
            app: "ceyhunlarweb",
            stage: "prod",
            concern: "alarms",
        },
    });

    new aws.sns.TopicSubscription("ProdAlarmEmailSubscription", {
        topic: alarmTopic.arn,
        protocol: "email",
        endpoint: ALARM_EMAIL,
    });

    // Hem alarma geçişte hem düzelmede (OK) bildirim gönderilir; böylece
    // "sorun geçti mi?" sorusu için konsola bakmak gerekmez.
    const alarmActionArns = [alarmTopic.arn];

    const accountConcurrencyThreshold = parsePositiveIntegerEnv(
        "LAMBDA_ACCOUNT_CONCURRENCY_ALARM_THRESHOLD",
        8,
    );

    new aws.cloudwatch.MetricAlarm("ProdLambdaAccountConcurrentExecutionsHigh", {
        name: "ceyhunlarweb-prod-lambda-account-concurrency-high",
        alarmDescription:
            "ceyhunlarweb prod Lambda account concurrency is close to the current regional limit. Raise the eu-central-1 Lambda concurrency quota if this alarm fires.",
        namespace: "AWS/Lambda",
        metricName: "ConcurrentExecutions",
        statistic: "Maximum",
        period: 60,
        evaluationPeriods: 1,
        datapointsToAlarm: 1,
        threshold: accountConcurrencyThreshold,
        comparisonOperator: "GreaterThanOrEqualToThreshold",
        treatMissingData: "notBreaching",
        actionsEnabled: true,
        alarmActions: alarmActionArns,
        okActions: alarmActionArns,
        tags: {
            app: "ceyhunlarweb",
            stage: "prod",
            concern: "lambda-concurrency",
        },
    });

    const frontendServer = frontend.nodes.server;

    if (frontendServer) {
        new aws.cloudwatch.MetricAlarm("ProdFrontendServerLambdaThrottles", {
            name: "ceyhunlarweb-prod-frontend-server-lambda-throttles",
            alarmDescription:
                "The public Next.js server Lambda is being throttled. This usually means regional Lambda concurrency is exhausted.",
            namespace: "AWS/Lambda",
            metricName: "Throttles",
            dimensions: {
                FunctionName: frontendServer.name,
            },
            statistic: "Sum",
            period: 60,
            evaluationPeriods: 1,
            datapointsToAlarm: 1,
            threshold: 0,
            comparisonOperator: "GreaterThanThreshold",
            treatMissingData: "notBreaching",
            actionsEnabled: true,
            alarmActions: alarmActionArns,
            okActions: alarmActionArns,
            tags: {
                app: "ceyhunlarweb",
                stage: "prod",
                concern: "frontend-throttles",
            },
        });

        new aws.cloudwatch.MetricAlarm("ProdFrontendServerP95DurationHigh", {
            name: "ceyhunlarweb-prod-frontend-server-p95-duration-high",
            alarmDescription:
                "The public Next.js server Lambda p95 duration is high. Long requests increase concurrent execution pressure.",
            namespace: "AWS/Lambda",
            metricName: "Duration",
            dimensions: {
                FunctionName: frontendServer.name,
            },
            extendedStatistic: "p95",
            period: 300,
            evaluationPeriods: 2,
            datapointsToAlarm: 2,
            threshold: 10000,
            comparisonOperator: "GreaterThanThreshold",
            treatMissingData: "notBreaching",
            actionsEnabled: true,
            alarmActions: alarmActionArns,
            okActions: alarmActionArns,
            tags: {
                app: "ceyhunlarweb",
                stage: "prod",
                concern: "frontend-duration",
            },
        });
    }

    const publicProductRoutes = [
        {
            id: "ProductList",
            name: "product-list",
            functionName: listProductsRoute.nodes.function.apply((fn) => fn.name),
        },
        {
            id: "ProductBySlug",
            name: "product-by-slug",
            functionName: getProductBySlugRoute.nodes.function.apply((fn) => fn.name),
        },
        {
            id: "ProductVariantTable",
            name: "product-variant-table",
            functionName: getProductVariantTableRoute.nodes.function.apply((fn) => fn.name),
        },
    ];

    for (const route of publicProductRoutes) {
        new aws.cloudwatch.MetricAlarm(`ProdPublicApi${route.id}LambdaThrottles`, {
            name: `ceyhunlarweb-prod-public-api-${route.name}-lambda-throttles`,
            alarmDescription:
                "A public product API Lambda is being throttled. Check account concurrency and public page fan-out.",
            namespace: "AWS/Lambda",
            metricName: "Throttles",
            dimensions: {
                FunctionName: route.functionName,
            },
            statistic: "Sum",
            period: 60,
            evaluationPeriods: 1,
            datapointsToAlarm: 1,
            threshold: 0,
            comparisonOperator: "GreaterThanThreshold",
            treatMissingData: "notBreaching",
            actionsEnabled: true,
            alarmActions: alarmActionArns,
            okActions: alarmActionArns,
            tags: {
                app: "ceyhunlarweb",
                stage: "prod",
                concern: "public-api-throttles",
            },
        });

        new aws.cloudwatch.MetricAlarm(`ProdPublicApi${route.id}P95DurationHigh`, {
            name: `ceyhunlarweb-prod-public-api-${route.name}-p95-duration-high`,
            alarmDescription:
                "A public product API Lambda p95 duration is high. Optimize product payloads and repository queries if this alarm fires.",
            namespace: "AWS/Lambda",
            metricName: "Duration",
            dimensions: {
                FunctionName: route.functionName,
            },
            extendedStatistic: "p95",
            period: 300,
            evaluationPeriods: 2,
            datapointsToAlarm: 2,
            threshold: 5000,
            comparisonOperator: "GreaterThanThreshold",
            treatMissingData: "notBreaching",
            actionsEnabled: true,
            alarmActions: alarmActionArns,
            okActions: alarmActionArns,
            tags: {
                app: "ceyhunlarweb",
                stage: "prod",
                concern: "public-api-duration",
            },
        });
    }

    // P1.8(c): RequestEntityTooLarge / 6MB response payload alarmı.
    // Lambda senkron yanıtı 6MB limitini aşınca runtime CloudWatch log'una
    // "Response payload size exceeded maximum allowed payload size" satırını yazar.
    // Yalnız BUFFERED API Gateway Lambda'ları hedeflenir; frontend server
    // aws-lambda-streaming kullandığı için bu limite tabi değildir (kapsam dışı).
    const RESPONSE_TOO_LARGE_NAMESPACE = "Ceyhunlarweb/Prod";

    const responsePayloadRoutes = [
        { id: "PublicProductList", name: "public-product-list", route: listProductsRoute },
        { id: "PublicProductBySlug", name: "public-product-by-slug", route: getProductBySlugRoute },
        { id: "PublicProductVariantTable", name: "public-product-variant-table", route: getProductVariantTableRoute },
        { id: "AdminProductList", name: "admin-product-list", route: adminListProductsRoute },
    ];

    for (const { id, name, route } of responsePayloadRoutes) {
        // Yönetilen log group'a doğrudan referans → filtre, log group oluşmadan
        // yaratılmaz (create-ordering race'i engellenir). Fallback: default ad.
        const logGroupName = route.nodes.function.apply((fn) =>
            fn.nodes.logGroup.apply((lg) => lg?.name ?? $interpolate`/aws/lambda/${fn.name}`),
        );
        const metricName = `ResponsePayloadTooLarge-${name}`;

        const responseTooLargeFilter = new aws.cloudwatch.LogMetricFilter(
            `Prod${id}ResponseTooLargeFilter`,
            {
                name: `ceyhunlarweb-prod-${name}-response-too-large`,
                logGroupName,
                pattern: '"Response payload size exceeded maximum allowed payload size"',
                metricTransformation: {
                    name: metricName,
                    namespace: RESPONSE_TOO_LARGE_NAMESPACE,
                    value: "1",
                    defaultValue: "0",
                    unit: "Count",
                },
            },
        );

        new aws.cloudwatch.MetricAlarm(
            `Prod${id}ResponseTooLargeAlarm`,
            {
                name: `ceyhunlarweb-prod-${name}-response-too-large`,
                alarmDescription:
                    `The ${name} API Lambda returned a response larger than the Lambda 6MB payload limit (RequestEntityTooLarge). Slim the response DTO or add pagination if this alarm fires.`,
                namespace: RESPONSE_TOO_LARGE_NAMESPACE,
                metricName,
                statistic: "Sum",
                period: 300,
                evaluationPeriods: 1,
                datapointsToAlarm: 1,
                threshold: 0,
                comparisonOperator: "GreaterThanThreshold",
                treatMissingData: "notBreaching",
                actionsEnabled: true,
                alarmActions: alarmActionArns,
                okActions: alarmActionArns,
                tags: {
                    app: "ceyhunlarweb",
                    stage: "prod",
                    concern: "response-payload-too-large",
                },
            },
            { dependsOn: responseTooLargeFilter },
        );
    }
}
