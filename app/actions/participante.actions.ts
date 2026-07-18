"use server"

import { revalidatePath } from "next/cache"
import type { StatusPagamento } from "@prisma/client"
import { participanteService } from "@/lib/services/participante.service"
import { toErrorResponse } from "@/lib/errors"
import type { ActionResult } from "@/app/actions/rifa.actions"

/**
 * Server Actions de Participante.
 *
 * Fronteira entre a UI/RSC e o ParticipanteService. Inclui a ação que simula
 * o recebimento de uma mensagem de WhatsApp diretamente pela interface.
 */

export async function criarParticipanteAction(formData: FormData): Promise<ActionResult> {
  try {
    const participante = await participanteService.criarManual({
      rifaId: String(formData.get("rifaId") ?? ""),
      nome: String(formData.get("nome") ?? ""),
      telefone: (formData.get("telefone") as string) || null,
      statusPagamento: (formData.get("statusPagamento") as StatusPagamento) || undefined,
    })
    revalidatePath("/")
    return { success: true, data: participante }
  } catch (error) {
    const { message } = toErrorResponse(error)
    return { success: false, error: message }
  }
}

export async function atualizarStatusPagamentoAction(
  id: string,
  status: StatusPagamento,
): Promise<ActionResult> {
  try {
    const participante = await participanteService.atualizarStatusPagamento(id, status)
    revalidatePath("/")
    return { success: true, data: participante }
  } catch (error) {
    const { message } = toErrorResponse(error)
    return { success: false, error: message }
  }
}

export async function removerParticipanteAction(id: string): Promise<ActionResult> {
  try {
    await participanteService.remover(id)
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    const { message } = toErrorResponse(error)
    return { success: false, error: message }
  }
}

/**
 * Simula o recebimento de uma mensagem de WhatsApp a partir da UI, exercitando
 * o mesmo pipeline usado pelo webhook (parser + upsert de participante).
 */
export async function simularMensagemWhatsAppAction(
  mensagem: string,
  rifaId?: string,
): Promise<ActionResult> {
  try {
    const resultado = await participanteService.processarMensagemWhatsApp({ mensagem, rifaId })
    revalidatePath("/")
    return {
      success: true,
      data: {
        participante: resultado.participante,
        novo: resultado.novo,
        statusPagamento: resultado.statusPagamento,
        palavrasChaveDetectadas: resultado.palavrasChaveDetectadas,
      },
    }
  } catch (error) {
    const { message } = toErrorResponse(error)
    return { success: false, error: message }
  }
}
