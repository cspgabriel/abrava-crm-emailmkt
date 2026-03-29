import Link from 'next/link'
import React from 'react'

export default function Home() {
  return (
    <main style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h1>Consórcio (Next.js) - Scaffold</h1>
      <p>This is a migration scaffold. Migrate components from the Vite app into this folder.</p>
      <ul>
        <li><Link href="/cartas/123">Ver carta (example)</Link></li>
        <li><Link href="/portal">Portal do usuário (migrar `ClientPortal` here`)</Link></li>
      </ul>
    </main>
  )
}
