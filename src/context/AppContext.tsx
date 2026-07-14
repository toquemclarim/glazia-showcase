import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { seedDespesas, seedLancamentos } from '../data/seed'
import type { DespesaFixa, Lancamento, Usuario } from '../types'
import { uid } from '../utils/format'

interface AppState {
  usuario: Usuario | null
  lancamentos: Lancamento[]
  despesas: DespesaFixa[]
  loading: boolean
  login: (email: string, senha: string) => Promise<boolean>
  logout: () => void
  navigateWithLoading: (navigate: () => void) => void
  addLancamento: (data: Omit<Lancamento, 'id'>) => void
  removeLancamento: (id: string) => void
  addDespesa: (data: Omit<DespesaFixa, 'id'>) => void
  updateDespesa: (id: string, data: Partial<DespesaFixa>) => void
  removeDespesa: (id: string) => void
}

const AppContext = createContext<AppState | null>(null)

const STORAGE_KEY = 'glazia-finance-v1'

function loadStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as {
      usuario: Usuario | null
      lancamentos: Lancamento[]
      despesas: DespesaFixa[]
    }
  } catch {
    return null
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const stored = loadStored()
  const [usuario, setUsuario] = useState<Usuario | null>(stored?.usuario ?? null)
  const [lancamentos, setLancamentos] = useState<Lancamento[]>(
    stored?.lancamentos ?? seedLancamentos,
  )
  const [despesas, setDespesas] = useState<DespesaFixa[]>(stored?.despesas ?? seedDespesas)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ usuario, lancamentos, despesas }),
    )
  }, [usuario, lancamentos, despesas])

  const login = useCallback(async (email: string, _senha: string) => {
    setLoading(true)
    await new Promise((r) => setTimeout(r, 900))
    const nome = email.split('@')[0] || 'Operador'
    setUsuario({
      nome: nome.charAt(0).toUpperCase() + nome.slice(1),
      email: email || 'admin@glazia.com.br',
    })
    setLoading(false)
    return true
  }, [])

  const logout = useCallback(() => {
    setUsuario(null)
  }, [])

  const navigateWithLoading = useCallback((navigate: () => void) => {
    setLoading(true)
    setTimeout(() => {
      navigate()
      setTimeout(() => setLoading(false), 450)
    }, 550)
  }, [])

  const addLancamento = useCallback((data: Omit<Lancamento, 'id'>) => {
    setLancamentos((prev) => [{ ...data, id: uid() }, ...prev])
  }, [])

  const removeLancamento = useCallback((id: string) => {
    setLancamentos((prev) => prev.filter((l) => l.id !== id))
  }, [])

  const addDespesa = useCallback((data: Omit<DespesaFixa, 'id'>) => {
    setDespesas((prev) => [{ ...data, id: uid() }, ...prev])
  }, [])

  const updateDespesa = useCallback((id: string, data: Partial<DespesaFixa>) => {
    setDespesas((prev) => prev.map((d) => (d.id === id ? { ...d, ...data } : d)))
  }, [])

  const removeDespesa = useCallback((id: string) => {
    setDespesas((prev) => prev.filter((d) => d.id !== id))
  }, [])

  const value = useMemo(
    () => ({
      usuario,
      lancamentos,
      despesas,
      loading,
      login,
      logout,
      navigateWithLoading,
      addLancamento,
      removeLancamento,
      addDespesa,
      updateDespesa,
      removeDespesa,
    }),
    [
      usuario,
      lancamentos,
      despesas,
      loading,
      login,
      logout,
      navigateWithLoading,
      addLancamento,
      removeLancamento,
      addDespesa,
      updateDespesa,
      removeDespesa,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
