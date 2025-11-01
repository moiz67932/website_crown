import Link from "next/link"
import type { Metadata } from "next"
import ResetPasswordClient from "./reset-password-client"
import LogoDisplay from "../../../components/auth/logo-display"

export const metadata: Metadata = {
  title: "Reset Password | Real Estate",
  description: "Request a password reset email for your account",
}


export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center pt-16 p-4 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 shadow-md rounded-xl p-6">
        <div className="text-center mb-4">
          <Link href="/" className="inline-block">
            <div className="relative h-10 w-40 mx-auto">
              <LogoDisplay fill className="object-contain" />
            </div>
          </Link>
        </div>
        {/* Client section */}
        <ResetPasswordClient />
      </div>
    </div>
  )
}
