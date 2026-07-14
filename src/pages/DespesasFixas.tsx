import { Pencil, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { CATEGORIAS, type CategoriaDespesa, type DespesaFixa } from '../types'
import { formatCurrency, formatDate } from '../utils/format'

const emptyForm = {
  categoria: 'Operacional' as CategoriaDespesa,
  descricao: '',
  valor: '',
  dataInicio: new Date().toISOString().slice(0, 10),
  dataFim: '',
}

export function DespesasFixas() {
  const { despesas, addDespesa, updateDespesa, removeDespesa } = useApp()
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState<DespesaFixa | null>(null)
  const [ok, setOk] = useState(false)

  const set = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }))

  const startEdit = (d: DespesaFixa) => {
    setEditing(d)
    setForm({
      categoria: d.categoria,
      descricao: d.descricao,
      valor: String(d.valor),
      dataInicio: d.dataInicio,
      dataFim: d.dataFim ?? '',
    })
  }

  const cancelEdit = () => {
    setEditing(null)
    setForm(emptyForm)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const num = Number(form.valor.replace(',', '.'))
    if (!form.descricao.trim() || !num || num <= 0) return

    const payload = {
      categoria: form.categoria,
      descricao: form.descricao.trim(),
      valor: num,
      dataInicio: form.dataInicio,
      dataFim: form.dataFim || undefined,
    }

    if (editing) {
      updateDespesa(editing.id, payload)
      setEditing(null)
    } else {
      addDespesa(payload)
    }

    setForm(emptyForm)
    setOk(true)
    setTimeout(() => setOk(false), 2200)
  }

  const totalMensal = despesas.reduce((s, d) => s + d.valor, 0)

  return (
    <div>
      <div className="stats-row fade-up" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
        <div className="glass stat-card">
          <div className="label">Despesas cadastradas</div>
          <div className="value">{despesas.length}</div>
        </div>
        <div className="glass stat-card accent">
          <div className="label">Compromisso mensal</div>
          <div className="value">{formatCurrency(totalMensal)}</div>
        </div>
      </div>

      <div className="glass fade-up fade-up-delay-1" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="panel-header">
          <h2>{editing ? 'Editar despesa' : 'Nova despesa fixa'}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {ok && (
              <span style={{ color: 'var(--success)', fontSize: '0.85rem', fontWeight: 600 }}>
                Salvo
              </span>
            )}
            {editing && (
              <button type="button" className="btn btn-ghost" onClick={cancelEdit}>
                <X size={16} /> Cancelar
              </button>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="cat">Categoria</label>
              <select
                id="cat"
                value={form.categoria}
                onChange={(e) => set('categoria', e.target.value)}
              >
                {CATEGORIAS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="valor-d">Valor mensal (R$)</label>
              <input
                id="valor-d"
                type="number"
                min="0.01"
                step="0.01"
                value={form.valor}
                onChange={(e) => set('valor', e.target.value)}
                required
              />
            </div>

            <div className="field full">
              <label htmlFor="desc-d">Descrição</label>
              <input
                id="desc-d"
                value={form.descricao}
                onChange={(e) => set('descricao', e.target.value)}
                placeholder="Ex.: Aluguel do galpão"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="ini">Data início</label>
              <input
                id="ini"
                type="date"
                value={form.dataInicio}
                onChange={(e) => set('dataInicio', e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="fim">Data fim (se aplicar)</label>
              <input
                id="fim"
                type="date"
                value={form.dataFim}
                onChange={(e) => set('dataFim', e.target.value)}
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-accent">
              {editing ? 'Atualizar' : 'Adicionar despesa'}
            </button>
          </div>
        </form>
      </div>

      <div className="glass fade-up fade-up-delay-2" style={{ padding: '1.25rem' }}>
        <div className="panel-header">
          <h2>Despesas ativas</h2>
        </div>

        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Categoria</th>
                <th>Descrição</th>
                <th>Valor</th>
                <th>Início</th>
                <th>Fim</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {despesas.map((d) => (
                <tr key={d.id}>
                  <td>
                    <span className="badge badge-cat">{d.categoria}</span>
                  </td>
                  <td>{d.descricao}</td>
                  <td style={{ fontWeight: 600 }}>{formatCurrency(d.valor)}</td>
                  <td>{formatDate(d.dataInicio)}</td>
                  <td>{d.dataFim ? formatDate(d.dataFim) : '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <button
                        className="btn-icon"
                        onClick={() => startEdit(d)}
                        aria-label="Editar"
                        title="Editar"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => removeDespesa(d.id)}
                        aria-label="Excluir"
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
