/**
 * Erros de domínio da aplicação.
 *
 * Usar erros tipados permite que as camadas superiores (Server Actions,
 * rotas de API) tratem cada situação de forma adequada sem depender de
 * comparações de strings.
 */

export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 400,
  ) {
    super(message)
    this.name = new.target.name
  }
}

/** Recurso não encontrado (404). */
export class NotFoundError extends AppError {
  constructor(recurso: string) {
    super(`${recurso} não encontrado(a).`, "NOT_FOUND", 404)
  }
}

/** Falha de validação de dados de entrada (422). */
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, "VALIDATION_ERROR", 422)
  }
}

/** Regra de negócio violada (409). */
export class BusinessRuleError extends AppError {
  constructor(message: string) {
    super(message, "BUSINESS_RULE_ERROR", 409)
  }
}

/**
 * Normaliza qualquer erro capturado em um formato serializável e seguro
 * para ser retornado ao cliente.
 */
export function toErrorResponse(error: unknown): {
  message: string
  code: string
  statusCode: number
} {
  if (error instanceof AppError) {
    return { message: error.message, code: error.code, statusCode: error.statusCode }
  }

  console.error("[v0] Erro inesperado:", error)
  return {
    message: "Ocorreu um erro inesperado. Tente novamente.",
    code: "INTERNAL_ERROR",
    statusCode: 500,
  }
}
