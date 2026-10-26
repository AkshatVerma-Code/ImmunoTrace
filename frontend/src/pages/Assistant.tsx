import { MessageCircle, ShieldCheck } from 'lucide-react'
import AssistantChat from '../components/AssistantChat'
export default function Assistant() {
  return <div className="assistant-page"><div className="page-title-row"><div><span className="page-eyebrow">YOUR HEALTHSPACE</span><h1>AI health assistant</h1><p>Ask questions about the information in your uploaded medical records.</p></div><span className="assistant-safety"><ShieldCheck size={14} /> Record-based answers</span></div><div className="assistant-disclaimer"><MessageCircle size={15} /><p>Answers use retrieved text from your documents and may miss context. Sources are shown with each reply. This assistant does not diagnose or recommend treatment.</p></div><AssistantChat agent="records" prompts={['What does my latest report mention?', 'Which laboratory results are in my records?', 'What medication names were recorded?']} /></div>
}
