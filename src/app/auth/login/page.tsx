import Link from "next/link"
import type { Metadata } from "next"
import LoginForm from "./login-form"
import LogoDisplay from "../../../components/auth/logo-display"

export const metadata: Metadata = {
  title: "Login | Real Estate",
  description: "Login to your real estate account",
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col md:flex-row pt-16">
      {/* Left side - Form */}
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
            <h1 className="text-2xl md:text-3xl font-bold mt-6 text-slate-900 dark:text-slate-100">Welcome Back</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">Sign in to your account to continue</p>
          </div>

          <LoginForm />

          <div className="mt-8 text-center">
            <p className="text-slate-600 dark:text-slate-400">
              Don&apos;t have an account?{" "}
              <Link href="/auth/resgister" className="text-slate-900 dark:text-slate-100 font-medium hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>

              {/* Right side - Image */}
        <div className="hidden md:block w-1/2 bg-slate-100 relative">
          <div className="absolute inset-0">
            <img
              src="/luxury-modern-house-exterior.png"
              alt="Luxury Real Estate"
              className="object-cover w-full h-full"
            />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/50 to-slate-900/30"></div>
          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Find Your Dream Home</h2>
            <p className="text-white/90 max-w-md">
              Access your account to save favorite properties, receive updates, and manage your real estate journey.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
