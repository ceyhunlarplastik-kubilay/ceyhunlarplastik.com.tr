import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteCategory } from "../api/deleteCategory";
import { toast } from "sonner";

export function useDeleteCategory() {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: ({ id }: { id: string }) =>
            deleteCategory({ id }),

        onSuccess() {
            toast.success("Kategori silindi");

            qc.invalidateQueries({
                queryKey: ["admin-categories"],
            });
        },

        onError() {
            toast.error("Kategori silinemedi");
        },
    });
}