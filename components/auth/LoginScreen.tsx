'use client'

import { useState } from 'react'
import { CircuitBoardIcon } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'

export default function LoginScreen() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const login = useAuthStore((s) => s.login)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimName = name.trim()
    const trimPhone = phone.trim().replace(/\D/g, '')
    if (!trimName) { setError('Ingresa tu nombre'); return }
    if (trimPhone.length < 7) { setError('Ingresa un número de celular válido'); return }
    login(trimName, trimPhone)
  }

  return (
    <div className="flex items-center justify-center min-h-[100dvh] bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center">
            <CircuitBoardIcon className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">Logic Circuit Simulator</h1>
          <p className="text-sm text-muted-foreground text-center">
            Inicia sesión para guardar tus circuitos
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Nombre
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError('') }}
              placeholder="Tu nombre"
              autoComplete="name"
              className="h-10 px-3 rounded-lg border border-border bg-secondary text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="phone" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Celular
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => { setPhone(e.target.value); setError('') }}
              placeholder="3001234567"
              autoComplete="tel"
              inputMode="numeric"
              className="h-10 px-3 rounded-lg border border-border bg-secondary text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}

          <button
            type="submit"
            className="h-10 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity active:scale-[0.98]"
          >
            Entrar
          </button>

          <p className="text-[10px] text-muted-foreground text-center mt-2">
            Tus circuitos se guardan localmente en este dispositivo
          </p>
        </form>
      </div>
    </div>
  )
}
