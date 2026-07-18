import type { Participante, Prisma, PrismaClient, StatusPagamento } from "@prisma/client"
import { prisma } from "@/lib/prisma"

/**
 * ParticipanteRepository
 *
 * Camada de acesso a dados para a entidade Participante. Toda interação do
 * Prisma com participantes passa por aqui.
 */
export class ParticipanteRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  async criar(data: Prisma.ParticipanteUncheckedCreateInput): Promise<Participante> {
    return this.db.participante.create({ data })
  }

  async listarPorRifa(rifaId: string): Promise<Participante[]> {
    return this.db.participante.findMany({
      where: { rifaId },
      orderBy: { criadoEm: "asc" },
    })
  }

  async buscarPorId(id: string): Promise<Participante | null> {
    return this.db.participante.findUnique({ where: { id } })
  }

  /**
   * Tenta localizar um participante já existente numa rifa a partir do
   * telefone (preferencial) ou, na ausência dele, pelo nome. Evita duplicar
   * cadastros quando a mesma pessoa envia várias mensagens no WhatsApp.
   */
  async buscarExistente(params: {
    rifaId: string
    telefone?: string | null
    nome: string
  }): Promise<Participante | null> {
    const { rifaId, telefone, nome } = params

    if (telefone) {
      const porTelefone = await this.db.participante.findFirst({
        where: { rifaId, telefone },
      })
      if (porTelefone) return porTelefone
    }

    return this.db.participante.findFirst({
      where: {
        rifaId,
        nome: { equals: nome, mode: "insensitive" },
      },
    })
  }

  async atualizar(id: string, data: Prisma.ParticipanteUpdateInput): Promise<Participante> {
    return this.db.participante.update({ where: { id }, data })
  }

  async atualizarStatusPagamento(id: string, status: StatusPagamento): Promise<Participante> {
    return this.db.participante.update({
      where: { id },
      data: { statusPagamento: status },
    })
  }

  async remover(id: string): Promise<Participante> {
    return this.db.participante.delete({ where: { id } })
  }
}

export const participanteRepository = new ParticipanteRepository()
