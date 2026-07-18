import type { Prisma, PrismaClient, Rifa } from "@prisma/client"
import { prisma } from "@/lib/prisma"

/**
 * RifaRepository
 *
 * Camada de acesso a dados (Repository Pattern). Encapsula TODAS as chamadas
 * do Prisma referentes à entidade Rifa. Nenhuma outra camada deve importar o
 * Prisma diretamente para operar rifas — isso mantém a persistência trocável
 * (poderíamos trocar Prisma por outro ORM sem afetar os Services).
 */
export class RifaRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  async criar(data: Prisma.RifaCreateInput): Promise<Rifa> {
    return this.db.rifa.create({ data })
  }

  async listar(): Promise<Rifa[]> {
    return this.db.rifa.findMany({
      orderBy: { criadoEm: "desc" },
    })
  }

  async buscarPorId(id: string): Promise<Rifa | null> {
    return this.db.rifa.findUnique({ where: { id } })
  }

  /** Rifa com a contagem de participantes agregada (usado nas listagens). */
  async listarComContagem() {
    return this.db.rifa.findMany({
      orderBy: { criadoEm: "desc" },
      include: {
        _count: { select: { participantes: true } },
      },
    })
  }

  /** Busca a rifa detalhada incluindo seus participantes. */
  async buscarComParticipantes(id: string) {
    return this.db.rifa.findUnique({
      where: { id },
      include: {
        participantes: { orderBy: { criadoEm: "asc" } },
      },
    })
  }

  async atualizar(id: string, data: Prisma.RifaUpdateInput): Promise<Rifa> {
    return this.db.rifa.update({ where: { id }, data })
  }

  async remover(id: string): Promise<Rifa> {
    return this.db.rifa.delete({ where: { id } })
  }

  /**
   * Encontra a rifa ativa mais recente. Utilizado pelo webhook do WhatsApp
   * quando a mensagem não indica explicitamente a qual rifa pertence.
   */
  async buscarRifaAtivaMaisRecente(): Promise<Rifa | null> {
    return this.db.rifa.findFirst({
      where: { status: "ATIVA" },
      orderBy: { criadoEm: "desc" },
    })
  }
}

export const rifaRepository = new RifaRepository()
