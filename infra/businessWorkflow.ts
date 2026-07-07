import config from "../config"
import { rds, vpc } from "./db"
import { userAccessRealtime } from "./userAccessLifecycle"

const workflowFolderPrefix = "packages/functions/src/BusinessWorkflow/functions"
type Jsonata = `{% ${string} %}`

type StepFunctionState = Record<string, unknown>

type EventBridgePutEventsStateInput = {
    detail: Record<string, unknown>
    detailType: string
    next?: string
    output?: Jsonata
    source: string
}

type LambdaInvokeStateInput = {
    functionArn: string
    integration?: "response" | "token"
    next: string
    output?: Jsonata
    payload: Record<string, unknown>
}

function expression(value: string) {
    return `{% ${value} %}` as Jsonata
}

function createEventBridgePutEventsState(
    busName: string,
    input: EventBridgePutEventsStateInput,
): StepFunctionState {
    return {
        Type: "Task",
        QueryLanguage: "JSONata",
        Resource: "arn:aws:states:::events:putEvents",
        Output: input.output,
        Arguments: {
            Entries: [
                {
                    EventBusName: busName,
                    Source: input.source,
                    DetailType: input.detailType,
                    Detail: input.detail,
                },
            ],
        },
        ...(input.next ? { Next: input.next } : { End: true }),
    }
}

function createLambdaInvokeState(input: LambdaInvokeStateInput): StepFunctionState {
    return {
        Type: "Task",
        QueryLanguage: "JSONata",
        Resource: input.integration === "token"
            ? "arn:aws:states:::lambda:invoke.waitForTaskToken"
            : "arn:aws:states:::lambda:invoke",
        Output: input.output,
        Arguments: {
            FunctionName: input.functionArn,
            Payload: input.payload,
        },
        Retry: [
            {
                ErrorEquals: [
                    "Lambda.ServiceException",
                    "Lambda.AWSLambdaException",
                    "Lambda.SdkClientException",
                    "Sandbox.Timedout",
                    "States.Timeout",
                ],
                IntervalSeconds: 2,
                MaxAttempts: 3,
                BackoffRate: 2,
            },
        ],
        Next: input.next,
    }
}

function createChoiceState(
    choices: Array<{ condition: Jsonata, next: string }>,
    defaultNext: string,
): StepFunctionState {
    return {
        Type: "Choice",
        QueryLanguage: "JSONata",
        Choices: choices.map(({ condition, next }) => ({
            Condition: condition,
            Next: next,
        })),
        Default: defaultNext,
    }
}

function createSucceedState(): StepFunctionState {
    return {
        Type: "Succeed",
        QueryLanguage: "JSONata",
    }
}

export const businessWorkflowBus = new sst.aws.Bus("BusinessWorkflowBus")

const registerTaskToken = new sst.aws.Function("BusinessWorkflowRegisterTaskToken", {
    handler: `${workflowFolderPrefix}/registerTaskToken.handler`,
    runtime: "nodejs22.x",
    timeout: "2 minutes",
    vpc,
    link: [rds],
})

const resolveNextPendingStep = new sst.aws.Function("BusinessWorkflowResolveNextPendingStep", {
    handler: `${workflowFolderPrefix}/resolveNextPendingStep.handler`,
    runtime: "nodejs22.x",
    timeout: "2 minutes",
    vpc,
    link: [rds],
})

const businessApprovalWorkflowRole = new aws.iam.Role("BusinessApprovalWorkflowRole", {
    assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
        Service: "states.amazonaws.com",
    }),
    inlinePolicies: [
        {
            name: "inline",
            policy: aws.iam.getPolicyDocumentOutput({
                statements: [
                    {
                        actions: ["events:PutEvents"],
                        resources: [businessWorkflowBus.arn],
                    },
                    {
                        actions: ["lambda:InvokeFunction"],
                        resources: [registerTaskToken.arn, resolveNextPendingStep.arn],
                    },
                ],
            }).json,
        },
    ],
})

function buildWorkflowDefinition(input: {
    busName: string
    registerTaskTokenArn: string
    resolveNextPendingStepArn: string
}) {
    const keepInput = expression("$states.input")
    const lambdaPayloadOutput = expression("$states.result.Payload")

    const baseRequestDetail = {
        requestId: expression("$states.input.requestId"),
        domain: expression("$states.input.domain"),
        type: expression("$states.input.type"),
        title: expression("$states.input.title"),
        customerId: expression("$states.input.customerId ? $states.input.customerId : null"),
        supplierId: expression("$states.input.supplierId ? $states.input.supplierId : null"),
        requestedByUserId: expression("$states.input.requestedByUserId"),
        requestedByEmail: expression("$states.input.requestedByEmail ? $states.input.requestedByEmail : null"),
        requesterRole: expression("$states.input.requesterRole"),
    }

    const pendingApprovalDetail = {
        ...baseRequestDetail,
        status: expression("$states.input.status"),
        stepId: expression("$states.input.currentStepId"),
        stepOrder: expression("$states.input.currentStepOrder"),
        requiredRole: expression("$states.input.currentRequiredRole"),
        assignedUserId: expression("$states.input.currentAssignedUserId ? $states.input.currentAssignedUserId : null"),
        occurredAt: expression("$now()"),
    }

    const decisionDetail = {
        ...baseRequestDetail,
        status: expression("$states.input.status"),
        stepId: expression("$states.input.decidedStepId ? $states.input.decidedStepId : null"),
        stepOrder: expression("$states.input.decidedStepOrder ? $states.input.decidedStepOrder : null"),
        requiredRole: expression("$states.input.decidedRequiredRole ? $states.input.decidedRequiredRole : null"),
        decidedByUserId: expression("$states.input.decidedByUserId"),
        decidedByEmail: expression("$states.input.decidedByEmail ? $states.input.decidedByEmail : null"),
        note: expression("$states.input.note ? $states.input.note : null"),
        occurredAt: expression("$now()"),
    }

    // Keep the ASL readable here because the current SST StepFunctions builder
    // recursively walks cyclic graphs and breaks on approval loops.
    return {
        QueryLanguage: "JSONata",
        StartAt: "PublishBusinessRequestCreated",
        States: {
            PublishBusinessRequestCreated: createEventBridgePutEventsState(input.busName, {
                detail: {
                    ...baseRequestDetail,
                    status: "PENDING_APPROVAL",
                    occurredAt: expression("$now()"),
                },
                detailType: "business-request.created",
                next: "ResolveBusinessWorkflowActiveStep",
                output: keepInput,
                source: "ceyhunlar.business-requests",
            }),
            ResolveBusinessWorkflowActiveStep: createLambdaInvokeState({
                functionArn: input.resolveNextPendingStepArn,
                next: "PublishBusinessRequestPendingApproval",
                output: lambdaPayloadOutput,
                payload: {
                    requestId: expression("$states.input.requestId"),
                },
            }),
            PublishBusinessRequestPendingApproval: createEventBridgePutEventsState(input.busName, {
                detail: pendingApprovalDetail,
                detailType: "business-request.pending-approval",
                next: "RegisterBusinessWorkflowTaskToken",
                output: keepInput,
                source: "ceyhunlar.business-requests",
            }),
            RegisterBusinessWorkflowTaskToken: createLambdaInvokeState({
                functionArn: input.registerTaskTokenArn,
                integration: "token",
                next: "BusinessRequestDecisionChoice",
                payload: {
                    requestId: expression("$states.input.requestId"),
                    taskToken: expression("$states.context.Task.Token"),
                },
            }),
            BusinessRequestDecisionChoice: createChoiceState(
                [
                    {
                        condition: expression("$states.input.approved = true"),
                        next: "PublishBusinessRequestStepApproved",
                    },
                ],
                "PublishBusinessRequestRejected",
            ),
            PublishBusinessRequestStepApproved: createEventBridgePutEventsState(input.busName, {
                detail: decisionDetail,
                detailType: "business-request.step-approved",
                next: "ResolveBusinessWorkflowLoopActiveStep",
                output: keepInput,
                source: "ceyhunlar.business-requests",
            }),
            ResolveBusinessWorkflowLoopActiveStep: createLambdaInvokeState({
                functionArn: input.resolveNextPendingStepArn,
                next: "BusinessRequestCompletionChoice",
                output: lambdaPayloadOutput,
                payload: {
                    requestId: expression("$states.input.requestId"),
                },
            }),
            BusinessRequestCompletionChoice: createChoiceState(
                [
                    {
                        condition: expression("$states.input.completed = true"),
                        next: "PublishBusinessRequestCompleted",
                    },
                ],
                "PublishBusinessRequestLoopPendingApproval",
            ),
            PublishBusinessRequestLoopPendingApproval: createEventBridgePutEventsState(input.busName, {
                detail: pendingApprovalDetail,
                detailType: "business-request.pending-approval",
                next: "RegisterBusinessWorkflowLoopTaskToken",
                output: keepInput,
                source: "ceyhunlar.business-requests",
            }),
            RegisterBusinessWorkflowLoopTaskToken: createLambdaInvokeState({
                functionArn: input.registerTaskTokenArn,
                integration: "token",
                next: "BusinessRequestDecisionChoice",
                payload: {
                    requestId: expression("$states.input.requestId"),
                    taskToken: expression("$states.context.Task.Token"),
                },
            }),
            PublishBusinessRequestRejected: createEventBridgePutEventsState(input.busName, {
                detail: {
                    ...decisionDetail,
                    status: "REJECTED",
                },
                detailType: "business-request.rejected",
                next: "BusinessRequestRejectedCompleted",
                source: "ceyhunlar.business-requests",
            }),
            PublishBusinessRequestCompleted: createEventBridgePutEventsState(input.busName, {
                detail: {
                    ...baseRequestDetail,
                    status: "APPROVED",
                    decidedByUserId: expression("$states.input.decidedByUserId ? $states.input.decidedByUserId : null"),
                    decidedByEmail: expression("$states.input.decidedByEmail ? $states.input.decidedByEmail : null"),
                    note: expression("$states.input.note ? $states.input.note : null"),
                    occurredAt: expression("$now()"),
                },
                detailType: "business-request.completed",
                next: "BusinessRequestApprovedCompleted",
                source: "ceyhunlar.business-requests",
            }),
            BusinessRequestApprovedCompleted: createSucceedState(),
            BusinessRequestRejectedCompleted: createSucceedState(),
        },
    }
}

export const businessApprovalWorkflow = new aws.sfn.StateMachine("BusinessApprovalWorkflow", {
    roleArn: businessApprovalWorkflowRole.arn,
    type: "STANDARD",
    definition: businessWorkflowBus.name.apply((busName) =>
        registerTaskToken.arn.apply((registerTaskTokenArn) =>
            resolveNextPendingStep.arn.apply((resolveNextPendingStepArn) =>
                JSON.stringify(buildWorkflowDefinition({
                    busName,
                    registerTaskTokenArn,
                    resolveNextPendingStepArn,
                }))
            )
        )
    ),
})

const businessWorkflowEventPattern = {
    source: ["ceyhunlar.business-requests"],
    detailType: [
        "business-request.created",
        "business-request.pending-approval",
        "business-request.step-approved",
        "business-request.rejected",
        "business-request.completed",
    ],
}

businessWorkflowBus.subscribe("PersistBusinessRequestActivityLog", {
    handler: `${workflowFolderPrefix}/persistBusinessRequestActivityLog.handler`,
    runtime: "nodejs22.x",
    vpc,
    link: [rds],
}, {
    pattern: businessWorkflowEventPattern,
})

businessWorkflowBus.subscribe("PersistBusinessRequestNotification", {
    handler: `${workflowFolderPrefix}/persistBusinessRequestNotification.handler`,
    runtime: "nodejs22.x",
    vpc,
    link: [rds],
}, {
    pattern: businessWorkflowEventPattern,
})

businessWorkflowBus.subscribe("PublishBusinessRequestRealtime", {
    handler: `${workflowFolderPrefix}/publishBusinessRequestRealtime.handler`,
    runtime: "nodejs22.x",
    link: [userAccessRealtime],
    environment: {
        BUSINESS_WORKFLOW_REALTIME_TOPIC_PREFIX: `${$app.name}/${$app.stage}/notifications/users`,
    },
    permissions: [
        {
            actions: ["iot:Publish"],
            resources: ["*"],
        },
    ],
}, {
    pattern: businessWorkflowEventPattern,
})

businessWorkflowBus.subscribe("SendBusinessRequestEmail", {
    handler: `${workflowFolderPrefix}/sendBusinessRequestEmail.handler`,
    runtime: "nodejs22.x",
    vpc,
    link: [rds],
    environment: {
        BUSINESS_WORKFLOW_FROM_EMAIL: config.DOMAIN ? `noreply@${config.DOMAIN}` : "noreply@example.com",
    },
    permissions: [
        {
            actions: ["ses:SendEmail", "ses:SendRawEmail"],
            resources: ["*"],
        },
    ],
}, {
    pattern: {
        source: ["ceyhunlar.business-requests"],
        detailType: [
            "business-request.pending-approval",
            "business-request.rejected",
            "business-request.completed",
        ],
    },
})
