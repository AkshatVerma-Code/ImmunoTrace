import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import Brand from './Brand'

export default function AuthLayout({ children, title, subtitle }: { children: ReactNode; title: string; subtitle: string }) {
  return <main className="auth-page">
    <section className="auth-art">
      <Brand />
      <div className="auth-art-copy">
        <div className="eyebrow"><span className="eyebrow-dot" /> YOUR HEALTH, IN ONE PLACE</div>
        <h1>A clearer view<br />of your health.</h1>
        <p>Bring your health records together and make them easier to understand.</p>
        <div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" />
        <div className="art-card"><span className="art-card-icon"><ShieldCheck size={19} /></span><span><b>Your records stay yours</b><small>Private, secure and always in your control</small></span><span className="art-card-check">✓</span></div>
      </div>
      <span className="auth-art-footer">A little more clarity, every day.</span>
    </section>
    <section className="auth-form-side">
      <Link to="/" className="mobile-back"><ArrowLeft size={17} /> Back to home</Link>
      <div className="auth-form-wrap">
        <div className="auth-mobile-brand"><Brand /></div>
        <div className="auth-heading"><span className="auth-kicker">WELCOME TO IMMUNOTRACE</span><h2>{title}</h2><p>{subtitle}</p></div>
        {children}
        <p className="auth-privacy"><ShieldCheck size={15} /> Your health information is private and secure.</p>
      </div>
      <span className="auth-bottom-note">For personal health organization. Not medical advice.</span>
    </section>
  </main>
}
