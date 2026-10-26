const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export type User = { username: string }
export type MedicalDocument = {
  id: number; name: string; type: string; status: string; content_type: string
  uploaded_at: string; extracted_text: string; structured_data: Record<string, unknown>
  reviewed: boolean; warnings: string[]
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init.headers },
  })
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.detail ?? 'Something went wrong. Please try again.')
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export const authApi = {
  me: () => request<{ user: User }>('/api/auth/me'),
  login: (username: string, password: string) => request<{ user: User }>('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  register: (username: string, password: string) => request<{ user: User }>('/api/auth/register', { method: 'POST', body: JSON.stringify({ username, password }) }),
  logout: () => request<void>('/api/auth/logout', { method: 'POST' }),
}

export const documentsApi = {
  list: (params = '') => request<MedicalDocument[]>(`/api/documents${params ? `?${params}` : ''}`),
  get: (id: number) => request<MedicalDocument>(`/api/documents/${id}`),
  upload: async (file: File, category: string): Promise<MedicalDocument> => {
    const body = new FormData()
    body.append('file', file)
    body.append('category', category)
    const response = await fetch(`${API_URL}/api/documents`, { method: 'POST', body, credentials: 'include' })
    if (!response.ok) { const detail = await response.json().catch(() => ({})); throw new Error(detail.detail ?? 'Upload failed. Please try again.') }
    return response.json()
  },
  review: (id: number, fields: Record<string, unknown>) => request<MedicalDocument>(`/api/documents/${id}/review`, { method: 'PATCH', body: JSON.stringify(fields) }),
  retry: (id: number) => request<MedicalDocument>(`/api/documents/${id}/retry`, { method: 'POST' }),
  remove: (id: number) => request<void>(`/api/documents/${id}`, { method: 'DELETE' }),
  fileUrl: (id: number, disposition: 'inline' | 'attachment' = 'inline') => `${API_URL}/api/documents/${id}/file?disposition=${disposition}`,
  dashboard: () => request<{ total_documents: number; reviewed_documents: number; pending_review: number; latest_summary_update: string | null; recent_documents: MedicalDocument[] }>('/api/dashboard'),
}

export type MedicalSummaryData = {
  id: number | null; created_at: string | null; content: {
    overview: { reviewed_documents: number; message: string }
    timeline: { date: string | null; category: string; source: { document_id: number; name: string }; laboratory_results: { name: string; value: string; unit: string; reference_range: string }[]; medication_mentions: string[] }[]
    documents: { source: { document_id: number; name: string }; document_date: string | null; category: string; patient_name: string | null; laboratory_results: { name: string; value: string; unit: string; reference_range: string }[]; medication_mentions: string[]; doctor_or_facility: string | null }[]
    missing_or_uncertain: { source: { document_id: number; name: string }; details: string[]; date_candidates?: string[] }[]
    review_flags: { kind: string; sources: { document_id: number; name: string }[]; details: string }[]
    limitations: string[]
  } | null
}

export const summaryApi = {
  get: () => request<MedicalSummaryData>('/api/summary'),
  regenerate: () => request<MedicalSummaryData>('/api/summary/regenerate', { method: 'POST' }),
  downloadUrl: () => `${API_URL}/api/summary/download`,
}

export type ChatMessage = { id: number; role: 'user' | 'assistant'; agent: string; mode: string; content: string; citations: { document_id: number; name: string; page: number | null; status: string; excerpt: string }[]; created_at: string }
export type Conversation = { id: number; agent: string; title: string; created_at: string; updated_at: string; messages: ChatMessage[] }
export const assistantApi = {
  status: () => request<{ mode: string; external_processing: boolean; notice: string }>('/api/assistant/status'),
  list: (agent: string) => request<Omit<Conversation, 'messages'>[]>(`/api/assistant/${agent}/conversations`),
  create: (agent: string) => request<Conversation>(`/api/assistant/${agent}/conversations`, { method: 'POST' }),
  get: (id: number) => request<Conversation>(`/api/assistant/conversations/${id}`),
  send: (id: number, content: string) => request<{ conversation: Conversation; reply: ChatMessage }>(`/api/assistant/conversations/${id}/messages`, { method: 'POST', body: JSON.stringify({ content }) }),
  remove: (id: number) => request<void>(`/api/assistant/conversations/${id}`, { method: 'DELETE' }),
}

export type Profile = { username: string; created_at: string; dietary_preferences: string[]; activity_preferences: string[]; external_ai_processing: boolean; privacy_notice: string }
export const profileApi = {
  get: () => request<Profile>('/api/profile'),
  savePreferences: (dietary_preferences: string[], activity_preferences: string[]) => request('/api/profile/preferences', { method: 'PUT', body: JSON.stringify({ dietary_preferences, activity_preferences }) }),
  changePassword: (current_password: string, new_password: string) => request<void>('/api/profile/password', { method: 'POST', body: JSON.stringify({ current_password, new_password }) }),
  deleteDocuments: () => request<void>('/api/profile/documents', { method: 'DELETE' }),
  deleteAccount: () => request<void>('/api/profile', { method: 'DELETE' }),
}
