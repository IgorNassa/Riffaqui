"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import type { StatusRifa } from "@prisma/client"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { OPCOES_STATUS_RIFA, STATUS_RIFA } from "@/lib/status-display"
import { alterarStatusRifaAction } from "@/app/actions/rifa.actions"

export function RifaStatusSelect({
  rifaId,
  status,
}: {
  rifaId: string
  status: StatusRifa
}) {
  const [pendente, startTransition] = useTransition()
  const router = useRouter()

  function alterar(novo: StatusRifa) {
    if (novo === status) return
    startTransition(async () => {
      const res = await alterarStatusRifaAction(rifaId, novo)
      if (res.success) {
        toast.success("Status da rifa atualizado.")
        router.refresh()
      } else {
        toast.error(res.error ?? "Falha ao atualizar status.")
      }
    })
  }

  return (
    <Select value={status} onValueChange={(v) => alterar(v as StatusRifa)} disabled={pendente}>
      <SelectTrigger className="w-40" size="sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {OPCOES_STATUS_RIFA.map((s) => (
          <SelectItem key={s} value={s}>
            {STATUS_RIFA[s].label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
