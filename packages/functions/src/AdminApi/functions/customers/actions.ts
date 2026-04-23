import { lambdaHandler } from "@/core/middy"
import { customerRepository } from "@/core/helpers/prisma/customers/repository"
import { listCustomersHandler } from "@/functions/AdminApi/functions/customers/handlers"
import { IListCustomersEvent } from "@/functions/AdminApi/types/customers"
import { listCustomersResponseValidator } from "@/functions/AdminApi/validators/customers"

export const listCustomers = lambdaHandler(
    async (event) =>
        listCustomersHandler({
            customerRepository: customerRepository(),
        })(event as IListCustomersEvent),
    {
        auth: { requiredPermissionGroups: ["admin", "owner"] },
        // responseValidator: listCustomersResponseValidator,
    }
)
