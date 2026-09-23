import type { PreSignUpTriggerEvent } from "aws-lambda"
import { cognitoFederationRepository } from "@/core/helpers/cognito/federation/repository"
import { handleFederatedPreSignUp } from "@/core/helpers/cognito/federation/handlePreSignUp"

export const handler = async (event: PreSignUpTriggerEvent): Promise<PreSignUpTriggerEvent> => {
    // Yalnız federe (Google) İLK giriş. `SignUp` (e-posta kaydı) ve `AdminCreateUser` (davet
    // akışı + bu trigger'ın kendi açtığı yerel profil) dokunulmadan geçmeli — aksi hâlde
    // trigger kendi `AdminCreateUser` çağrısıyla yeniden tetiklenirdi.
    if (event.triggerSource !== "PreSignUp_ExternalProvider") {
        return event
    }

    await handleFederatedPreSignUp({
        event,
        repository: cognitoFederationRepository(),
    })

    return event
}
