import { create } from 'zustand'
import type { SavedCircuit, UserSession } from '@/lib/types'

interface AuthStore {
  user: UserSession | null
  isLoggedIn: boolean
  login: (name: string, phone: string) => void
  logout: () => void
  saveCircuit: (circuit: Omit<SavedCircuit, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateCircuit: (id: string, data: Partial<Pick<SavedCircuit, 'name' | 'equation' | 'nodes' | 'edges'>>) => void
  deleteCircuit: (id: string) => void
  setActiveCircuit: (id: string | null) => void
  getActiveCircuit: () => SavedCircuit | null
}

function getStorageKey(phone: string) {
  return `circuit-sim-user-${phone}`
}

function loadUser(phone: string): UserSession | null {
  try {
    const raw = localStorage.getItem(getStorageKey(phone))
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function persistUser(user: UserSession) {
  try {
    localStorage.setItem(getStorageKey(user.phone), JSON.stringify(user))
    localStorage.setItem('circuit-sim-last-phone', user.phone)
  } catch { /* storage full */ }
}

function loadLastSession(): UserSession | null {
  try {
    const phone = localStorage.getItem('circuit-sim-last-phone')
    if (!phone) return null
    return loadUser(phone)
  } catch { return null }
}

function generateId() {
  return `c-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export const useAuthStore = create<AuthStore>((set, get) => {
  const initial = typeof window !== 'undefined' ? loadLastSession() : null
  return {
  user: initial,
  isLoggedIn: initial !== null,

  login: (name, phone) => {
    const existing = loadUser(phone)
    const user: UserSession = existing
      ? { ...existing, name }
      : { name, phone, circuits: [], activeCircuitId: null }
    persistUser(user)
    set({ user, isLoggedIn: true })
  },

  logout: () => {
    set({ user: null, isLoggedIn: false })
  },

  saveCircuit: (data) => {
    const { user } = get()
    if (!user) return ''
    const id = generateId()
    const circuit: SavedCircuit = {
      ...data,
      id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    const updated = { ...user, circuits: [...user.circuits, circuit], activeCircuitId: id }
    persistUser(updated)
    set({ user: updated })
    return id
  },

  updateCircuit: (id, data) => {
    const { user } = get()
    if (!user) return
    const circuits = user.circuits.map((c) =>
      c.id === id ? { ...c, ...data, updatedAt: Date.now() } : c
    )
    const updated = { ...user, circuits }
    persistUser(updated)
    set({ user: updated })
  },

  deleteCircuit: (id) => {
    const { user } = get()
    if (!user) return
    const circuits = user.circuits.filter((c) => c.id !== id)
    const activeCircuitId = user.activeCircuitId === id ? null : user.activeCircuitId
    const updated = { ...user, circuits, activeCircuitId }
    persistUser(updated)
    set({ user: updated })
  },

  setActiveCircuit: (id) => {
    const { user } = get()
    if (!user) return
    const updated = { ...user, activeCircuitId: id }
    persistUser(updated)
    set({ user: updated })
  },

  getActiveCircuit: () => {
    const { user } = get()
    if (!user || !user.activeCircuitId) return null
    return user.circuits.find((c) => c.id === user.activeCircuitId) ?? null
  },
}})
