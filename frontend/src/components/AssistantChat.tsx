import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ArrowUp, Bot, FileText, LoaderCircle, Plus, Sparkles, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { assistantApi, type Conversation, type ChatMessage } from '../services/api'

type Agent = 'records' | 'diet' | 'exercise'
const titles: Record<Agent, string> = { records:'Health records assistant', diet:'Diet agent', exercise:'Exercise agent' }
export default function AssistantChat({ agent, prompts }: { agent: Agent; prompts: string[] }) {
  const [conversations, setConversations] = useState<{ id:number; title:string; updated_at:string }[]>([])
  const [active, setActive] = useState<Conversation | null>(null)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [providerMode, setProviderMode] = useState(false)
  const [privacyNotice, setPrivacyNotice] = useState('')
  const bottom = useRef<HTMLDivElement>(null)
  useEffect(() => {
    setLoading(true); setActive(null); setError('')
    assistantApi.list(agent).then(async items => {
      setConversations(items)
      if (items.length) setActive(await assistantApi.get(items[0].id))
    }).catch(err => setError(err.message)).finally(() => setLoading(false))
  }, [agent])
  useEffect(() => { assistantApi.status().then(result => { setProviderMode(result.external_processing); setPrivacyNotice(result.notice) }).catch(() => undefined) }, [])
  useEffect(() => { bottom.current?.scrollIntoView({ behavior:'smooth', block:'end' }) }, [active?.messages.length, sending])
  async function newConversation() { setError(''); try { const item = await assistantApi.create(agent); setActive(item); setConversations(items => [item, ...items]) } catch (err) { setError(err instanceof Error ? err.message : 'Could not start a conversation.') } }
  async function selectConversation(id: number) { setError(''); try { setActive(await assistantApi.get(id)) } catch (err) { setError(err instanceof Error ? err.message : 'Could not load this conversation.') } }
  async function send(event?: FormEvent) {
    event?.preventDefault()
    const content = text.trim()
    if (!content || sending) return
    setText(''); setError(''); setSending(true)
    try {
      let conversation = active
      if (!conversation) conversation = await assistantApi.create(agent)
      const result = await assistantApi.send(conversation.id, content)
      setActive(result.conversation)
      setConversations(items => [result.conversation, ...items.filter(item => item.id !== conversation!.id)])
    } catch (err) { setText(content); setError(err instanceof Error ? err.message : 'Message could not be sent. Please retry.') }
    finally { setSending(false) }
  }
  const greeting = agent === 'records' ? 'Ask a question about your uploaded records.' : agent === 'diet' ? 'What would you like to explore about everyday food?' : 'What kind of movement would you like to explore?'
  return <section className="assistant-workspace"><aside className="conversation-sidebar"><button className="new-chat-button" onClick={newConversation}><Plus size={15} /> New conversation</button><span className="conversation-caption">RECENT CONVERSATIONS</span>{conversations.length ? conversations.map(item => <button key={item.id} className={`conversation-item ${active?.id === item.id ? 'conversation-item-active' : ''}`} onClick={() => selectConversation(item.id)}><span className="conversation-item-icon"><Bot size={15} /></span><span><b>{item.title}</b><small>{new Date(item.updated_at).toLocaleDateString()}</small></span></button>) : <p className="conversation-empty">Your conversations will appear here.</p>}<div className="conversation-privacy"><span><Sparkles size={14} /></span><p>Replies are educational and may be incomplete. Check original records and ask a professional about health decisions.</p></div></aside>
    <div className="chat-panel"><div className="chat-panel-head"><span className={`chat-agent-icon chat-agent-${agent}`}><Bot size={17} /></span><div><b>{titles[agent]}</b><small>{agent === 'records' ? 'Answers grounded in your own records' : 'General educational guidance'}</small></div><span className={`chat-mode-badge ${providerMode ? 'provider-badge' : ''}`}><span /> {providerMode ? 'External AI enabled' : 'Local demo mode'}</span></div>{providerMode && privacyNotice && <div className="provider-notice"><Sparkles size={13} /> {privacyNotice}</div>}
      <div className="chat-messages">{loading ? <div className="chat-state"><LoaderCircle className="spin" size={17} /> Loading conversations…</div> : !active?.messages.length ? <div className="chat-welcome"><span className="chat-welcome-icon"><Sparkles size={21} /></span><h2>{greeting}</h2><p>{agent === 'records' ? 'I’ll look for relevant excerpts first, then show you the source document. If your records don’t contain an answer, I’ll say so.' : 'Share your preferences or goals for practical, non-clinical suggestions.'}</p><div className="suggested-prompts">{prompts.map(prompt => <button key={prompt} onClick={() => setText(prompt)}>{prompt}<ArrowUp size={13} /></button>)}</div></div> : active.messages.map(message => <Message key={message.id} message={message} />)}{sending && <div className="message-row assistant-row"><span className="message-avatar"><Bot size={14} /></span><div className="message-bubble assistant-bubble chat-typing"><LoaderCircle className="spin" size={15} /> Thinking through your question…</div></div>}<div ref={bottom} /></div>
      {error && <div className="chat-error" role="alert">{error}</div>}
      <form className="chat-compose" onSubmit={send}><textarea value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send() } }} placeholder={agent === 'records' ? 'Ask about the information in your records…' : 'Type your question…'} maxLength={2000} rows={2} /><div className="chat-compose-foot"><span>{agent === 'records' ? 'Uses only your account’s uploaded documents.' : 'General education only · Not medical advice'}</span><button type="submit" className="send-button" disabled={!text.trim() || sending} aria-label="Send message">{sending ? <LoaderCircle className="spin" size={16} /> : <ArrowUp size={17} />}</button></div></form>
    </div></section>
}

function Message({ message }: { message: ChatMessage }) {
  const user = message.role === 'user'
  return <div className={`message-row ${user ? 'user-row' : 'assistant-row'}`}><span className="message-avatar">{user ? <UserRound size={14} /> : <Bot size={14} />}</span><div className="message-content"><div className={`message-bubble ${user ? 'user-bubble' : 'assistant-bubble'}`}>{message.content}</div>{!user && <><span className="message-mode">{message.mode === 'provider' ? 'AI provider response · verify against your sources' : 'Local demo response · no external model used'}</span>{message.citations.length > 0 && <div className="message-citations"><b>Sources from your records</b>{message.citations.map((source, i) => <Link key={`${source.document_id}-${i}`} to={`/records/${source.document_id}/review`}><FileText size={13} /><span>{source.name}{source.page ? ` · page ${source.page}` : ''}</span><small>{source.status === 'reviewed' ? 'Reviewed' : 'Not reviewed'}</small></Link>)}</div>}</>}</div></div>
}
