'use client'

import { useState } from 'react'
import RoletaSorteio from "@/app/components/RoletaSorteio"
import { limparTextoWhatsApp } from "../actions/rifa.actions"

export default function EstudoDeSorteio() {
  const [textoBruto, setTextoBruto] = useState('')
  const [participantes, setParticipantes] = useState<string[]>([])
  const [processando, setProcessando] = useState(false)

  const handleProcessarLista = async () => {
    if (!textoBruto.trim()) return
    setProcessando(true)
    
    // Chama a nossa Server Action para limpar o texto lá no backend
    const listaLimpa = await limparTextoWhatsApp(textoBruto)
    setParticipantes(listaLimpa)
    setProcessando(false)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          Estúdio de Sorteio Live
        </h1>
        <p className="text-slate-400 mt-2">Limpe os dados do WhatsApp e inicie a roleta.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LADO ESQUERDO: Entrada de Dados */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-slate-200">🧹 Preparar Lista</h2>
          <p className="text-sm text-slate-400">
            Cole a lista bagunçada do WhatsApp aqui. O sistema vai remover horários, emojis e palavras como "pago" e "pix".
          </p>
          
          <textarea
            value={textoBruto}
            onChange={(e) => setTextoBruto(e.target.value)}
            placeholder="[14:30] João Silva - pago✅&#10;[14:35] Maria Oliveira - pix enviado"
            className="w-full h-64 bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-200 focus:ring-2 focus:ring-cyan-500 focus:outline-none resize-none"
          />
          
          <button
            onClick={handleProcessarLista}
            disabled={processando || !textoBruto}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
          >
            {processando ? 'Limpando...' : 'Limpar e Processar Dados'}
          </button>

          {participantes.length > 0 && (
            <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <p className="text-emerald-400 font-semibold mb-2">
                ✅ {participantes.length} participantes prontos!
              </p>
              <div className="max-h-32 overflow-y-auto text-sm text-slate-300 space-y-1">
                {participantes.map((p, i) => (
                  <div key={i} className="py-1 border-b border-slate-800/50 last:border-0">{p}</div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* LADO DIREITO: A Roleta Visual */}
        <div className="flex items-center justify-center">
          <div className="w-full">
            <RoletaSorteio participantes={participantes} />
          </div>
        </div>
      </div>
    </div>
  )
}