"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Processing your login...')

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Get tokens from URL hash (OAuth returns tokens in hash fragment)
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')

        if (!accessToken) {
          setStatus('error')
          setMessage('No authentication token found. Please try again.')
          setTimeout(() => {
            router.push('/auth/login')
          }, 3000)
          return
        }

        // Call our API endpoint to create session and set auth cookie
        const response = await fetch('/api/auth/oauth-callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            access_token: accessToken,
            refresh_token: refreshToken,
          }),
        })

        const result = await response.json()

        if (result.success && result.user) {
          setStatus('success')
          setMessage('Login successful! Redirecting to homepage...')
          
          // Redirect to homepage (not dashboard) for regular users
          setTimeout(() => {
            window.location.href = '/'
          }, 1500)
        } else {
          setStatus('error')
          setMessage(result.error || 'Failed to complete login')
          
          setTimeout(() => {
            router.push('/auth/login')
          }, 3000)
        }
      } catch (error: any) {
        console.error('[AuthCallback] Error:', error)
        setStatus('error')
        setMessage(error.message || 'An unexpected error occurred')
        
        setTimeout(() => {
          router.push('/auth/login')
        }, 3000)
      }
    }

    processCallback()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {status === 'loading' && (
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            )}
            {status === 'success' && (
              <CheckCircle className="h-12 w-12 text-green-500" />
            )}
            {status === 'error' && (
              <XCircle className="h-12 w-12 text-red-500" />
            )}
          </div>
          <CardTitle>
            {status === 'loading' && 'Completing Sign In'}
            {status === 'success' && 'Success!'}
            {status === 'error' && 'Login Failed'}
          </CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${
                  status === 'success' ? 'bg-green-500 w-full' :
                  status === 'error' ? 'bg-red-500 w-full' :
                  'bg-primary w-1/2 animate-pulse'
                }`}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
