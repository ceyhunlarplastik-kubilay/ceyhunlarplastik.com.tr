const smokeStart = sst.aws.StepFunctions.pass({
    name: "SmokeStart",
    output: {
        ok: true,
    },
});

const smokeDone = sst.aws.StepFunctions.succeed({
    name: "SmokeDone",
});

export const supplierApprovalBus = new sst.aws.Bus("SupplierApprovalBus");

export const supplierApprovalWorkflow = new sst.aws.StepFunctions("SupplierApprovalWorkflow", {
    definition: smokeStart.next(smokeDone),
});
