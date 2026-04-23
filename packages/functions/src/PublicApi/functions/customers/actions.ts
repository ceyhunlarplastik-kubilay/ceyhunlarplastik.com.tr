import { lambdaHandler } from "@/core/middy"
import { customerRepository } from "@/core/helpers/prisma/customers/repository"
import { productAttributeValueRepository } from "@/core/helpers/prisma/productAttributeValues/repository"
import { createCustomerHandler } from "@/functions/PublicApi/functions/customers/handlers"
import { createCustomerValidator, customerResponseValidator } from "@/functions/PublicApi/validators/customers"
import { ICreateCustomerEvent } from "@/functions/PublicApi/types/customers"

export const createCustomer = lambdaHandler(
    async (event) =>
        createCustomerHandler({
            customerRepository: customerRepository(),
            productAttributeValueRepository: productAttributeValueRepository(),
        })(event as ICreateCustomerEvent),
    {
        auth: false,
        requestValidator: createCustomerValidator,
        responseValidator: customerResponseValidator,
    }
)
