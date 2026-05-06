import { vpc, rds } from "./db";

const workflowFolderPrefix = "packages/functions/src/SupplierApprovalWorkflow/functions";

export const supplierApprovalBus = new sst.aws.Bus("SupplierApprovalBus");

const registerTaskToken = new sst.aws.Function("SupplierApprovalRegisterTaskToken", {
    handler: `${workflowFolderPrefix}/registerTaskToken.handler`,
    runtime: "nodejs22.x",
    vpc,
    link: [rds],
});

const publishRequestedEvent = sst.aws.StepFunctions.eventBridgePutEvents({
    name: "PublishSupplierApprovalRequested",
    output: "{% $states.input %}",
    events: [
        {
            bus: supplierApprovalBus,
            source: "ceyhunlar.supplier-approval",
            detailType: "supplier-approval.requested",
            detail: {
                requestId: "{% $states.input.requestId %}",
                type: "{% $states.input.type %}",
                supplierId: "{% $states.input.supplierId %}",
                productVariantSupplierId: "{% $states.input.productVariantSupplierId ? $states.input.productVariantSupplierId : null %}",
                requestedByUserId: "{% $states.input.requestedByUserId %}",
                requestedByEmail: "{% $states.input.requestedByEmail %}",
            },
        },
    ],
});

const waitForDecision = sst.aws.StepFunctions.lambdaInvoke({
    name: "RegisterDecisionTaskToken",
    function: registerTaskToken,
    integration: "token",
    payload: {
        requestId: "{% $states.input.requestId %}",
        taskToken: "{% $states.context.Task.Token %}",
    },
});

const publishApprovedEvent = sst.aws.StepFunctions.eventBridgePutEvents({
    name: "PublishSupplierApprovalApproved",
    events: [
        {
            bus: supplierApprovalBus,
            source: "ceyhunlar.supplier-approval",
            detailType: "supplier-approval.approved",
            detail: {
                requestId: "{% $states.input.requestId %}",
                type: "{% $states.input.type %}",
                supplierId: "{% $states.input.supplierId %}",
                reviewedByUserId: "{% $states.input.reviewedByUserId %}",
            },
        },
    ],
});

const publishRejectedEvent = sst.aws.StepFunctions.eventBridgePutEvents({
    name: "PublishSupplierApprovalRejected",
    events: [
        {
            bus: supplierApprovalBus,
            source: "ceyhunlar.supplier-approval",
            detailType: "supplier-approval.rejected",
            detail: {
                requestId: "{% $states.input.requestId %}",
                type: "{% $states.input.type %}",
                supplierId: "{% $states.input.supplierId %}",
                reviewedByUserId: "{% $states.input.reviewedByUserId %}",
            },
        },
    ],
});

const approvedCompleted = sst.aws.StepFunctions.succeed({
    name: "SupplierApprovalApprovedCompleted",
});

const rejectedCompleted = sst.aws.StepFunctions.succeed({
    name: "SupplierApprovalRejectedCompleted",
});

const approvalDecision = sst.aws.StepFunctions
    .choice({ name: "SupplierApprovalDecision" })
    .when(
        "{% $states.input.approved = true %}",
        publishApprovedEvent.next(approvedCompleted)
    )
    .otherwise(publishRejectedEvent.next(rejectedCompleted))

export const supplierApprovalWorkflow = new sst.aws.StepFunctions("SupplierApprovalWorkflow", {
    definition: publishRequestedEvent.next(waitForDecision).next(approvalDecision),
});
