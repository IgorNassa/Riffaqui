"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import type { Participante, StatusPagamento } from "@prisma/client"
import { Check, Clock, Trash2, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PagamentoStatusBadge } from "@/components/status-badge"
import { formatarTelefone } from "@/lib/status-display"
import {
  atualizarStatusPagamentoAction,
  removerParticipanteAction,
} from "@/app/actions/participante.actions"

export function ParticipantesTable({ participantes }: { participantes: Participante[] }) {
  const [pendente, startTransition] = useTransition()
  const router = useRouter()

  function mudarStatus(id: string, status: StatusPagamento) {
    startTransition(async () => {
      const res = await atualizarStatusPagamentoAction(id, status)
      if (res.success) {
        toast.success("Status de pagamento atualizado.")
        router.refresh()
      } else {
        toast.error(res.error ?? "Falha ao atualizar.")
      }
    })
  }

  function remover(id: string) {
    startTransition(async () => {
      const res = await removerParticipanteAction(id)
      if (res.success) {
        toast.success("Participante removido.")
        router.refresh()
      } else {
        toast.error(res.error ?? "Falha ao remover.")
      }
    })
  }

  if (participantes.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        Nenhum participante ainda. Use o simulador de WhatsApp ao lado para adicionar automaticamente.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Telefone</TableHead>
            <TableHead>Pagamento</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {participantes.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="font-medium">{p.nome}</TableCell>
              <TableCell className="font-mono text-sm text-muted-foreground">
                {formatarTelefone(p.telefone)}
              </TableCell>
              <TableCell>
                <PagamentoStatusBadge status={p.statusPagamento} />
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    title="Marcar como pago"
                    disabled={pendente || p.statusPagamento === "PAGO"}
                    onClick={() => mudarStatus(p.id, "PAGO")}
                  >
                    <Check className="size-4" />
                    <span className="sr-only">Marcar como pago</span>
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    title="Marcar como pendente"
                    disabled={pendente || p.statusPagamento === "PENDENTE"}
                    onClick={() => mudarStatus(p.id, "PENDENTE")}
                  >
                    <Clock className="size-4" />
                    <span className="sr-only">Marcar como pendente</span>
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    title="Cancelar"
                    disabled={pendente || p.statusPagamento === "CANCELADO"}
                    onClick={() => mudarStatus(p.id, "CANCELADO")}
                  >
                    <X className="size-4" />
                    <span className="sr-only">Cancelar</span>
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    title="Remover participante"
                    className="text-destructive hover:text-destructive"
                    disabled={pendente}
                    onClick={() => remover(p.id)}
                  >
                    <Trash2 className="size-4" />
                    <span className="sr-only">Remover</span>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
