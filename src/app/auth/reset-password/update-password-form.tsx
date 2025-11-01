"use client"

import { useState } from 'react'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Alert, AlertDescription } from '../../../components/ui/alert'
import { Loader2 } from 'lucide-react'
import { supaBrowser } from '@/lib/supabase'

/**
 * Form for completing password reset after user clicks the Supabase recovery link.
 * Supabase provides an access token in the hash (#access_token=...&type=recovery).
 * Once on this page with type=recovery, we can call auth.updateUser({ password }).
 */
export default function UpdatePasswordForm() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setIsLoading(true)
    try {
      let supabase
      try { supabase = supaBrowser() } catch {
        setError('Client not configured.'); return
      }
      const { error } = await supabase.auth.updateUser({ password })
      if (error) {
        setError(error.message || 'Failed to update password')
        return
      }
      setSuccess(true)
      setPassword('')
      setConfirm('')
    } catch {
      setError('Unexpected error. Try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive" className="bg-red-50 text-red-800 border-red-200">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="bg-green-50 text-green-800 border-green-200">
          <AlertDescription>Password updated successfully. You can now log in with your new password.</AlertDescription>
        </Alert>
      )}
      {!success && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm Password</Label>
            <Input
              id="confirm"
              type="password"
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <Button type="submit" className="w-full bg-slate-800 hover:bg-slate-900" disabled={isLoading}>
            {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...</>) : 'Update Password'}
          </Button>
        </form>
      )}
    </div>
  )
}
