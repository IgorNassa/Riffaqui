import { Ticket } from "lucide-react"
import { Toaster } from "@/components/ui/sonner"
import { NovaRifaDialog } from "@/components/nova-rifa-dialog"
import { RifaCard } from "@/components/rifa-card"
import { rifaService } from "@/lib/services/rifa.service"
import { participanteService } from "@/lib/services/participante.service"

// Sempre renderizar com dados atualizados do banco.
export const dynamic = "force-dynamic"

export default async function Page() {
  const rifasResumo = await rifaService.listar()

  // Carrega os participantes de cada rifa para exibir o detalhe.
  const rifas = await Promise.all(
    rifasResumo.map(async (rifa) => ({
      ...rifa,
      participantes: await participanteService.listarPorRifa(rifa.id),
    })),
  )

  return (
    <main className="min-h-dvh bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Ticket className="size-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">RifaPro</h1>
              <p className="text-sm text-muted-foreground">
                Gestão de rifas com automação por WhatsApp
              </p>
            </div>
          </div>
          <NovaRifaDialog />
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8">
        {rifas.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border py-20 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <Ticket className="size-7" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Nenhuma rifa cadastrada</h2>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground text-pretty">
                Crie sua primeira rifa e depois ative-a para receber participantes automaticamente
                pelas mensagens do WhatsApp.
              </p>
            </div>
            <NovaRifaDialog />
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {rifas.map((rifa) => (
              <RifaCard key={rifa.id} rifa={rifa} />
            ))}
          </div>
        )}
      </div>

      <Toaster richColors position="top-center" />
    </main>
  )
}
