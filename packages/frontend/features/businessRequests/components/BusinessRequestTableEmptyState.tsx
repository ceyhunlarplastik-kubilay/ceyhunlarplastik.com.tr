import { TableCell, TableRow } from "@/components/ui/table"

type Props = {
    colSpan: number
    message: string
}

export function BusinessRequestTableEmptyState({ colSpan, message }: Props) {
    return (
        <TableRow>
            <TableCell colSpan={colSpan} className="py-12 text-center text-sm text-neutral-500">
                {message}
            </TableCell>
        </TableRow>
    )
}
