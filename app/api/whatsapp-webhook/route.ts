import { NextResponse } from "next/server"
import { participanteService } from "@/lib/services/participante.service"
import { toErrorResponse } from "@/lib/errors"

/**
 * Webhook do WhatsApp (POST /api/whatsapp-webhook)
 *
 * Simula o recebimento de eventos de provedores como Evolution API ou Baileys.
 * Ambos entregam a mensagem em formatos ligeiramente diferentes, então
 * normalizamos o payload antes de delegar ao ParticipanteService.
 *
 * Formatos suportados (exemplos):
 *
 *  Evolution API:
 *  {
 *    "event": "messages.upsert",
 *    "data": {
 *      "key": { "remoteJid": "5511999998888@s.whatsapp.net" },
 *      "message": { "conversation": "Maria Silva, pix pago" },
 *      "pushName": "Maria"
 *    }
 *  }
 *
 *  Baileys (cru):
 *  {
 *    "messages": [{
 *      "key": { "remoteJid": "5511999998888@s.whatsapp.net" },
 *      "message": { "extendedTextMessage": { "text": "João 11 98888-7777 ok" } }
 *    }]
 *  }
 *
 *  Genérico (para testes):
 *  { "message": "Ana Souza pagou via pix", "rifaId": "..." }
 */

interface MensagemNormalizada {
  texto: string
  telefoneRemetente: string | null
  rifaId?: string
}

/** Extrai o texto de mensagem dos diferentes formatos de provedor. */
function extrairTexto(msg: Record<string, unknown> | undefined): string | null {
  if (!msg) return null
  if (typeof msg.conversation === "string") return msg.conversation

  const extended = msg.extendedTextMessage as { text?: string } | undefined
  if (extended?.text) return extended.text

  const imageCaption = (msg.imageMessage as { caption?: string } | undefined)?.caption
  if (imageCaption) return imageCaption

  return null
}

/** Converte um JID (5511999998888@s.whatsapp.net) em dígitos. */
function jidParaTelefone(jid: unknown): string | null {
  if (typeof jid !== "string") return null
  const digitos = jid.split("@")[0]?.replace(/\D/g, "") ?? ""
  return digitos.length >= 10 ? digitos : null
}

/** Normaliza os payloads de Evolution API, Baileys e o formato genérico. */
function normalizarPayload(body: any): MensagemNormalizada | null {
  // Formato genérico simplificado.
  if (typeof body?.message === "string") {
    return {
      texto: body.message,
      telefoneRemetente: body.telefone ? String(body.telefone) : null,
      rifaId: body.rifaId,
    }
  }

  // Evolution API: { event, data: { key, message, pushName } }
  if (body?.data?.message) {
    const texto = extrairTexto(body.data.message)
    if (!texto) return null
    return {
      texto,
      telefoneRemetente: jidParaTelefone(body.data.key?.remoteJid),
      rifaId: body.rifaId ?? body.data.rifaId,
    }
  }

  // Baileys cru: { messages: [{ key, message }] }
  const primeira = Array.isArray(body?.messages) ? body.messages[0] : undefined
  if (primeira?.message) {
    const texto = extrairTexto(primeira.message)
    if (!texto) return null
    return {
      texto,
      telefoneRemetente: jidParaTelefone(primeira.key?.remoteJid),
      rifaId: body.rifaId,
    }
  }

  return null
}

export async function POST(request: Request) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: "Corpo da requisição não é um JSON válido." },
      { status: 400 },
    )
  }

  const normalizada = normalizarPayload(body)

  if (!normalizada || !normalizada.texto?.trim()) {
    // Retornamos 200 para eventos que não são mensagens de texto (status,
    // recibos, etc.), evitando que o provedor fique reenviando o webhook.
    return NextResponse.json({
      success: true,
      ignored: true,
      message: "Evento sem mensagem de texto processável.",
    })
  }

  try {
    const resultado = await participanteService.processarMensagemWhatsApp({
      mensagem: normalizada.texto,
      rifaId: normalizada.rifaId,
      telefoneRemetente: normalizada.telefoneRemetente,
    })

    return NextResponse.json({
      success: true,
      criado: resultado.novo,
      participante: {
        id: resultado.participante.id,
        nome: resultado.participante.nome,
        telefone: resultado.participante.telefone,
        statusPagamento: resultado.participante.statusPagamento,
        rifaId: resultado.participante.rifaId,
      },
      palavrasChaveDetectadas: resultado.palavrasChaveDetectadas,
    })
  } catch (error) {
    const { message, statusCode } = toErrorResponse(error)
    return NextResponse.json({ success: false, error: message }, { status: statusCode })
  }
}

/** GET de verificação — útil para provedores que validam o endpoint. */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "RifaPro WhatsApp Webhook",
    aceita: ["Evolution API", "Baileys", "payload genérico { message, rifaId }"],
  })
}
