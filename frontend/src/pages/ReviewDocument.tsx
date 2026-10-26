import { useEffect, useState, type FormEvent } from 'react'
import { ArrowLeft, Check, Download, FileText, LoaderCircle, Plus, RefreshCw, Save, Trash2 } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { documentsApi, type MedicalDocument } from '../services/api'

type Lab = { name: string; value: string; unit: string; reference_range: string; source_text?: string }
const categories = [{ value:'prescription', label:'Prescription' }, { value:'laboratory_report', label:'Laboratory report' }, { value:'discharge_summary', label:'Discharge summary' }, { value:'other', label:'Other medical document' }]
export default function ReviewDocument() {
  const { id } = useParams()
  const documentId = Number(id)
  const [document, setDocument] = useState<MedicalDocument | null>(null)
  const [date, setDate] = useState('')
  const [patient, setPatient] = useState('')
  const [doctor, setDoctor] = useState('')
  const [category, setCategory] = useState('other')
  const [medications, setMedications] = useState('')
  const [labs, setLabs] = useState<Lab[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [retrying, setRetrying] = useState(false)
  const navigate = useNavigate()
  useEffect(() => { documentsApi.get(documentId).then(doc => {
    setDocument(doc)
    const data = doc.structured_data
    setDate(typeof data.document_date === 'string' ? data.document_date : '')
    setPatient(typeof data.patient_name === 'string' ? data.patient_name : '')
    setDoctor(typeof data.doctor_or_facility === 'string' ? data.doctor_or_facility : '')
    setCategory(doc.type)
    setMedications(Array.isArray(data.medication_mentions) ? data.medication_mentions.map(String).join('\n') : '')
    setLabs(Array.isArray(data.laboratory_results) ? data.laboratory_results as Lab[] : [])
  }).catch(err => setError(err.message)) }, [documentId])
  async function save(e: FormEvent) {
    e.preventDefault()
    if (!document) return
    setBusy(true); setError('')
    try { await documentsApi.review(document.id, { ...document.structured_data, document_date: date || null, patient_name: patient || null, doctor_or_facility: doctor || null, category, medication_mentions: medications.split('\n').map(x => x.trim()).filter(Boolean), laboratory_results: labs }) ; navigate('/records') }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not save your review.') }
    finally { setBusy(false) }
  }
  function updateLab(index: number, key: keyof Lab, value: string) { setLabs(items => items.map((lab, i) => i === index ? { ...lab, [key]: value } : lab)) }
  async function retryExtraction() { if (!document) return; setRetrying(true); setError(''); try { await documentsApi.retry(document.id); window.location.reload() } catch (err) { setError(err instanceof Error ? err.message : 'Could not retry extraction.') } finally { setRetrying(false) } }
  if (!document && !error) return <div className="records-loading"><LoaderCircle className="spin" size={18} /> Loading document…</div>
  return <div className="review-page"><Link className="back-link" to="/records"><ArrowLeft size={15} /> Back to medical records</Link><div className="page-title-row review-title"><div><span className="page-eyebrow">DOCUMENT REVIEW</span><h1>Check extracted details</h1><p>Correct anything that doesn’t match your source document.</p></div>{document && <a className="button button-outline button-small" href={documentsApi.fileUrl(document.id, 'attachment')}><Download size={14} /> Download original</a>}</div>{error && <div className="form-error" role="alert">{error}</div>}
    {document && <div className="review-layout"><form onSubmit={save} className="panel review-form"><div className="review-doc-heading"><span className="record-file-icon"><FileText size={17} /></span><div><b>{document.name}</b><small>{document.status === 'reviewed' ? 'Previously reviewed' : 'Please verify the details below'}</small></div><span className={`status-badge ${document.status === 'reviewed' ? 'status-badge-green' : 'status-badge-amber'}`}>{document.status === 'reviewed' ? 'Reviewed' : 'Needs review'}</span></div>{document.warnings.length > 0 && <div className="extraction-warning">{document.warnings.map(warning => <p key={warning}>{warning}</p>)}<button type="button" className="retry-extraction-button" onClick={retryExtraction} disabled={retrying}>{retrying ? <LoaderCircle className="spin" size={12} /> : <RefreshCw size={12} />}{retrying ? "Retrying…" : "Retry extraction"}</button></div>}
      <div className="review-section-title"><span>01</span><div><b>Document information</b><small>We leave details blank when they aren’t clear in the source.</small></div></div><div className="review-fields"><label>Document date<input value={date} onChange={e => setDate(e.target.value)} placeholder="Not found in the document" /></label><label>Document type<select value={category} onChange={e => setCategory(e.target.value)}>{categories.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><label>Patient name<input value={patient} onChange={e => setPatient(e.target.value)} placeholder="Not found in the document" /></label><label>Doctor or facility<input value={doctor} onChange={e => setDoctor(e.target.value)} placeholder="Not found in the document" /></label></div>
      <div className="review-section-title review-labs-title"><span>02</span><div><b>Laboratory results</b><small>Only enter values shown in the original document.</small></div><button type="button" className="add-lab-button" onClick={() => setLabs(items => [...items, { name:'', value:'', unit:'', reference_range:'' }])}><Plus size={14} /> Add result</button></div>{labs.length === 0 ? <p className="no-labs">No laboratory results were identified. You can add a result from the source document.</p> : <div className="labs-editor">{labs.map((lab, index) => <div className="lab-edit-row" key={index}><input aria-label="Test name" value={lab.name} onChange={e => updateLab(index,'name',e.target.value)} placeholder="Test name" /><input aria-label="Value" value={lab.value} onChange={e => updateLab(index,'value',e.target.value)} placeholder="Value" /><input aria-label="Unit" value={lab.unit} onChange={e => updateLab(index,'unit',e.target.value)} placeholder="Unit" /><input aria-label="Reference range" value={lab.reference_range} onChange={e => updateLab(index,'reference_range',e.target.value)} placeholder="Reference range" /><button type="button" className="icon-action icon-delete" aria-label="Remove result" onClick={() => setLabs(items => items.filter((_, i) => i !== index))}><Trash2 size={14} /></button></div>)}</div>}
      <label className="medication-label">Medication mentions<textarea value={medications} onChange={e => setMedications(e.target.value)} placeholder="Add medication names exactly as written, one per line" rows={3} /></label><div className="review-form-footer"><span><Check size={14} /> You can update this information later.</span><button className="button button-primary" type="submit" disabled={busy}>{busy ? <><LoaderCircle className="spin" size={15} /> Saving…</> : <><Save size={15} /> Save as reviewed</>}</button></div></form>
      <aside className="panel source-panel"><div className="source-title"><FileText size={16} /><div><b>Extracted text</b><small>From your original document</small></div></div>{document.extracted_text ? <pre>{document.extracted_text}</pre> : <div className="source-empty"><FileText size={22} /><b>No text could be extracted</b><p>Check the original file and enter details manually.</p></div>}<a className="source-download" href={documentsApi.fileUrl(document.id)} target="_blank" rel="noreferrer">Open original document <Download size={14} /></a></aside></div>}
  </div>
}
