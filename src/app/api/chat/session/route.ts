import { ensureSessionForUser, loadSessionMessages } from '../../../../lib/chat/store'
import { SupabaseAuthService } from '../../../../lib/supabase-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    // @ts-ignore emulate NextRequest for our helper
    const user = await SupabaseAuthService.getCurrentUser({ headers: req.headers, cookies: { get: () => null } })
    if (!user?.userId) {
      return new Response(JSON.stringify({ messages: [] }), { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })
    }
    const sessionId = await ensureSessionForUser(user.userId)
    const messages = await loadSessionMessages(sessionId)
    return new Response(JSON.stringify({ sessionId, messages }), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })
  } catch (e: any) {
    return new Response(JSON.stringify({ messages: [] }), { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })
  }
}
