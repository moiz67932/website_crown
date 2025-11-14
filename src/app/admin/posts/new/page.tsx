'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const templates = [
  'Top 10 Neighborhoods',
  'Moving to',
  'Market Predictions',
  'Best Schools',
  'Why [City] is Perfect for [Demographic]',
  'Local Events',
]

export default function NewPostGenerator() {
  const [city, setCity] = useState('')
  const [template, setTemplate] = useState(templates[0])
  const [keywords, setKeywords] = useState('')
  const [scheduleAt, setScheduleAt] = useState('')
  const [autoAttachProperties, setAutoAttach] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/content/generate', {
        method: 'POST', headers: { 'content-type':'application/json' },
        body: JSON.stringify({ city, template, keywords: splitKeywords(keywords), scheduleAt: scheduleAt || undefined, autoAttachProperties })
      })
      const j = await res.json()
      if (!j.ok) throw new Error(j.error || 'Error')
      router.push(`/admin/posts/${j.id}`)
    } catch (e:any) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100/50 p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Create New Post</h1>
          <p className="text-slate-600 mt-2">Generate AI-powered blog content for your real estate listings</p>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          <form onSubmit={submit} className="p-8 space-y-6">
            {/* City Input */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                City Name <span className="text-red-500">*</span>
              </label>
              <input 
                className="w-full border border-slate-300 rounded-lg px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
                value={city} 
                onChange={e=>setCity(e.target.value)} 
                placeholder="e.g., San Francisco, Miami, Austin"
                required 
              />
            </div>

            {/* Template Select */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Content Template
              </label>
              <select 
                className="w-full border border-slate-300 rounded-lg px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white cursor-pointer"
                value={template} 
                onChange={e=>setTemplate(e.target.value)}
              >
                {templates.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <p className="mt-2 text-sm text-slate-500">Choose a template that best fits your content goals</p>
            </div>

            {/* Keywords Input */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Keywords
              </label>
              <input 
                className="w-full border border-slate-300 rounded-lg px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
                value={keywords} 
                onChange={e=>setKeywords(e.target.value)} 
                placeholder="e.g., neighborhoods, schools, coastal, family-friendly"
              />
              <p className="mt-2 text-sm text-slate-500">Separate multiple keywords with commas</p>
            </div>

            {/* Schedule DateTime */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Schedule Publication <span className="text-slate-400 text-xs font-normal">(Optional)</span>
              </label>
              <input 
                type="datetime-local" 
                className="w-full border border-slate-300 rounded-lg px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
                value={scheduleAt} 
                onChange={e=>setScheduleAt(e.target.value)} 
              />
              <p className="mt-2 text-sm text-slate-500">Leave empty to save as draft</p>
            </div>

            {/* Auto-attach Checkbox */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <label className="inline-flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={autoAttachProperties} 
                  onChange={e=>setAutoAttach(e.target.checked)}
                  className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                />
                <div>
                  <span className="text-sm font-semibold text-slate-900">Auto-attach Properties</span>
                  <p className="text-xs text-slate-600 mt-0.5">Automatically link relevant property listings to this post</p>
                </div>
              </label>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="text-sm font-semibold text-red-800">Error</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-4 pt-4">
              <button 
                type="submit"
                disabled={!city || loading} 
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-0.5 disabled:shadow-none disabled:translate-y-0"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating Content...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Generate Post
                  </>
                )}
              </button>
              <button 
                type="button"
                onClick={() => window.history.back()}
                className="px-6 py-3 border-2 border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-3">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-sm font-semibold text-blue-900">AI-Powered Content Generation</h3>
              <p className="text-sm text-blue-800 mt-1">Our AI will create engaging, SEO-optimized content based on your selections. You can edit and refine the generated post before publishing.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function splitKeywords(s: string) { return s.split(',').map(v=>v.trim()).filter(Boolean) }
