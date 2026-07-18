"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { MessageCircle, Send } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { simularMensagemWhatsAppAction } from "@/app/actions/participante.actions"

const EXEMPLOS = [
  "[12/05/2025 08:32] Maria Silva: quero participar, já fiz o pix pago",
  "Joao Souza (11) 98888-7777 ok comprovante enviado",
  "Oi boa tarde, aqui é a Ana Paula, vou pagar depois",
]

export function WhatsAppSimulator({ rifaId }: { rifaId: string }) {
  const [mensagem, setMensagem] = useState("")
  const [pendente, startTransition] = useTransition()
  const router = useRouter()

  function enviar() {
    if (!mensagem.trim()) {
      toast.error("Digite uma mensagem para simular.")
      return
    }
    startTransition(async () => {
      const res = await simularMensagemWhatsAppAction(mensagem, rifaId)
      if (res.success) {
        const data = res.data as {
          novo: boolean
          participante: { nome: string }
          statusPagamento: string
        }
        toast.success(
          `${data.novo ? "Participante adicionado" : "Participante atualizado"}: ${data.participante.nome} (${data.statusPagamento})`,
        )
        setMensagem("")
        router.refresh()
      } else {
        toast.error(res.error ?? "Não foi possível processar a mensagem.")
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageCircle className="size-4 text-primary" />
          Simulador de WhatsApp
        </CardTitle>
        <CardDescription>
          Cole uma mensagem como chegaria da Evolution API/Baileys. O parser extrai nome, telefone e
          detecta o pagamento automaticamente.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Textarea
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          placeholder="Ex.: Maria Silva (11) 99999-8888 pix pago"
          rows={3}
        />
        <div className="flex flex-wrap gap-2">
          {EXEMPLOS.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setMensagem(ex)}
              className="rounded-md border border-border bg-muted/50 px-2 py-1 text-left text-xs text-muted-foreground transition-colors hover:bg-muted"
            >
              {ex.length > 40 ? `${ex.slice(0, 40)}...` : ex}
            </button>
          ))}
        </div>
        <Button onClick={enviar} disabled={pendente} className="self-end">
          <Send className="size-4" />
          {pendente ? "Processando..." : "Processar mensagem"}
        </Button>
      </CardContent>
    </Card>
  )
}
