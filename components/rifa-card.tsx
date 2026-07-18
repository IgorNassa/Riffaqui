import type { Participante, Rifa, StatusRifa } from "@prisma/client"
import { Gift, Users, CircleDollarSign } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { RifaStatusSelect } from "@/components/rifa-status-select"
import { WhatsAppSimulator } from "@/components/whatsapp-simulator"
import { ParticipantesTable } from "@/components/participantes-table"

type RifaDetalhada = Rifa & { participantes: Participante[] }

export function RifaCard({ rifa }: { rifa: RifaDetalhada }) {
  const total = rifa.participantes.length
  const pagos = rifa.participantes.filter((p) => p.statusPagamento === "PAGO").length

  return (
    <Card className="overflow-hidden">
      <CardHeader className="gap-3 border-b border-border">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <Gift className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold leading-tight text-balance">{rifa.nome}</h2>
              <p className="text-sm text-muted-foreground">Prêmio: {rifa.premio}</p>
            </div>
          </div>
          <RifaStatusSelect rifaId={rifa.id} status={rifa.status as StatusRifa} />
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="size-4" />
            {total} participante{total === 1 ? "" : "s"}
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <CircleDollarSign className="size-4 text-primary" />
            {pagos} pago{pagos === 1 ? "" : "s"}
          </span>
        </div>
      </CardHeader>
      <CardContent className="grid gap-6 pt-6 lg:grid-cols-[1fr_360px]">
        <div className="order-2 lg:order-1">
          <ParticipantesTable participantes={rifa.participantes} />
        </div>
        <div className="order-1 lg:order-2">
          <WhatsAppSimulator rifaId={rifa.id} />
        </div>
      </CardContent>
    </Card>
  )
}
