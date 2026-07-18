import type { StatusRifa } from "@prisma/client"
import { RifaRepository, rifaRepository } from "@/lib/repositories/rifa.repository"
import { NotFoundError, ValidationError } from "@/lib/errors"

export interface CriarRifaDTO {
  nome: string
  premio: string
  status?: StatusRifa
  data?: Date
}

export interface AtualizarRifaDTO {
  nome?: string
  premio?: string
  status?: StatusRifa
  data?: Date
}

/**
 * RifaService
 *
 * Camada de regras de negócio (Service Pattern) para rifas. Valida as entradas
 * e orquestra o RifaRepository. Não conhece detalhes do Prisma nem de HTTP.
 */
export class RifaService {
  constructor(private readonly repo: RifaRepository = rifaRepository) {}

  async criar(dto: CriarRifaDTO) {
    const nome = dto.nome?.trim()
    const premio = dto.premio?.trim()

    if (!nome || nome.length < 3) {
      throw new ValidationError("O nome da rifa deve ter ao menos 3 caracteres.")
    }
    if (!premio) {
      throw new ValidationError("Informe o prêmio da rifa.")
    }

    return this.repo.criar({
      nome,
      premio,
      status: dto.status ?? "RASCUNHO",
      ...(dto.data ? { data: dto.data } : {}),
    })
  }

  async listar() {
    return this.repo.listarComContagem()
  }

  async detalhar(id: string) {
    const rifa = await this.repo.buscarComParticipantes(id)
    if (!rifa) throw new NotFoundError("Rifa")
    return rifa
  }

  async atualizar(id: string, dto: AtualizarRifaDTO) {
    const existente = await this.repo.buscarPorId(id)
    if (!existente) throw new NotFoundError("Rifa")

    if (dto.nome !== undefined && dto.nome.trim().length < 3) {
      throw new ValidationError("O nome da rifa deve ter ao menos 3 caracteres.")
    }

    return this.repo.atualizar(id, {
      ...(dto.nome !== undefined ? { nome: dto.nome.trim() } : {}),
      ...(dto.premio !== undefined ? { premio: dto.premio.trim() } : {}),
      ...(dto.status !== undefined ? { status: dto.status } : {}),
      ...(dto.data !== undefined ? { data: dto.data } : {}),
    })
  }

  async alterarStatus(id: string, status: StatusRifa) {
    const existente = await this.repo.buscarPorId(id)
    if (!existente) throw new NotFoundError("Rifa")
    return this.repo.atualizar(id, { status })
  }

  async remover(id: string) {
    const existente = await this.repo.buscarPorId(id)
    if (!existente) throw new NotFoundError("Rifa")
    return this.repo.remover(id)
  }
}

export const rifaService = new RifaService()
