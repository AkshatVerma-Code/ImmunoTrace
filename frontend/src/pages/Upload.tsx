import { useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from 'react'
import { ArrowLeft, CheckCircle2, FileImage, FileText, LoaderCircle, UploadCloud, X } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { documentsApi } from '../services/api'

const MAX_BYTES = 15 * 1024 * 1024
const allowed = ['application/pdf', 'image/jpeg', 'image/png']
export default function Upload() {
  const input = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [category, setCategory] = useState('other')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [dragging, setDragging] = useState(false)
  const navigate = useNavigate()
  function choose(candidate?: File) {
    if (!candidate) return
    setError('')
    if (!allowed.includes(candidate.type) || !/\.(pdf|jpe?g|png)$/i.test(candidate.name)) { setError('Choose a PDF, JPG, or PNG file.'); return }
    if (candidate.size > MAX_BYTES) { setError('This file is larger than 15 MB. Choose a smaller document.'); return }
    setFile(candidate)
  }
  function onFile(e: ChangeEvent<HTMLInputElement>) { choose(e.target.files?.[0]) }
  function onDrop(e: DragEvent) { e.preventDefault(); setDragging(false); choose(e.dataTransfer.files[0]) }
  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!file) { setError('Choose a document to upload.'); return }
    setBusy(true); setError('')
    try { const document = await documentsApi.upload(file, category); navigate(`/records/${document.id}/review`, { state: { justUploaded: true } }) }
    catch (err) { setError(err instanceof Error ? err.message : 'Upload failed. Please try again.') }
    finally { setBusy(false) }
  }
  return <div className="upload-page"><Link className="back-link" to="/records"><ArrowLeft size={15} /> Back to medical records</Link><div className="upload-heading"><span className="page-eyebrow">ADD TO YOUR HEALTHSPACE</span><h1>Upload a document</h1><p>We’ll save your original, then help you review the details we can read.</p></div>
    <form onSubmit={submit} className="upload-form"><section className="panel upload-panel"><div className="upload-step"><span>01</span><div><b>Choose your file</b><small>PDF, JPG, or PNG · Up to 15 MB</small></div></div><div className={`drop-zone ${dragging ? 'drop-zone-active' : ''}`} onDragOver={e => { e.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={onDrop}><input ref={input} type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={onFile} hidden /><span className="upload-cloud-icon"><UploadCloud size={22} /></span><b>Drag your document here</b><span>or <button type="button" className="browse-button" onClick={() => input.current?.click()}>browse files</button> from your device</span><small>Your file stays private to your account.</small></div>{file && <div className="selected-file"><span className="selected-file-icon">{file.type === 'application/pdf' ? <FileText size={17} /> : <FileImage size={17} />}</span><span><b>{file.name}</b><small>{(file.size / 1024 / 1024).toFixed(2)} MB · Ready to upload</small></span><button type="button" onClick={() => { setFile(null); if (input.current) input.current.value = '' }} aria-label="Remove selected file"><X size={16} /></button></div>}<label className="upload-select-label" htmlFor="category">Document type <span>Choose the closest match</span></label><select id="category" value={category} onChange={e => setCategory(e.target.value)}><option value="prescription">Prescription</option><option value="laboratory_report">Laboratory report</option><option value="discharge_summary">Discharge summary</option><option value="other">Other medical document</option></select>{error && <div className="form-error upload-error" role="alert">{error}</div>}<div className="upload-actions"><Link className="button button-quiet" to="/records">Cancel</Link><button className="button button-primary" type="submit" disabled={!file || busy}>{busy ? <><LoaderCircle className="spin" size={16} /> Processing…</> : <><UploadCloud size={16} /> Upload and continue</>}</button></div></section><aside className="upload-note"><span><CheckCircle2 size={17} /></span><div><b>What happens next?</b><p>We’ll try to read text from your document. You can correct any details before saving them as reviewed information.</p></div></aside><p className="medical-note">ImmunoTrace organizes records for personal reference. Extracted details may be incomplete; use the original document as your source.</p></form>
  </div>
}
