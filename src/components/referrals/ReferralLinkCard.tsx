"use client"
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Share2, Copy, QrCode } from 'lucide-react'
import { useState } from 'react'

export default function ReferralLinkCard({ code }:{ code: string | null }){
  const [copied, setCopied] = useState(false)
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const shareUrl = code ? `${origin}/?ref=${encodeURIComponent(code)}` : ''

  const doCopy = async () => {
    if (!shareUrl) return
    try { await navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(()=>setCopied(false), 1500) } catch {}
  }

  return (
    <Card className="shadow-sm rounded-2xl">
      <CardHeader>
        <CardTitle className="text-base">Share your link</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {code ? (
          <div className="flex flex-col sm:flex-row gap-2">
            <Input readOnly value={shareUrl} aria-label="Your referral link" className="font-mono" />
            <div className="flex gap-2">
              <Button onClick={doCopy} aria-live="polite" aria-label="Copy referral link" variant="secondary"><Copy className="h-4 w-4 mr-2" />{copied?'Copied':'Copy'}</Button>
              <Button variant="secondary" aria-label="Share">
                <Share2 className="h-4 w-4 mr-2" /> Share
              </Button>
              <Button variant="secondary" aria-label="QR code">
                <QrCode className="h-4 w-4 mr-2" /> QR
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Log in to get your referral code.</p>
        )}
        <p className="text-xs text-muted-foreground">Please share responsibly. Referrals should be from friends or genuine audiences. Abuse may result in disqualification.</p>
      </CardContent>
    </Card>
  )
}
