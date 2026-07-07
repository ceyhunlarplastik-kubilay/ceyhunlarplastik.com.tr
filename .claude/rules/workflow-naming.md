---
paths:
  - "infra/businessWorkflow.ts"
  - "packages/functions/src/BusinessWorkflow/**"
  - "packages/functions/src/SupplierApprovalWorkflow/**"
  - "packages/core/src/core/helpers/businessRequests/**"
---

# Workflow isimlendirmesi: aktif motor BusinessWorkflow, SupplierApprovalWorkflow legacy

**Doküman ne diyor:** AGENTS.md infra listesinde `infra/approvalWorkflow.ts` geçiyor ve entrypoint gruplaması için "workflow-specific folders like `SupplierApprovalWorkflow`" örneğini veriyor.

**Kodda gerçek durum:**
- `infra/approvalWorkflow.ts` yok. Aktif workflow wiring, `sst.config.ts` tarafından import edilen `infra/businessWorkflow.ts` içinde (`BusinessApprovalWorkflow` state machine + `BusinessWorkflowBus` + subscriber Lambda'ları).
- `packages/functions/src/SupplierApprovalWorkflow` klasörü hâlâ duruyor, ancak aktif state machine ve bus wiring `infra/businessWorkflow.ts` + `packages/functions/src/BusinessWorkflow` üzerinden generic `BusinessRequest` motoruna bağlı.

**Dikkat:**
- Onay akışına yeni davranış eklerken hedef her zaman generic `BusinessRequest` motoru: `infra/businessWorkflow.ts`, `packages/functions/src/BusinessWorkflow/**` ve `packages/core/src/core/helpers/businessRequests/**`.
- `SupplierApprovalWorkflow` klasörüne yeni özellik ekleme; oraya dokunuyorsan legacy kod üzerinde çalıştığını bil ve mümkünse generic motora taşımayı değerlendir.
- AGENTS.md'deki `approvalWorkflow.ts` referansını dosya araması için kullanma; dosya adı `businessWorkflow.ts`.
