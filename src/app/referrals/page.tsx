// 'use client'
// import { useEffect, useState } from 'react'

// export default function ReferralsPage() {
//   const [code, setCode] = useState<string | null>(null)
//   const [signupCount, setSignupCount] = useState<number>(0)
//   const [leadCount, setLeadCount] = useState<number>(0)
//   const [recentSignups, setRecentSignups] = useState<any[]>([])
//   const [recentLeads, setRecentLeads] = useState<any[]>([])

//   useEffect(() => {
//     (async () => {
//       try {
//         const r = await fetch('/api/referrals/me')
//         if (r.ok) {
//           const j = await r.json()
//           setCode(j.code || null)
//           setSignupCount(j.signup_count || 0)
//           setLeadCount(j.lead_count || 0)
//           setRecentSignups(j.recent_signups || [])
//           setRecentLeads(j.recent_leads || [])
//         }
//       } catch {}
//     })()
//   }, [])

//   return (
//     <main className="max-w-xl mx-auto p-6 space-y-4">
//       <h1 className="text-xl font-semibold">Referrals</h1>
//       {code ? (
//         <div className="space-y-4">
//           <div className="rounded border p-4">
//             <div className="text-sm text-gray-600">Your referral code:</div>
//             <div className="mt-2 font-mono text-lg">{code}</div>
//           </div>
//           <div className="rounded border p-4 text-sm text-gray-700 flex gap-6">
//             <div><b>{signupCount}</b><div className="text-xs text-gray-500">Signups</div></div>
//             <div><b>{leadCount}</b><div className="text-xs text-gray-500">Leads</div></div>
//           </div>
//           <div className="grid md:grid-cols-2 gap-4">
//             <div className="rounded border p-4">
//               <h2 className="font-medium mb-2 text-sm">Recent Signups</h2>
//               <ul className="space-y-1 text-xs max-h-56 overflow-auto">
//                 {recentSignups.map((s,i)=> <li key={i}>{s.referred_user_id} <span className="text-gray-400">{new Date(s.created_at).toLocaleDateString()}</span></li>)}
//                 {recentSignups.length===0 && <li className="text-gray-500">None yet</li>}
//               </ul>
//             </div>
//             <div className="rounded border p-4">
//               <h2 className="font-medium mb-2 text-sm">Recent Leads</h2>
//               <ul className="space-y-1 text-xs max-h-56 overflow-auto">
//                 {recentLeads.map((l,i)=> <li key={i}>{l.lead_email || l.lead_name || 'Lead'} <span className="text-gray-400">{new Date(l.created_at).toLocaleDateString()}</span></li>)}
//                 {recentLeads.length===0 && <li className="text-gray-500">None yet</li>}
//               </ul>
//             </div>
//           </div>
//         </div>
//       ) : <div className="rounded border p-4 text-sm text-gray-700">Log in or create an account to get your referral code.</div>}
//     </main>
//   )
// }









'use client'
import { useEffect, useState } from 'react'
import { Gift, Users, Mail } from 'lucide-react'

export default function ReferralsPage() {
  const [code, setCode] = useState<string | null>(null)
  const [signupCount, setSignupCount] = useState<number>(0)
  const [leadCount, setLeadCount] = useState<number>(0)
  const [recentSignups, setRecentSignups] = useState<any[]>([])
  const [recentLeads, setRecentLeads] = useState<any[]>([])

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/referrals/me')
        if (r.ok) {
          const j = await r.json()
          setCode(j.code || null)
          setSignupCount(j.signup_count || 0)
          setLeadCount(j.lead_count || 0)
          setRecentSignups(j.recent_signups || [])
          setRecentLeads(j.recent_leads || [])
        }
      } catch {}
    })()
  }, [])

  return (
    <main className="max-w-4xl mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">Referrals</h1>

      {code ? (
        <div className="space-y-8">
          {/* Referral Code */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl shadow-lg p-6 flex items-center justify-between">
            <div>
              <div className="text-sm opacity-80">Your referral code</div>
              <div className="mt-1 font-mono text-2xl tracking-wide">{code}</div>
            </div>
            <Gift className="w-10 h-10 opacity-90" />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-md p-6 flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-indigo-600">{signupCount}</p>
                <p className="text-sm text-gray-500">Signups</p>
              </div>
              <Users className="w-8 h-8 text-indigo-500" />
            </div>
            <div className="bg-white rounded-xl shadow-md p-6 flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-indigo-600">{leadCount}</p>
                <p className="text-sm text-gray-500">Leads</p>
              </div>
              <Mail className="w-8 h-8 text-indigo-500" />
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Recent Signups
              </h2>
              <ul className="space-y-3 max-h-64 overflow-auto">
                {recentSignups.map((s, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between border-b last:border-none pb-2"
                  >
                    <span className="font-mono text-sm text-gray-700">
                      {s.referred_user_id}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(s.created_at).toLocaleDateString()}
                    </span>
                  </li>
                ))}
                {recentSignups.length === 0 && (
                  <li className="text-gray-500 text-sm">No signups yet</li>
                )}
              </ul>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Recent Leads
              </h2>
              <ul className="space-y-3 max-h-64 overflow-auto">
                {recentLeads.map((l, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between border-b last:border-none pb-2"
                  >
                    <span className="text-sm text-gray-700">
                      {l.lead_email || l.lead_name || 'Lead'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(l.created_at).toLocaleDateString()}
                    </span>
                  </li>
                ))}
                {recentLeads.length === 0 && (
                  <li className="text-gray-500 text-sm">No leads yet</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-sm text-yellow-700 shadow-sm">
          Log in or create an account to get your referral code.
        </div>
      )}
    </main>
  )
}
