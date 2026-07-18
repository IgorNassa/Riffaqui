"use server"

import { revalidatePath } from "next/cache"
import type { StatusRifa } from "@prisma/client"
import { rifaService } from "@/lib/services/rifa.service"
import { toErrorResponse } from "@/lib/errors"

export interface ActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Server Actions de Rifa.
 *
 * Camada de fronteira (entrada HTTP/RSC). Converte FormData em DTOs, delega ao
 * RifaService e traduz erros de domínio em respostas serializáveis. Nunca
 * contém regra de negócio.
 */

export async function criarRifaAction(formData: FormData): Promise<ActionResult> {
  try {
    const rifa = await rifaService.criar({
      nome: String(formData.get("nome") ?? ""),
      premio: String(formData.get("premio") ?? ""),
      status: (formData.get("status") as StatusRifa) || undefined,
    })
    revalidatePath("/")
    return { success: true, data: rifa }
  } catch (error) {
    const { message } = toErrorResponse(error)
    return { success: false, error: message }
  }
}

export async function alterarStatusRifaAction(
  id: string,
  status: StatusRifa,
): Promise<ActionResult> {
  try {
    const rifa = await rifaService.alterarStatus(id, status)
    revalidatePath("/")
    return { success: true, data: rifa }
  } catch (error) {
    const { message } = toErrorResponse(error)
    return { success: false, error: message }
  }
}

export async function removerRifaAction(id: string): Promise<ActionResult> {
  try {
    await rifaService.remover(id)
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    const { message } = toErrorResponse(error)
    return { success: false, error: message }
  }
}
