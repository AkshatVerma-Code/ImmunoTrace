import { ArrowRight, ArrowUpRight, Bot, FileCheck2, FileText, HeartPulse, LockKeyhole, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import Brand from '../components/Brand'

const features = [
  { icon: FileText, title: 'Records, all together', copy: 'Keep reports and prescriptions organized in one private place.' },
  { icon: Sparkles, title: 'The details, made clearer', copy: 'Turn complex documents into a readable health summary.' },
  { icon: HeartPulse, title: 'Wellness that meets you', copy: 'Explore everyday nutrition and movement with helpful AI guides.' },
]

export default function Landing() {
  return <div className="landing">
    <header className="site-nav"><Brand /><nav><a href="#how-it-works">How it works</a><a href="#why-immunotrace">Why ImmunoTrace</a></nav><div className="nav-actions"><Link className="nav-login" to="/login">Log in</Link><Link className="button button-primary button-small" to="/register">Create account <ArrowUpRight size={15} /></Link></div></header>
    <main>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow hero-eyebrow"><span className="eyebrow-dot" /> A MORE HUMAN WAY TO MANAGE YOUR HEALTH</div>
          <h1>Your health history,<br /><span>finally in focus.</span></h1>
          <p className="hero-description">Medical documents can be hard to keep up with. ImmunoTrace brings your records together and helps you understand what’s in them.</p>
          <div className="hero-actions"><Link className="button button-primary" to="/register">Get started for free <ArrowRight size={17} /></Link><Link className="button button-quiet" to="/login">I already have an account</Link></div>
          <div className="hero-trust"><LockKeyhole size={15} /><span>Your records are private and always yours.</span></div>
        </div>
        <div className="hero-visual" aria-label="Illustration of a medical records summary">
          <div className="visual-wash" />
          <div className="floating-label label-top"><span className="label-check"><FileCheck2 size={15} /></span> Records, organized</div>
          <div className="summary-card">
            <div className="summary-card-top"><div><span className="card-overline">ILLUSTRATIVE PREVIEW</span><h3>Health overview</h3></div><span className="card-avatar">A</span></div>
            <div className="summary-rule" />
            <div className="summary-section-heading"><span>RECENT DOCUMENTS</span><span className="text-teal">View all <ArrowUpRight size={12} /></span></div>
            <div className="document-row"><span className="file-icon file-blue"><FileText size={16} /></span><div><b>Blood test results</b><small>Laboratory report · 12 Aug 2025</small></div><span className="status-dot status-done" /></div>
            <div className="document-row"><span className="file-icon file-mint"><FileText size={16} /></span><div><b>Annual check-up</b><small>Visit summary · 03 Jun 2025</small></div><span className="status-dot status-review" /></div>
            <div className="mini-summary"><span className="mini-spark"><Sparkles size={14} /></span><div><b>Your summary is ready</b><small>A simple view of what your records say.</small></div><ArrowUpRight size={15} /></div>
          </div>
          <div className="floating-label label-bottom"><span className="bot-icon"><Bot size={16} /></span> Here when you have questions</div>
          <div className="visual-sun" />
        </div>
      </section>
      <section className="trust-strip"><span>MADE FOR YOUR EVERYDAY HEALTH JOURNEY</span><div><span><LockKeyhole size={15} /> Privacy first</span><i /><span><FileCheck2 size={15} /> You review every detail</span><i /><span><HeartPulse size={15} /> Supportive, not prescriptive</span></div></section>
      <section className="features-section" id="why-immunotrace"><div className="section-intro"><span className="eyebrow"><span className="eyebrow-dot" /> ONE CALMER PLACE FOR YOUR HEALTH</span><h2>Less searching.<br /><span>More understanding.</span></h2><p>Your health story deserves a space that feels clear, thoughtful and entirely your own.</p></div><div className="feature-grid">{features.map(({ icon: Icon, title, copy }, index) => <article className="feature-card" key={title}><span className={`feature-icon feature-icon-${index}`}><Icon size={20} /></span><span className="feature-index">0{index + 1}</span><h3>{title}</h3><p>{copy}</p></article>)}</div></section>
      <section className="steps-section" id="how-it-works"><div className="steps-heading"><span className="eyebrow"><span className="eyebrow-dot" /> SIMPLE BY DESIGN</span><h2>Your health records,<br /><span>one step at a time.</span></h2></div><div className="steps-list"><div><span>01</span><b>Bring your records together</b><small>Upload the reports and documents you want to keep close.</small></div><div><span>02</span><b>Review what matters</b><small>Check extracted details and keep the original source nearby.</small></div><div><span>03</span><b>Find your next question</b><small>Explore your history and get general wellness guidance.</small></div></div></section>
    </main>
    <footer className="site-footer"><Brand /><span>Thoughtful tools for your health journey.</span><p>ImmunoTrace is an educational health-record organization tool, not a medical service. AI-generated information may be incomplete. Always consult a qualified health professional about medical decisions.</p><small>© 2025 ImmunoTrace</small></footer>
  </div>
}
