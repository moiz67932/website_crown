"use client"
import useSWR from 'swr'

export function useReferralStats(){
  const { data, isLoading, mutate, error } = useSWR('/api/referrals/me', async (url: string) => {
    const r = await fetch(url, { cache: 'no-store' })
    if (!r.ok) throw new Error('failed')
    return r.json()
  })
  return { data, isLoading, mutate, error }
}

export function makeShareUrl(code?: string | null){
  if (!code) return ''
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  return `${origin}/?ref=${encodeURIComponent(code)}`
}
