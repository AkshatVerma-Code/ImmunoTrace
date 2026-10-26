import { useEffect, useState } from 'react'
import { ArrowDownWideNarrow, ArrowRight, Check, Download, Eye, FileText, LoaderCircle, Search, Trash2, UploadCloud, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { documentsApi, type MedicalDocument } from '../services/api'

const categoryLabels: Record<string, string> = { prescription: 'Prescription', laboratory_report: 'Laboratory report', discharge_summary: 'Discharge summary', other: 'Other medical document' }

export default function Records() {
  const [documents, setDocuments] = useState<MedicalDocument[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('')
  const [sort, setSort] = useState('newest')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    let alive = true
    const timer = setTimeout(() => {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.set('q', search)
      if (category) params.set('category', category)
      if (status) params.set('status', status)
      params.set('sort', sort)
      documentsApi.list(params.toString()).then(data => { if (alive) { setDocuments(data); setError('') } })
        .catch(err => { if (alive) setError(err.message) }).finally(() => { if (alive) setLoading(false) })
    }, search ? 200 : 0)
    return () => { alive = false; clearTimeout(timer) }
  }, [search, category, status, sort])
  async function remove() {
    if (deleteId === null) return
    setBusy(true)
    try { await documentsApi.remove(deleteId); setDocuments(items => items.filter(item => item.id !== deleteId)); setDeleteId(null) }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not delete this document.') }
    finally { setBusy(false) }
  }
  return <div className="records-page">
    <div className="page-title-row"><div><span className="page-eyebrow">YOUR HEALTHSPACE</span><h1>Medical records</h1><p>Keep your documents together and review the details we can read.</p></div><Link className="button button-primary" to="/upload"><UploadCloud size={16} /> Upload document</Link></div>
    <section className="panel records-panel">
      <div className="records-toolbar"><label className="search-input"><Search size={16} /><input aria-label="Search documents" placeholder="Search by document name…" value={search} onChange={e => setSearch(e.target.value)} /></label><select aria-label="Filter by document type" value={category} onChange={e => setCategory(e.target.value)}><option value="">All document types</option>{Object.entries(categoryLabels).map(([value,label]) => <option value={value} key={value}>{label}</option>)}</select><select aria-label="Filter by processing status" value={status} onChange={e => setStatus(e.target.value)}><option value="">All statuses</option><option value="needs_review">Needs review</option><option value="reviewed">Reviewed</option></select><button className="sort-button" onClick={() => setSort(value => value === 'newest' ? 'oldest' : 'newest')}><ArrowDownWideNarrow size={15} /> {sort === 'newest' ? 'Newest first' : 'Oldest first'}</button></div>
      {error && <div className="inline-notice records-error" role="alert"><span>{error}</span><button onClick={() => setError('')} aria-label="Dismiss"><X size={15} /></button></div>}
      {loading ? <div className="records-loading"><LoaderCircle className="spin" size={18} /> Loading your records…</div> : documents.length === 0 ? <div className="records-empty"><span className="empty-icon"><FileText size={22} /></span><h2>{search || category || status ? 'No matching documents' : 'Your records start here'}</h2><p>{search || category || status ? 'Try changing your search or filters.' : 'Upload a prescription or report to start building your health history.'}</p>{!search && !category && !status && <Link className="button button-outline button-small" to="/upload"><UploadCloud size={15} /> Upload a document</Link>}</div> : <div className="records-table-wrap"><table className="records-table"><thead><tr><th>DOCUMENT</th><th>TYPE</th><th>UPLOADED</th><th>STATUS</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{documents.map(document => <tr key={document.id}><td><span className="record-file-icon"><FileText size={16} /></span><span className="record-name"><b>{document.name}</b><small>{document.content_type}</small></span></td><td>{categoryLabels[document.type] ?? categoryLabels.other}</td><td>{document.uploaded_at ? new Date(document.uploaded_at).toLocaleDateString() : '—'}</td><td><span className={`status-badge ${document.status === 'reviewed' ? 'status-badge-green' : 'status-badge-amber'}`}>{document.status === 'reviewed' ? <Check size={12} /> : <span className="badge-dot" />}{document.status === 'reviewed' ? 'Reviewed' : document.status === 'needs_review' ? 'Needs review' : document.status}</span></td><td><div className="row-actions"><a className="icon-action" title="Preview original" aria-label={`Preview ${document.name}`} href={documentsApi.fileUrl(document.id)} target="_blank" rel="noreferrer"><Eye size={15} /></a><a className="icon-action" title="Download original" aria-label={`Download ${document.name}`} href={documentsApi.fileUrl(document.id, 'attachment')}><Download size={15} /></a><Link className="icon-action" title="Review details" aria-label={`Review ${document.name}`} to={`/records/${document.id}/review`}><ArrowRight size={15} /></Link><button className="icon-action icon-delete" title="Delete document" aria-label={`Delete ${document.name}`} onClick={() => setDeleteId(document.id)}><Trash2 size={15} /></button></div></td></tr>)}</tbody></table></div>}
      <div className="records-count">{documents.length} {documents.length === 1 ? 'document' : 'documents'}</div>
    </section>
    {deleteId !== null && <div className="modal-scrim" role="presentation"><section className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-title"><span className="confirm-icon"><Trash2 size={19} /></span><h2 id="delete-title">Delete this document?</h2><p>The uploaded file and its extracted information will be permanently removed from your account.</p><div className="dialog-actions"><button className="button button-outline" onClick={() => setDeleteId(null)} disabled={busy}>Keep document</button><button className="button button-danger" onClick={remove} disabled={busy}>{busy ? 'Deleting…' : 'Delete document'}</button></div></section></div>}
  </div>
}
