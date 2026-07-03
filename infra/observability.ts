import { frontend } from "./frontend";
import {
    getProductBySlugRoute,
    getProductVariantTableRoute,
    listProductsRoute,
} from "./PublicApi";

function parsePositiveIntegerEnv(name: string, fallback: number) {
    const value = process.env[name];
    if (!value) return fallback;

    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

const isProd = $app.stage === "prod";

if (isProd) {
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
        actionsEnabled: false,
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
            actionsEnabled: false,
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
            actionsEnabled: false,
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
            actionsEnabled: false,
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
            actionsEnabled: false,
            tags: {
                app: "ceyhunlarweb",
                stage: "prod",
                concern: "public-api-duration",
            },
        });
    }
}
