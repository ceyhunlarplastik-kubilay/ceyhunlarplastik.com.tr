"use client";

// Public'den alındı şuan
import type { Category } from "@/features/public/categories/types";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";

type Props = {
    data: Category[];
};

export function CategoriesTable({ data }: Props) {
    if (!data || data.length === 0) {
        return (
            <div className="rounded-xl border p-6 text-center text-muted-foreground">
                Kategori bulunamadı.
            </div>
        );
    }

    return (
        <div className="rounded-2xl border bg-white shadow-sm">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Kod</TableHead>
                        <TableHead>Ad</TableHead>
                        <TableHead>Oluşturulma</TableHead>
                        <TableHead>Güncellenme</TableHead>
                        <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {data.map((category) => (
                        <TableRow key={category.id}>
                            <TableCell>{category.code}</TableCell>
                            <TableCell className="font-medium">
                                {category.name}
                            </TableCell>
                            <TableCell>
                                {new Date(category.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                                {new Date(category.updatedAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                                <Button size="sm" variant="outline">
                                    <Pencil className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="destructive">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}