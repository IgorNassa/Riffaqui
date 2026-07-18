import type { Participante, StatusPagamento } from "@prisma/client"
import {
  ParticipanteRepository,
  participanteRepository,
} from "@/lib/repositories/participante.repository"
import { RifaRepository, rifaRepository } from "@/lib/repositories/rifa.repository"
import { BusinessRuleError, NotFoundError, ValidationError } from "@/lib/errors"
import { WhatsAppParserService, whatsAppParserService } from "@/lib/services/whatsapp-parser.service"

export interface CriarParticipanteDTO {
  rifaId: string
  nome: string
  telefone?: string | null
  statusPagamento?: StatusPagamento
}

export interface ProcessarMensagemDTO {
  /** Texto cru da mensagem recebida no webhook. */
  mensagem: string
  /** Rifa alvo. Se ausente, usa a rifa ATIVA mais recente. */
  rifaId?: string
  /** Telefone do remetente vindo dos metadados do webhook (fallback). */
  telefoneRemetente?: string | null
}

export interface ResultadoProcessamento {
  participante: Participante
  /** true se um novo participante foi criado; false se foi atualizado. */
  novo: boolean
  statusPagamento: StatusPagamento
  palavrasChaveDetectadas: string[]
}

/**
 * ParticipanteService
 *
 * Regras de negócio para participantes, incluindo o fluxo de ingestão
 * automática a partir de mensagens do WhatsApp. Orquestra os repositórios
 * e o WhatsAppParserService.
 */
export class ParticipanteService {
  constructor(
    private readonly participanteRepo: ParticipanteRepository = participanteRepository,
    private readonly rifaRepo: RifaRepository = rifaRepository,
    private readonly parser: WhatsAppParserService = whatsAppParserService,
  ) {}

  async criarManual(dto: CriarParticipanteDTO): Promise<Participante> {
    const nome = dto.nome?.trim()
    if (!nome) throw new ValidationError("Informe o nome do participante.")

    const rifa = await this.rifaRepo.buscarPorId(dto.rifaId)
    if (!rifa) throw new NotFoundError("Rifa")

    return this.participanteRepo.criar({
      rifaId: dto.rifaId,
      nome,
      telefone: dto.telefone ? dto.telefone.replace(/\D/g, "") : null,
      statusPagamento: dto.statusPagamento ?? "PENDENTE",
    })
  }

  async listarPorRifa(rifaId: string): Promise<Participante[]> {
    return this.participanteRepo.listarPorRifa(rifaId)
  }

  async atualizarStatusPagamento(id: string, status: StatusPagamento): Promise<Participante> {
    const existente = await this.participanteRepo.buscarPorId(id)
    if (!existente) throw new NotFoundError("Participante")
    return this.participanteRepo.atualizarStatusPagamento(id, status)
  }

  async remover(id: string): Promise<Participante> {
    const existente = await this.participanteRepo.buscarPorId(id)
    if (!existente) throw new NotFoundError("Participante")
    return this.participanteRepo.remover(id)
  }

  /**
   * Fluxo central da automação por WhatsApp.
   *
   * 1. Descobre a rifa alvo (explícita ou a ATIVA mais recente).
   * 2. Usa o parser para extrair nome, telefone e status de pagamento.
   * 3. Faz upsert: cria o participante ou atualiza o existente
   *    (evitando duplicidade por telefone/nome).
   */
  async processarMensagemWhatsApp(dto: ProcessarMensagemDTO): Promise<ResultadoProcessamento> {
    const rifa = dto.rifaId
      ? await this.rifaRepo.buscarPorId(dto.rifaId)
      : await this.rifaRepo.buscarRifaAtivaMaisRecente()

    if (!rifa) {
      throw new BusinessRuleError(
        "Nenhuma rifa ativa encontrada para associar o participante. Ative uma rifa ou informe o rifaId.",
      )
    }

    const analise = this.parser.analisar(dto.mensagem)

    // Telefone da mensagem tem prioridade; senão usa o do remetente (metadados).
    const telefone =
      analise.telefone ??
      (dto.telefoneRemetente ? dto.telefoneRemetente.replace(/\D/g, "") : null)

    const existente = await this.participanteRepo.buscarExistente({
      rifaId: rifa.id,
      telefone,
      nome: analise.nome,
    })

    if (existente) {
      // Não rebaixa um pagamento já confirmado por uma mensagem "pendente".
      const manterPago = existente.statusPagamento === "PAGO" && analise.statusPagamento === "PENDENTE"
      const novoStatus = manterPago ? existente.statusPagamento : analise.statusPagamento

      const atualizado = await this.participanteRepo.atualizar(existente.id, {
        statusPagamento: novoStatus,
        ...(telefone && !existente.telefone ? { telefone } : {}),
      })

      return {
        participante: atualizado,
        novo: false,
        statusPagamento: novoStatus,
        palavrasChaveDetectadas: analise.palavrasChaveDetectadas,
      }
    }

    const criado = await this.participanteRepo.criar({
      rifaId: rifa.id,
      nome: analise.nome,
      telefone,
      statusPagamento: analise.statusPagamento,
    })

    return {
      participante: criado,
      novo: true,
      statusPagamento: analise.statusPagamento,
      palavrasChaveDetectadas: analise.palavrasChaveDetectadas,
    }
  }
}

export const participanteService = new ParticipanteService()
