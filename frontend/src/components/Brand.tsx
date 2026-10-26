import { Activity } from 'lucide-react'

export default function Brand({ compact = false }: { compact?: boolean }) {
  return <a className={`brand ${compact ? 'brand-compact' : ''}`} href="/" aria-label="ImmunoTrace home">
    <span className="brand-mark"><Activity size={21} strokeWidth={2.6} /></span>
    {!compact && <span>immuno<span className="brand-accent">trace</span></span>}
  </a>
}
