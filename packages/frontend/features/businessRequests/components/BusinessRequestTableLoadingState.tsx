import { Spinner } from "@/components/ui/spinner"
import { TableCell, TableRow } from "@/components/ui/table"

type Props = {
    colSpan: number
}

export function BusinessRequestTableLoadingState({ colSpan }: Props) {
    return (
        <TableRow>
            <TableCell colSpan={colSpan} className="py-12">
                <div className="flex items-center justify-center">
                    <Spinner className="size-5" />
                </div>
            </TableCell>
        </TableRow>
    )
}
