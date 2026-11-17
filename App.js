'use client'
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
const Ctx = createContext(null)
export const useApp = () => useContext(Ctx)
export const fmt = n => '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const PUBLIC = ['/login', '/signup']

export function AppProvider({ children }) {
  const [user, setUser] = useState(null), [profile, setProfile] = useState(null)
  const [holdings, setHoldings] = useState([]), [ready, setReady] = useState(false), [now, setNow] = useState(Date.now())
  const router = useRouter(), path = usePathname()
  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setUser(null); setProfile(null); setHoldings([]); setReady(true); return }
    setUser(session.user)
    const [p, h] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', session.user.id).single(),
      supabase.from('holdings').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false })])
    setProfile(p.data); setHoldings(h.data || []); setReady(true)
  }, [])
  useEffect(() => { load(); const { data: l } = supabase.auth.onAuthStateChange(() => load()); return () => l.subscription.unsubscribe() }, [load])
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 250); return () => clearInterval(t) }, [])
  useEffect(() => {
    if (!ready) return
    if (!user && !PUBLIC.includes(path)) router.replace('/login')
    if (user && PUBLIC.includes(path)) router.replace('/dashboard')
  }, [ready, user, path, router])

  // Simulation clock: 1 real minute = 1 simulated day, compounding daily.
  const invested = holdings.reduce((s, h) => s + Number(h.amount), 0)
  const accrued = holdings.reduce((s, h) => s + h.amount * (Math.pow(1 + h.daily_yield / 100, (now - new Date(h.created_at)) / 60000) - 1), 0)
  const available = Number(profile?.balance || 0)
  const total = available + invested + accrued
  const value = { user, profile, holdings, reload: load, invested, accrued, available, total, now }

  if (!ready) return <div className="grid min-h-screen place-items-center font-display text-3xl text-gold pulse-soft">VANTORA</div>
  if (!user) return <Ctx.Provider value={value}>{PUBLIC.includes(path) ? children : null}</Ctx.Provider>
  return (
    <Ctx.Provider value={value}>
      <header className="sticky top-0 z-30 border-b border-gold/15 bg-abyss/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link href="/dashboard" className="font-display text-2xl tracking-widest text-gold">VANTORA</Link>
          <nav className="flex gap-4 text-sm">
            {[['/dashboard', 'Dashboard'], ['/marketplace', 'Marketplace'], ...(profile?.is_admin ? [['/admin', 'Admin']] : [])].map(([h, l]) =>
              <Link key={h} href={h} className={path === h ? 'text-gold' : 'text-white/70 hover:text-amber'}>{l}</Link>)}
          </nav>
          <div className="flex items-center gap-4">
            <div className="text-right"><div className="text-[11px] text-white/50">Portfolio value</div>
              <div className="glow pulse-soft text-xl font-semibold">{fmt(total)}</div></div>
            <button className="text-sm text-white/60 hover:text-gold" onClick={() => supabase.auth.signOut()}>Log out</button>
          </div>
        </div>
      </header>
      <motion.main key={path} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mx-auto max-w-6xl px-4 py-8">{children}</motion.main>
    </Ctx.Provider>)
}
