'use client'
import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
export default function AuthForm({ signup }) {
  const [email, setEmail] = useState(''), [password, setPassword] = useState(''), [msg, setMsg] = useState(''), [busy, setBusy] = useState(false)
  async function submit(e) {
    e.preventDefault(); setBusy(true); setMsg('')
    const { data, error } = signup ? await supabase.auth.signUp({ email, password }) : await supabase.auth.signInWithPassword({ email, password })
    if (error) setMsg(error.message)
    else if (signup && !data.session) setMsg('Check your email to confirm your account, then log in.')
    setBusy(false)
  }
  return (
    <div className="grid min-h-screen place-items-center px-4">
      <motion.form onSubmit={submit} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="card w-full max-w-sm space-y-4 p-8">
        <h1 className="text-center font-display text-4xl tracking-widest text-gold">VANTORA</h1>
        <p className="text-center text-sm text-white/60">{signup ? 'Create your demo portfolio with $10,000 in virtual credits.' : 'Log in to your demo portfolio.'}</p>
        <input className="input" type="email" required placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <input className="input" type="password" required minLength={6} placeholder="Password (6+ characters)" value={password} onChange={e => setPassword(e.target.value)} />
        {msg && <p className="text-sm text-amber">{msg}</p>}
        <button className="btn w-full" disabled={busy}>{busy ? 'Please wait…' : signup ? 'Create account' : 'Log in'}</button>
        <p className="text-center text-sm text-white/60">{signup ? <>Have an account? <Link className="text-gold" href="/login">Log in</Link></> : <>New here? <Link className="text-gold" href="/signup">Sign up</Link></>}</p>
      </motion.form>
    </div>)
}
