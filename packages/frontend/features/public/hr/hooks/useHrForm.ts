import { useMutation } from "@tanstack/react-query";
import { HrFormValues } from "@/features/public/hr/schema";
import { submitHrForm } from "../api/submitHrForm";

export function useHrForm() {
    return useMutation({
        mutationFn: (data: HrFormValues) => submitHrForm(data),
    });
}