import type { StatusPagamento, StatusRifa } from "@prisma/client"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { STATUS_PAGAMENTO, STATUS_RIFA } from "@/lib/status-display"

export function RifaStatusBadge({ status }: { status: StatusRifa }) {
  const info = STATUS_RIFA[status]
  return <Badge className={cn("border-transparent font-medium", info.className)}>{info.label}</Badge>
}

export function PagamentoStatusBadge({ status }: { status: StatusPagamento }) {
  const info = STATUS_PAGAMENTO[status]
  return <Badge className={cn("border-transparent font-medium", info.className)}>{info.label}</Badge>
}
