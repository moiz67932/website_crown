import { supaServer } from '@/lib/supabase'
import type { ChatUISpec } from '@/lib/ui-spec'

export async function ensureSessionForUser(userId: string): Promise<string> {
  const supa = supaServer()
  const { data } = await supa
    .from('chat_sessions')
    .select('id')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (data?.id) return data.id
  const { data: ins, error } = await supa
    .from('chat_sessions')
    .insert({ user_id: userId, title: 'Chat with Majid Real Estate', dialog_state: {} })
    .select('id')
    .single()
  if (error) throw error
  return ins.id
}

export async function appendMessage(sessionId: string, role: 'user' | 'assistant' | 'system', content: ChatUISpec | { text: string }) {
  const supa = supaServer()
  await supa.from('chat_messages').insert({ session_id: sessionId, role, content })
}

export async function loadSessionMessages(sessionId: string) {
  const supa = supaServer()
  const { data } = await supa
    .from('chat_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
  return data || []
}

export async function getDialogState(sessionId: string): Promise<any> {
  const supa = supaServer()
  const { data } = await supa
    .from('chat_sessions')
    .select('dialog_state')
    .eq('id', sessionId)
    .maybeSingle()
  return (data?.dialog_state as any) || { awaiting: 'none' }
}

export async function updateDialogState(sessionId: string, patch: any) {
  const supa = supaServer()
  const { data } = await supa
    .from('chat_sessions')
    .select('dialog_state')
    .eq('id', sessionId)
    .maybeSingle()
  const current = (data?.dialog_state as any) || {}
  const next = { ...current, ...patch }
  await supa.from('chat_sessions').update({ dialog_state: next }).eq('id', sessionId)
  return next
}
