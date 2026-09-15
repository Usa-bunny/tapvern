"use client"

import { useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { Alert } from "@/components/ui/Alert"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const formattedEmail = username.includes("@") ? username : `${username.toLowerCase().replace(/\s/g, '')}@tapvern.local`

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: formattedEmail,
      password,
    })

    if (authError) {
      setError("Username atau password salah")
      setLoading(false)
    } else if (authData.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", authData.user.id)
        .single()

      if (profile?.role === "parent") {
        router.push("/parent")
      } else {
        router.push("/admin")
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-96 bg-linear-to-br from-blue-700 to-indigo-900 -skew-y-6 origin-top-left -z-10" />
      
      <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-2xl max-w-md w-full border border-gray-100 relative z-10">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3 border border-blue-100 shadow-inner">
            <svg className="w-8 h-8 -rotate-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">TapVern</h1>
          <p className="text-gray-500 mt-2 font-medium">Masuk ke Sistem Absensi</p>
        </div>

        <Alert message={error} />

        <form onSubmit={handleLogin} className="space-y-5 mt-6">
          <Input
            label="Username"
            type="text"
            required
            placeholder="Masukkan username..."
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          
          <Input
            label="Kata Sandi"
            type="password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div className="pt-2">
            <Button type="submit" isLoading={loading}>
              Masuk
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}