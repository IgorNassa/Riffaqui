import type { StatusPagamento } from "@prisma/client"

/**
 * Resultado estruturado da análise de uma mensagem de WhatsApp.
 */
export interface MensagemAnalisada {
  /** Nome do participante extraído da mensagem (limpo). */
  nome: string
  /** Telefone identificado, normalizado apenas com dígitos (com DDI/DDD). */
  telefone: string | null
  /** Status de pagamento inferido a partir das palavras-chave. */
  statusPagamento: StatusPagamento
  /** Texto original após limpeza (sem horários/emojis) — útil para auditoria. */
  textoLimpo: string
  /** Palavras-chave financeiras que foram detectadas. */
  palavrasChaveDetectadas: string[]
}

/**
 * WhatsAppParserService
 *
 * Serviço responsável por transformar o texto cru de uma mensagem recebida
 * via webhook (Evolution API, Baileys, etc.) em dados estruturados.
 *
 * Estratégia:
 *  1. Remover ruídos (emojis, timestamps, prefixos de citação).
 *  2. Extrair telefone com regex tolerante a formatações brasileiras.
 *  3. Detectar palavras-chave financeiras para inferir o pagamento.
 *  4. Isolar o nome do participante do restante da mensagem.
 */
export class WhatsAppParserService {
  /** Palavras-chave que indicam pagamento confirmado. */
  private static readonly PALAVRAS_PAGO = [
    "pago",
    "paguei",
    "pagamento",
    "pix",
    "pixei",
    "transferi",
    "transferido",
    "transferência",
    "comprovante",
    "ok",
    "confirmado",
    "quitado",
    "efetuado",
  ]

  /** Palavras-chave que indicam cancelamento/desistência. */
  private static readonly PALAVRAS_CANCELADO = [
    "cancelar",
    "cancelado",
    "desistir",
    "desisto",
    "estornar",
    "estorno",
  ]

  // Regex de emojis e símbolos pictográficos (faixas Unicode).
  private static readonly REGEX_EMOJI =
    /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FE0F}\u{200D}]/gu

  // Horários: 08:30, 8h, 14h05, 23:59:59, etc.
  private static readonly REGEX_HORARIO = /\b\d{1,2}[:h]\d{0,2}(?::\d{2})?\s*(?:h|hs|hrs|horas|am|pm)?\b/gi

  // Datas: 12/05, 12/05/2025, 2025-05-12.
  private static readonly REGEX_DATA = /\b(?:\d{1,2}\/\d{1,2}(?:\/\d{2,4})?|\d{4}-\d{2}-\d{2})\b/g

  // Prefixo típico de citação exportada: "[12/05/2025 08:30] Fulano:".
  private static readonly REGEX_CABECALHO_EXPORT = /^\s*\[?[^\]]*\]?\s*[^:]{1,40}:\s*/

  // Telefone BR: (11) 99999-9999, +55 11 99999 9999, 11999999999, etc.
  private static readonly REGEX_TELEFONE =
    /(?:\+?55\s*)?(?:\(?\d{2}\)?[\s.-]?)?9?\d{4}[\s.-]?\d{4}/g

  // Rótulos comuns que antecedem o nome.
  private static readonly REGEX_ROTULO_NOME = /\b(?:nome|participante|nome completo|sou|aqui é|meu nome é)\s*[:\-]?\s*/i

  /**
   * Analisa a mensagem e retorna os dados estruturados do participante.
   * @throws Error quando não é possível extrair um nome minimamente válido.
   */
  public analisar(mensagemBruta: string): MensagemAnalisada {
    if (!mensagemBruta || typeof mensagemBruta !== "string") {
      throw new Error("Mensagem inválida: conteúdo vazio.")
    }

    const textoLimpo = this.limparTexto(mensagemBruta)
    const telefone = this.extrairTelefone(mensagemBruta)
    const { statusPagamento, palavrasChaveDetectadas } = this.detectarStatusPagamento(textoLimpo)
    const nome = this.extrairNome(textoLimpo, telefone)

    if (!nome) {
      throw new Error("Não foi possível identificar o nome do participante na mensagem.")
    }

    return {
      nome,
      telefone,
      statusPagamento,
      textoLimpo,
      palavrasChaveDetectadas,
    }
  }

  /**
   * Remove emojis, horários, datas, cabeçalhos de exportação e espaços extras.
   */
  private limparTexto(texto: string): string {
    return texto
      .replace(WhatsAppParserService.REGEX_CABECALHO_EXPORT, " ")
      .replace(WhatsAppParserService.REGEX_EMOJI, " ")
      .replace(WhatsAppParserService.REGEX_HORARIO, " ")
      .replace(WhatsAppParserService.REGEX_DATA, " ")
      .replace(/[\u2022\u25CF*_~`>]/g, " ") // marcadores/markdown
      .replace(/\s{2,}/g, " ")
      .trim()
  }

  /**
   * Extrai o primeiro telefone válido e o normaliza (somente dígitos).
   * Retorna null se nenhum número plausível for encontrado.
   */
  private extrairTelefone(texto: string): string | null {
    const candidatos = texto.match(WhatsAppParserService.REGEX_TELEFONE) ?? []

    for (const candidato of candidatos) {
      const digitos = candidato.replace(/\D/g, "")
      // Telefone BR: 10 (fixo+DDD) a 13 (DDI+DDD+9 dígitos) dígitos.
      if (digitos.length >= 10 && digitos.length <= 13) {
        return digitos
      }
    }

    return null
  }

  /**
   * Detecta palavras-chave financeiras e infere o status de pagamento.
   * Cancelamento tem prioridade sobre confirmação de pagamento.
   */
  private detectarStatusPagamento(texto: string): {
    statusPagamento: StatusPagamento
    palavrasChaveDetectadas: string[]
  } {
    const normalizado = this.normalizar(texto)
    const detectadas: string[] = []

    for (const palavra of WhatsAppParserService.PALAVRAS_CANCELADO) {
      if (this.contemPalavra(normalizado, palavra)) detectadas.push(palavra)
    }
    if (detectadas.length > 0) {
      return { statusPagamento: "CANCELADO", palavrasChaveDetectadas: detectadas }
    }

    for (const palavra of WhatsAppParserService.PALAVRAS_PAGO) {
      if (this.contemPalavra(normalizado, palavra)) detectadas.push(palavra)
    }
    if (detectadas.length > 0) {
      return { statusPagamento: "PAGO", palavrasChaveDetectadas: detectadas }
    }

    return { statusPagamento: "PENDENTE", palavrasChaveDetectadas: [] }
  }

  /**
   * Isola o nome do participante. Remove telefone, palavras-chave financeiras
   * e rótulos, mantendo apenas os tokens que se parecem com um nome próprio.
   */
  private extrairNome(textoLimpo: string, telefone: string | null): string {
    let base = textoLimpo

    // Remove o rótulo "nome:", "participante:", etc. (mantém o valor).
    base = base.replace(WhatsAppParserService.REGEX_ROTULO_NOME, " ")

    // Remove qualquer sequência de telefone remanescente.
    base = base.replace(WhatsAppParserService.REGEX_TELEFONE, " ")

    // Remove pontuação de separação, mantendo letras acentuadas e espaços.
    base = base.replace(/[^\p{L}\s]/gu, " ").replace(/\s{2,}/g, " ").trim()

    const bloqueadas = new Set(
      [
        ...WhatsAppParserService.PALAVRAS_PAGO,
        ...WhatsAppParserService.PALAVRAS_CANCELADO,
        "reais",
        "real",
        "rifa",
        "numero",
        "número",
        "quero",
        "vou",
        "boa",
        "bom",
        "dia",
        "tarde",
        "noite",
        "obrigado",
        "obrigada",
      ].map((p) => this.normalizar(p)),
    )

    const tokens = base
      .split(/\s+/)
      .filter((token) => token.length >= 2) // descarta letras/partículas soltas
      .filter((token) => !bloqueadas.has(this.normalizar(token)))

    if (tokens.length === 0) return ""

    // Limita a um nome plausível (até 4 palavras) e capitaliza.
    return tokens
      .slice(0, 4)
      .map((token) => token.charAt(0).toUpperCase() + token.slice(1).toLowerCase())
      .join(" ")
  }

  /** Remove acentos e coloca em minúsculas para comparação robusta. */
  private normalizar(texto: string): string {
    return texto
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
  }

  /** Verifica se a palavra aparece como token inteiro no texto normalizado. */
  private contemPalavra(textoNormalizado: string, palavra: string): boolean {
    const alvo = this.normalizar(palavra)
    const regex = new RegExp(`(?:^|\\s)${this.escaparRegex(alvo)}(?:$|\\s|[.,!?])`, "i")
    return regex.test(textoNormalizado)
  }

  private escaparRegex(texto: string): string {
    return texto.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  }
}

export const whatsAppParserService = new WhatsAppParserService()
