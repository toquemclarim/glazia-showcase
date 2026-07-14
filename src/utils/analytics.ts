import type { DespesaFixa, Lancamento } from '../types'
import { filtrarLancamentosPorMes, isDespesaAtivaNoMes } from './format'

export interface AnaliseMensal {
  entradas: number
  saidas: number
  despesasFixas: number
  custosTotais: number
  lucroLiquido: number
  lucrativo: boolean
  porLinha: { nome: string; receita: number; custo: number; lucro: number }[]
  porProduto: { nome: string; receita: number; custo: number; lucro: number }[]
  porProjeto: { nome: string; receita: number; custo: number; lucro: number }[]
  porMaterial: { nome: string; custo: number }[]
  despesasPorCategoria: { nome: string; valor: number }[]
  fluxoDiario: { dia: string; entradas: number; saidas: number }[]
}

function agrupar(
  items: { chave: string; receita: number; custo: number }[],
): { nome: string; receita: number; custo: number; lucro: number }[] {
  const map = new Map<string, { receita: number; custo: number }>()
  for (const item of items) {
    const atual = map.get(item.chave) ?? { receita: 0, custo: 0 }
    atual.receita += item.receita
    atual.custo += item.custo
    map.set(item.chave, atual)
  }
  return Array.from(map.entries())
    .map(([nome, v]) => ({
      nome,
      receita: v.receita,
      custo: v.custo,
      lucro: v.receita - v.custo,
    }))
    .sort((a, b) => b.lucro - a.lucro)
}

export function calcularAnalise(
  lancamentos: Lancamento[],
  despesas: DespesaFixa[],
  monthKey: string,
): AnaliseMensal {
  const doMes = filtrarLancamentosPorMes(lancamentos, monthKey)
  const despesasAtivas = despesas.filter((d) => isDespesaAtivaNoMes(d, monthKey))

  const entradas = doMes.filter((l) => l.tipo === 'entrada').reduce((s, l) => s + l.valor, 0)
  const saidas = doMes.filter((l) => l.tipo === 'saida').reduce((s, l) => s + l.valor, 0)
  const despesasFixas = despesasAtivas.reduce((s, d) => s + d.valor, 0)
  const custosTotais = saidas + despesasFixas
  const lucroLiquido = entradas - custosTotais

  const porLinha = agrupar(
    doMes.map((l) => ({
      chave: l.linha,
      receita: l.tipo === 'entrada' ? l.valor : 0,
      custo: l.tipo === 'saida' ? l.valor : 0,
    })),
  )

  const porProduto = agrupar(
    doMes.map((l) => ({
      chave: l.produto,
      receita: l.tipo === 'entrada' ? l.valor : 0,
      custo: l.tipo === 'saida' ? l.valor : 0,
    })),
  )

  const porProjeto = agrupar(
    doMes.map((l) => ({
      chave: l.cliente,
      receita: l.tipo === 'entrada' ? l.valor : 0,
      custo: l.tipo === 'saida' ? l.valor : 0,
    })),
  )

  const materialMap = new Map<string, number>()
  for (const l of doMes) {
    if (l.tipo === 'saida' && l.material) {
      materialMap.set(l.material, (materialMap.get(l.material) ?? 0) + l.valor)
    }
  }
  const porMaterial = Array.from(materialMap.entries())
    .map(([nome, custo]) => ({ nome, custo }))
    .sort((a, b) => b.custo - a.custo)

  const catMap = new Map<string, number>()
  for (const d of despesasAtivas) {
    catMap.set(d.categoria, (catMap.get(d.categoria) ?? 0) + d.valor)
  }
  const despesasPorCategoria = Array.from(catMap.entries())
    .map(([nome, valor]) => ({ nome, valor }))
    .sort((a, b) => b.valor - a.valor)

  const diaMap = new Map<string, { entradas: number; saidas: number }>()
  for (const l of doMes) {
    const dia = l.data.slice(8, 10)
    const atual = diaMap.get(dia) ?? { entradas: 0, saidas: 0 }
    if (l.tipo === 'entrada') atual.entradas += l.valor
    else atual.saidas += l.valor
    diaMap.set(dia, atual)
  }
  const fluxoDiario = Array.from(diaMap.entries())
    .map(([dia, v]) => ({ dia, ...v }))
    .sort((a, b) => a.dia.localeCompare(b.dia))

  return {
    entradas,
    saidas,
    despesasFixas,
    custosTotais,
    lucroLiquido,
    lucrativo: lucroLiquido >= 0,
    porLinha,
    porProduto,
    porProjeto,
    porMaterial,
    despesasPorCategoria,
    fluxoDiario,
  }
}

export function listarMesesDisponiveis(lancamentos: Lancamento[]): string[] {
  const set = new Set(lancamentos.map((l) => l.data.slice(0, 7)))
  const atual = new Date().toISOString().slice(0, 7)
  set.add(atual)
  return Array.from(set).sort().reverse()
}
