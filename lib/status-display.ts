import type { StatusPagamento, StatusRifa } from "@prisma/client"

/** Rótulos e cores de badge para o status da rifa. */
export const STATUS_RIFA: Record<
  StatusRifa,
  { label: string; className: string }
> = {
  RASCUNHO: { label: "Rascunho", className: "bg-muted text-muted-foreground" },
  ATIVA: { label: "Ativa", className: "bg-primary text-primary-foreground" },
  ENCERRADA: { label: "Encerrada", className: "bg-secondary text-secondary-foreground" },
  SORTEADA: { label: "Sorteada", className: "bg-accent text-accent-foreground" },
  CANCELADA: { label: "Cancelada", className: "bg-destructive/15 text-destructive" },
}

/** Rótulos e cores de badge para o status de pagamento. */
export const STATUS_PAGAMENTO: Record<
  StatusPagamento,
  { label: string; className: string }
> = {
  PENDENTE: { label: "Pendente", className: "bg-muted text-muted-foreground" },
  PAGO: { label: "Pago", className: "bg-primary text-primary-foreground" },
  CANCELADO: { label: "Cancelado", className: "bg-destructive/15 text-destructive" },
}

export const OPCOES_STATUS_RIFA = Object.keys(STATUS_RIFA) as StatusRifa[]
export const OPCOES_STATUS_PAGAMENTO = Object.keys(STATUS_PAGAMENTO) as StatusPagamento[]

/** Formata um telefone só de dígitos em (DD) 9XXXX-XXXX quando possível. */
export function formatarTelefone(telefone: string | null): string {
  if (!telefone) return "—"
  const d = telefone.replace(/\D/g, "")
  const local = d.length > 11 ? d.slice(-11) : d
  if (local.length === 11) {
    return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`
  }
  if (local.length === 10) {
    return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`
  }
  return telefone
}
