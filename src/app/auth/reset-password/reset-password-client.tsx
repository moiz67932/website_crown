"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import ResetPasswordForm from './reset-password-form'
import UpdatePasswordForm from './update-password-form'

export default function ResetPasswordClient() {
  const [isRecovery, setIsRecovery] = useState(false)
  useEffect(() => {
    const hash = window.location.hash
    if (hash && /type=recovery/.test(hash)) setIsRecovery(true)
  }, [])
  return (
    <>
      <h1 className="text-2xl md:text-3xl font-bold mt-6 text-slate-900 dark:text-slate-100">
        {isRecovery ? 'Set New Password' : 'Reset Password'}
      </h1>
      <p className="text-slate-600 dark:text-slate-400 mt-2">
        {isRecovery ? 'Enter a new password to complete the reset.' : 'Enter your email to receive a reset link'}
      </p>
      <div className="mt-8">
        {isRecovery ? <UpdatePasswordForm /> : <ResetPasswordForm />}
      </div>
      <div className="mt-8 text-center">
        <p className="text-slate-600 dark:text-slate-400">
          {isRecovery ? 'Return to login? ' : 'Remember your password? '}
          <Link href="/auth/login" className="text-slate-900 dark:text-slate-100 font-medium hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    </>
  )
}
