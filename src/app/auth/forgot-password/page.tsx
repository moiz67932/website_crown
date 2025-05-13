import Image from "next/image"
import Link from "next/link"
import type { Metadata } from "next"
import ForgotPasswordForm from "./forgot-password-form"

export const metadata: Metadata = {
  title: "Forgot Password | Real Estate",
  description: "Reset your password for your real estate account",
}

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center pt-16 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <div className="relative h-10 w-40 mx-auto">
              <Image src="/real-estate-logo.png" alt="Real Estate Logo" fill className="object-contain" />
            </div>
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold mt-6 text-slate-900">Forgot Password</h1>
          <p className="text-slate-600 mt-2">Enter your email to reset your password</p>
        </div>

        <ForgotPasswordForm />

        <div className="mt-8 text-center">
          <p className="text-slate-600">
            Remember your password?{" "}
            <Link href="/login" className="text-slate-900 font-medium hover:underline">
              Back to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
