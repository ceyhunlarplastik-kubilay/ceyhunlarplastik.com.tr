import { lambdaHandler } from "@/core/middy";
import { customerRepository } from "@/core/helpers/prisma/customers/repository";
import { productAttributeValueRepository } from "@/core/helpers/prisma/productAttributeValues/repository";
import { createCustomerHandler } from "@/functions/PublicApi/functions/customers/handlers";
import { createCustomerValidator, customerResponseValidator } from "@/functions/PublicApi/validators/customers";
export const createCustomer = lambdaHandler(async (event) => createCustomerHandler({
    customerRepository: customerRepository(),
    productAttributeValueRepository: productAttributeValueRepository(),
})(event), {
    auth: false,
    requestValidator: createCustomerValidator,
    responseValidator: customerResponseValidator,
});
