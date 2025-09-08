import Link from "next/link"
import type { Metadata } from "next"
import SignupForm from "./sign-form"
import LogoDisplay from "@/components/auth/logo-display"

export const metadata: Metadata = {
  title: "Sign Up | Real Estate",
  description: "Create a new account to access our real estate services",
}

export default function SignupPage() {
  return (
    <div className="min-h-screen flex flex-col md:flex-row pt-16">
              {/* Left side - Image */}
        <div className="hidden md:block w-1/2 bg-slate-100 relative">
          <div className="absolute inset-0">
            <img src="/modern-beach-house.png" alt="Luxury Real Estate" className="object-cover w-full h-full" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/50 to-slate-900/30"></div>
          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Join Our Community</h2>
            <p className="text-white/90 max-w-md">
              Create an account to save your favorite properties, receive personalized recommendations, and stay updated
              on the latest listings.
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-4 md:p-8 lg:p-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="inline-block">
              <div className="relative h-10 w-40 mx-auto">
                <LogoDisplay 
                  fill 
                  className="object-contain" 
                />
              </div>
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold mt-6 text-slate-900 dark:text-slate-100">Create an Account</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">Sign up to start your real estate journey</p>
          </div>

          <SignupForm />

          <div className="mt-8 text-center">
            <p className="text-slate-600 dark:text-slate-400">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-slate-900 dark:text-slate-100 font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
