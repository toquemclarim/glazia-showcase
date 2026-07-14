import type { DespesaFixa, Lancamento } from '../types'
import { calcularAnalise, listarMesesDisponiveis } from './analytics'
import { capitalize, formatCurrency, formatMonthLabel, isDespesaAtivaNoMes } from './format'

export const CHAT_PROMPTS = [
  'Resumo financeiro do mês',
  'Análise automática do fluxo de caixa',
  'Alerta de contas a vencer',
  'Top 5 maiores despesas',
  'Evolução do faturamento',
  'Saúde financeira (nota de 0 a 100)',
] as const

export type ChatPrompt = (typeof CHAT_PROMPTS)[number]

function mesAtualKey(lancamentos: Lancamento[]): string {
  return listarMesesDisponiveis(lancamentos)[0] ?? new Date().toISOString().slice(0, 7)
}

function margem(analise: ReturnType<typeof calcularAnalise>): number {
  if (analise.entradas <= 0) return 0
  return (analise.lucroLiquido / analise.entradas) * 100
}

function saudeNota(analise: ReturnType<typeof calcularAnalise>): number {
  let nota = 50
  if (analise.lucrativo) nota += 20
  else nota -= 15

  const m = margem(analise)
  if (m >= 35) nota += 20
  else if (m >= 20) nota += 12
  else if (m >= 10) nota += 5
  else if (m < 0) nota -= 20

  const fixasPct = analise.entradas > 0 ? (analise.despesasFixas / analise.entradas) * 100 : 50
  if (fixasPct <= 20) nota += 10
  else if (fixasPct <= 30) nota += 5
  else if (fixasPct > 45) nota -= 10

  if (analise.entradas > analise.custosTotais * 1.3) nota += 8
  return Math.max(0, Math.min(100, Math.round(nota)))
}

function saudeLabel(nota: number): string {
  if (nota >= 80) return 'excelente'
  if (nota >= 65) return 'boa'
  if (nota >= 50) return 'estável'
  if (nota >= 35) return 'atenta'
  return 'crítica'
}

export function gerarRespostaChat(
  prompt: ChatPrompt,
  lancamentos: Lancamento[],
  despesas: DespesaFixa[],
): string {
  const mes = mesAtualKey(lancamentos)
  const mesLabel = capitalize(formatMonthLabel(mes))
  const analise = calcularAnalise(lancamentos, despesas, mes)
  const meses = listarMesesDisponiveis(lancamentos).slice(0, 3)

  switch (prompt) {
    case 'Resumo financeiro do mês': {
      const linhaTop = analise.porLinha[0]
      const produtoTop = analise.porProduto[0]
      return [
        `Aqui está o panorama de ${mesLabel}, com base nos lançamentos e despesas cadastrados.`,
        ``,
        `• Receitas: ${formatCurrency(analise.entradas)}`,
        `• Custos de materiais: ${formatCurrency(analise.saidas)}`,
        `• Despesas fixas: ${formatCurrency(analise.despesasFixas)}`,
        `• Resultado líquido: ${formatCurrency(analise.lucroLiquido)} (${analise.lucrativo ? 'lucro' : 'déficit'})`,
        ``,
        linhaTop
          ? `A linha com melhor desempenho foi ${linhaTop.nome}, com lucro de ${formatCurrency(linhaTop.lucro)}. ${produtoTop ? `No recorte de produtos, ${produtoTop.nome} lidera com ${formatCurrency(produtoTop.lucro)}.` : ''}`
          : `Ainda há poucos movimentos neste mês para detalhar linhas e produtos.`,
        ``,
        `Se quiser, posso aprofundar o fluxo de caixa ou a saúde financeira.`,
      ].join('\n')
    }

    case 'Análise automática do fluxo de caixa': {
      const diasPositivos = analise.fluxoDiario.filter((d) => d.entradas >= d.saidas).length
      const diasNegativos = analise.fluxoDiario.filter((d) => d.entradas < d.saidas).length
      const pico = [...analise.fluxoDiario].sort((a, b) => b.entradas - a.entradas)[0]
      return [
        `Analisei o fluxo de caixa de ${mesLabel} considerando entradas, saídas de material e despesas fixas.`,
        ``,
        `O caixa encerrou o período com ${analise.lucrativo ? 'sobra' : 'pressão'} de ${formatCurrency(Math.abs(analise.lucroLiquido))}.`,
        `Margem líquida estimada: ${margem(analise).toFixed(1)}%.`,
        ``,
        `Nos dias com movimento, ${diasPositivos} ficaram positivos e ${diasNegativos} com saída superior à entrada.`,
        pico
          ? `O dia de maior faturamento foi o dia ${pico.dia}, com ${formatCurrency(pico.entradas)} em entradas.`
          : `Não há série diária suficiente para apontar picos.`,
        ``,
        analise.lucrativo
          ? `Leitura Glazia: o mês sustenta a operação com folga. Vale reservar parte do resultado para reforço de estoque de vidro e alumínio.`
          : `Leitura Glazia: o fluxo está apertado. Priorize cobranças em aberto e revise compras de material antes de novos pedidos.`,
      ].join('\n')
    }

    case 'Alerta de contas a vencer': {
      const ativas = despesas
        .filter((d) => isDespesaAtivaNoMes(d, mes))
        .sort((a, b) => b.valor - a.valor)
      const comFim = ativas.filter((d) => d.dataFim)
      const recorrentes = ativas.filter((d) => !d.dataFim)

      const linhas = ativas.slice(0, 5).map((d, i) => {
        const prazo = d.dataFim
          ? `parcela ativa até ${d.dataFim.split('-').reverse().join('/')}`
          : 'recorrente mensal'
        return `${i + 1}. ${d.descricao} — ${formatCurrency(d.valor)} (${d.categoria}, ${prazo})`
      })

      return [
        `Monitorei os compromissos fixos que impactam ${mesLabel}.`,
        ``,
        `Há ${ativas.length} despesas ativas no mês, totalizando ${formatCurrency(analise.despesasFixas)}.`,
        `${recorrentes.length} são recorrentes e ${comFim.length} possuem data de término (parcelamentos).`,
        ``,
        `Próximos valores a considerar:`,
        ...linhas,
        ``,
        comFim[0]
          ? `Atenção especial: "${comFim[0].descricao}" segue em parcelamento. Confirme a disponibilidade de caixa antes do próximo vencimento.`
          : `Nenhum parcelamento com data fim crítica foi identificado neste recorte.`,
        ``,
        `Sugestão Glazia: provisione ao menos ${formatCurrency(analise.despesasFixas * 0.3)} como reserva de curto prazo.`,
      ].join('\n')
    }

    case 'Top 5 maiores despesas': {
      const materiais = analise.porMaterial.slice(0, 5)
      const fixas = despesas
        .filter((d) => isDespesaAtivaNoMes(d, mes))
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 5)

      const combinadas = [
        ...materiais.map((m) => ({ nome: m.nome, valor: m.custo, tipo: 'Material' })),
        ...fixas.map((d) => ({ nome: d.descricao, valor: d.valor, tipo: d.categoria })),
      ]
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 5)

      return [
        `Separei as cinco maiores saídas que pesaram em ${mesLabel} (materiais + fixas).`,
        ``,
        ...combinadas.map(
          (item, i) =>
            `${i + 1}. ${item.nome} — ${formatCurrency(item.valor)} · ${item.tipo}`,
        ),
        ``,
        combinadas[0]
          ? `"${combinadas[0].nome}" concentra o maior custo do período. Se for material, avalie renegociação com fornecedor; se for fixa, cheque se há espaço de redução.`
          : `Não há despesas suficientes para montar o ranking neste mês.`,
        ``,
        `Posso cruzar isso com o lucro por linha, se fizer sentido.`,
      ].join('\n')
    }

    case 'Evolução do faturamento': {
      const serie = meses
        .slice()
        .reverse()
        .map((m) => {
          const a = calcularAnalise(lancamentos, despesas, m)
          return { mes: m, label: capitalize(formatMonthLabel(m)), receita: a.entradas, lucro: a.lucroLiquido }
        })

      const atual = serie[serie.length - 1]
      const anterior = serie[serie.length - 2]
      let variacao = ''
      if (atual && anterior && anterior.receita > 0) {
        const pct = ((atual.receita - anterior.receita) / anterior.receita) * 100
        const sentido = pct >= 0 ? 'alta' : 'queda'
        variacao = `Na comparação com ${anterior.label}, o faturamento teve ${sentido} de ${Math.abs(pct).toFixed(1)}%.`
      }

      return [
        `Acompanhei a evolução recente do faturamento com os dados disponíveis.`,
        ``,
        ...serie.map(
          (s) =>
            `• ${s.label}: receita ${formatCurrency(s.receita)} · resultado ${formatCurrency(s.lucro)}`,
        ),
        ``,
        variacao || 'Com mais meses lançados, a tendência fica ainda mais clara.',
        atual
          ? `Leitura Glazia: ${atual.lucro >= 0 ? 'a curva atual é favorável' : 'o resultado recente merece atenção'} — foque em projetos de maior margem e controle de material.`
          : '',
      ]
        .filter(Boolean)
        .join('\n')
    }

    case 'Saúde financeira (nota de 0 a 100)': {
      const nota = saudeNota(analise)
      const label = saudeLabel(nota)
      const m = margem(analise)
      const fixasPct = analise.entradas > 0 ? (analise.despesasFixas / analise.entradas) * 100 : 0

      return [
        `Calculei a saúde financeira de ${mesLabel} com base em lucro, margem e peso das despesas fixas.`,
        ``,
        `Nota Glazia: ${nota}/100 — situação ${label}.`,
        ``,
        `Critérios observados:`,
        `• Resultado do mês: ${analise.lucrativo ? 'positivo' : 'negativo'} (${formatCurrency(analise.lucroLiquido)})`,
        `• Margem líquida: ${m.toFixed(1)}%`,
        `• Despesas fixas sobre a receita: ${fixasPct.toFixed(1)}%`,
        `• Cobertura de custos: receita cobre ${analise.custosTotais > 0 ? ((analise.entradas / analise.custosTotais) * 100).toFixed(0) : '—'}% dos custos totais`,
        ``,
        nota >= 65
          ? `A operação está saudável. Mantenha o ritmo das linhas mais rentáveis e preserve a reserva de caixa.`
          : `Há pontos de tensão. Recomendo revisar o top de despesas e acelerar o recebimento dos projetos em andamento.`,
      ].join('\n')
    }

    default:
      return 'Posso ajudar com resumo do mês, fluxo de caixa, alertas, ranking de despesas, evolução e saúde financeira.'
  }
}
