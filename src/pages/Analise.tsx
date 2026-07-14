import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useApp } from '../context/AppContext'
import { useTheme } from '../context/ThemeContext'
import { calcularAnalise, listarMesesDisponiveis } from '../utils/analytics'
import { capitalize, formatCurrency, formatMonthLabel } from '../utils/format'

const BRONZE = '#c9a06a'
const BRONZE_DEEP = '#8a7355'
const MUTED = '#7a736c'
const SUCCESS = '#2d9f6f'
const DANGER = '#c45c4a'
const PIE_COLORS = [BRONZE, BRONZE_DEEP, '#dfbf8a', '#a89880', '#5c5348', '#e8d5b5']

function ChartTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { name: string; value: number; color: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div
      style={{
        background: 'var(--bg-panel-solid)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: '0.65rem 0.85rem',
        fontSize: '0.8rem',
        boxShadow: 'var(--shadow)',
      }}
    >
      {label && <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>}
      {payload.map((p) => (
        <div key={p.name} style={{ color: p.color, marginTop: 2 }}>
          {p.name}: {formatCurrency(p.value)}
        </div>
      ))}
    </div>
  )
}

export function Analise() {
  const { lancamentos, despesas } = useApp()
  const { theme } = useTheme()
  const meses = useMemo(() => listarMesesDisponiveis(lancamentos), [lancamentos])
  const [mes, setMes] = useState(meses[0] ?? new Date().toISOString().slice(0, 7))

  const analise = useMemo(
    () => calcularAnalise(lancamentos, despesas, mes),
    [lancamentos, despesas, mes],
  )

  const gridStroke = theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(40,32,24,0.1)'
  const tickFill = theme === 'dark' ? '#b8b0a6' : '#6a6158'

  const confrontoData = [
    { nome: 'Receitas', valor: analise.entradas, fill: SUCCESS },
    { nome: 'Custos materiais', valor: analise.saidas, fill: DANGER },
    { nome: 'Despesas fixas', valor: analise.despesasFixas, fill: BRONZE },
  ]

  return (
    <div>
      <div className="toolbar fade-up">
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: 420 }}>
          Confronto de receitas, custos de materiais e despesas fixas do período selecionado.
        </p>
        <div className="month-select">
          <label htmlFor="mes" style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Mês
          </label>
          <select id="mes" value={mes} onChange={(e) => setMes(e.target.value)}>
            {meses.map((m) => (
              <option key={m} value={m}>
                {capitalize(formatMonthLabel(m))}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={`glass verdict fade-up fade-up-delay-1 ${analise.lucrativo ? 'profit' : 'deficit'}`}>
        <div>
          <h2>
            {analise.lucrativo ? 'Mês lucrativo' : 'Mês em déficit'}
          </h2>
          <p>
            Fluxo de caixa de {capitalize(formatMonthLabel(mes))} — receitas menos custos totais
            (materiais + despesas fixas).
          </p>
        </div>
        <div className="amount">
          {analise.lucrativo ? '+' : ''}
          {formatCurrency(analise.lucroLiquido)}
        </div>
      </div>

      <div className="stats-row fade-up fade-up-delay-2">
        <div className="glass stat-card success">
          <div className="label">Receitas</div>
          <div className="value">{formatCurrency(analise.entradas)}</div>
        </div>
        <div className="glass stat-card danger">
          <div className="label">Custos materiais</div>
          <div className="value">{formatCurrency(analise.saidas)}</div>
        </div>
        <div className="glass stat-card accent">
          <div className="label">Despesas fixas</div>
          <div className="value">{formatCurrency(analise.despesasFixas)}</div>
        </div>
        <div className="glass stat-card">
          <div className="label">Custos totais</div>
          <div className="value">{formatCurrency(analise.custosTotais)}</div>
        </div>
      </div>

      <div className="charts-grid fade-up fade-up-delay-3">
        <div className="glass chart-panel">
          <h3>Confronto do mês</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={confrontoData} barSize={42}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
              <XAxis dataKey="nome" tick={{ fill: tickFill, fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: tickFill, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="valor" name="Valor" radius={[6, 6, 0, 0]}>
                {confrontoData.map((entry) => (
                  <Cell key={entry.nome} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass chart-panel">
          <h3>Despesas fixas por categoria</h3>
          {analise.despesasPorCategoria.length === 0 ? (
            <div className="empty-state"><p>Sem despesas no período</p></div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={analise.despesasPorCategoria}
                  dataKey="valor"
                  nameKey="nome"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                >
                  {analise.despesasPorCategoria.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend
                  formatter={(value) => <span style={{ color: tickFill, fontSize: 12 }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="glass chart-panel">
          <h3>Lucro por linha</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={analise.porLinha} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} horizontal={false} />
              <XAxis type="number" tick={{ fill: tickFill, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="nome" width={90} tick={{ fill: tickFill, fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="lucro" name="Lucro" fill={BRONZE_DEEP} radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass chart-panel">
          <h3>Lucro por produto</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={analise.porProduto}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
              <XAxis dataKey="nome" tick={{ fill: tickFill, fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: tickFill, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="lucro" name="Lucro" fill={BRONZE} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass chart-panel full">
          <h3>Projetos / clientes com mais lucro</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={analise.porProjeto.slice(0, 8)}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
              <XAxis dataKey="nome" tick={{ fill: tickFill, fontSize: 11 }} axisLine={false} tickLine={false} interval={0} angle={-18} textAnchor="end" height={70} />
              <YAxis tick={{ fill: tickFill, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<ChartTooltip />} />
              <Legend formatter={(v) => <span style={{ color: tickFill, fontSize: 12 }}>{v}</span>} />
              <Bar dataKey="receita" name="Receita" fill={BRONZE_DEEP} radius={[4, 4, 0, 0]} />
              <Bar dataKey="custo" name="Custo" fill={MUTED} radius={[4, 4, 0, 0]} />
              <Bar dataKey="lucro" name="Lucro" fill={BRONZE} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass chart-panel">
          <h3>Materiais que mais custaram</h3>
          {analise.porMaterial.length === 0 ? (
            <div className="empty-state"><p>Sem saídas de material no período</p></div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={analise.porMaterial} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} horizontal={false} />
                <XAxis type="number" tick={{ fill: tickFill, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="nome" width={120} tick={{ fill: tickFill, fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="custo" name="Custo" fill={DANGER} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="glass chart-panel">
          <h3>Fluxo diário</h3>
          {analise.fluxoDiario.length === 0 ? (
            <div className="empty-state"><p>Sem movimentos no período</p></div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={analise.fluxoDiario}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis dataKey="dia" tick={{ fill: tickFill, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: tickFill, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<ChartTooltip />} />
                <Legend formatter={(v) => <span style={{ color: tickFill, fontSize: 12 }}>{v}</span>} />
                <Bar dataKey="entradas" name="Entradas" fill={SUCCESS} radius={[4, 4, 0, 0]} />
                <Bar dataKey="saidas" name="Saídas" fill={DANGER} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="glass" style={{ padding: '1.25rem' }}>
        <div className="panel-header">
          <h2>Ranking de lucro por projeto</h2>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>#</th>
                <th>Cliente / projeto</th>
                <th>Receita</th>
                <th>Custo</th>
                <th>Lucro</th>
              </tr>
            </thead>
            <tbody>
              {analise.porProjeto.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    Nenhum lançamento neste mês
                  </td>
                </tr>
              ) : (
                analise.porProjeto.map((p, i) => (
                  <tr key={p.nome}>
                    <td style={{ color: 'var(--text-dim)' }}>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{p.nome}</td>
                    <td style={{ color: 'var(--success)' }}>{formatCurrency(p.receita)}</td>
                    <td style={{ color: 'var(--danger)' }}>{formatCurrency(p.custo)}</td>
                    <td style={{ fontWeight: 700, color: p.lucro >= 0 ? 'var(--accent)' : 'var(--danger)' }}>
                      {formatCurrency(p.lucro)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
