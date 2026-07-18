"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { criarRifaAction } from "@/app/actions/rifa.actions"

export function NovaRifaDialog() {
  const [aberto, setAberto] = useState(false)
  const [pendente, startTransition] = useTransition()
  const router = useRouter()

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await criarRifaAction(formData)
      if (res.success) {
        toast.success("Rifa criada com sucesso.")
        setAberto(false)
        router.refresh()
      } else {
        toast.error(res.error ?? "Falha ao criar a rifa.")
      }
    })
  }

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      {/* O erro estava aqui. Esta é a forma correta no shadcn/ui */}
      <DialogTrigger>
        <div className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-white text-black hover:bg-slate-200 h-10 px-4 py-2 cursor-pointer transition-colors">
          <Plus className="size-4 mr-2" />
          Nova rifa
        </div>
      </DialogTrigger>
      
      <DialogContent>
        <form action={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Criar nova rifa</DialogTitle>
            <DialogDescription>
              Cadastre uma rifa. Ative-a depois para receber participantes pelo WhatsApp.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nome">Nome da rifa</Label>
              <Input id="nome" name="nome" placeholder="Ex.: Rifa do Notebook" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="premio">Prêmio</Label>
              <Input id="premio" name="premio" placeholder="Ex.: Notebook Dell i5" required />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pendente}>
              {pendente ? "Criando..." : "Criar rifa"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}