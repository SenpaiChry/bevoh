import { useEffect, useState } from "react"
import { Mail, Lock, User, Eye, EyeOff, ArrowRight } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AuthModel } from "@/models/auth-models"

const API_BASE = "https://bevoh.altervista.org/api"

async function apiJson<T>(path: string, body?: any): Promise<T> {
  const url = `${API_BASE}${path}`

  const res = await fetch(url, {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  })

  const text = await res.text()
  let data: any = {}
  try {
    data = JSON.parse(text)
  } catch { }

  if (!res.ok || data?.ok === false) {
    throw new Error(data?.error || `HTTP ${res.status}`)
  }
  return data as T
}

export default function AuthPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [mode, setMode] = useState<string>("login")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [authInputs, setAuthInputs] = useState<AuthModel>(new AuthModel("", "", "", "", "", ""))

  const [error, setError] = useState("")

  // Se già loggato, manda a home
  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: () => apiJson<{ ok: true; user: any }>("/auth/me.php"),
    retry: false,
    staleTime: Infinity,
  })

  useEffect(() => {
    if (meQuery.isSuccess && meQuery.data?.user) {
      navigate("/", { replace: true })
    }
  }, [meQuery.isSuccess, meQuery.data, navigate])

  const loginMut = useMutation({
    mutationFn: (vars: { login: string; password: string }) =>
      apiJson<{ ok: true; user: any }>("/auth/login.php", vars),
  })

  const registerMut = useMutation({
    mutationFn: (vars: {
      email: string
      username: string
      name: string
      surname: string
      password: string
    }) => apiJson<{ ok: true }>("/auth/register.php", vars),
  })

  const isLoading = loginMut.isPending || registerMut.isPending || meQuery.isLoading

  const resetForm = () => {
    setAuthInputs(new AuthModel("", "", "", "", "", ""))
    setShowPassword(false)
    setShowConfirmPassword(false)
  }

  const handleModeSwitch = (newMode: string) => {
    if (newMode === mode) return
    setError("")
    setMode(newMode)
    resetForm()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!authInputs.EmailOrUsername || !authInputs.Password) {
      setError("Please fill in all required fields")
      return
    }

    try {
      if (mode === "login") {
        await loginMut.mutateAsync({ login: authInputs.EmailOrUsername, password: authInputs.Password })
        await queryClient.invalidateQueries({ queryKey: ["me"] })

        navigate("/", { replace: true })
        return
      }

      // REGISTER
      if (!authInputs.Username || !authInputs.Name || !authInputs.Surname) {
        setError("Please fill in all required fields")
        return
      }
      if (!/^\S+@\S+\.\S+$/.test(authInputs.EmailOrUsername)) {
        setError("Please enter a valid email address")
        return
      }
      if (authInputs.Password.length < 8) {
        setError("Password must be at least 8 characters")
        return
      }
      if (authInputs.Password !== authInputs.ConfirmPassword) {
        setError("Passwords do not match")
        return
      }

      await registerMut.mutateAsync({
        email: authInputs.EmailOrUsername,
        username: authInputs.Username,
        name: authInputs.Name,
        surname: authInputs.Surname,
        password: authInputs.Password,
      })

      // Auto-login dopo register
      await loginMut.mutateAsync({ login: authInputs.EmailOrUsername, password: authInputs.Password })
      await queryClient.invalidateQueries({ queryKey: ["me"] })

      navigate("/", { replace: true })
    } catch (err: any) {
      setError(err?.message || "Something went wrong")
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Subtle background gradient */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>

      {/* Left Side - Branding (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-2/5 relative z-10 flex-col justify-center px-12 xl:px-20">
        <div>
          <img
            src={"/bevoh_logo.png"}
            alt="BEVOH"
            className="w-80 max-h-[25vh] object-contain mb-16"
          />
          <p className="text-xl text-muted-foreground mb-8 max-w-md leading-relaxed">
            Track your drinks, compete with friends, and make every night memorable.
          </p>

          <div className="space-y-4">
            {[
              { icon: "🍻", text: "Log drinks in real-time" },
              { icon: "👥", text: "Connect with friends" },
              { icon: "🏆", text: "Climb the leaderboard" },
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-4 text-muted-foreground">
                <span className="text-2xl">{feature.icon}</span>
                <span className="text-lg">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 lg:py-8 relative z-10">
        {/* Mobile Logo */}
        <div className="lg:hidden mb-8 text-center">
          <div className="w-56 flex items-center justify-center mx-auto mt-4">
            <img
              src={"/bevoh_logo.png"}
              alt="BEVOH"
              className="w-full max-h-[75vh] object-contain"
            />
          </div>
        </div>

        {/* Auth Card */}
        <div className="w-full max-w-md lg:max-w-lg">
          <div className="p-2 lg:p-8">
            {/* Toggle Tabs */}
            <div className="flex gap-2 bg-secondary rounded-xl p-1 mb-6">
              <button
                type="button"
                onClick={() => handleModeSwitch("login")}
                disabled={isLoading}
                className={`flex-1 py-3 lg:py-3.5 rounded-lg text-sm z-50 lg:text-base font-medium transition-all duration-200 ${mode === "login"
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "text-muted-foreground hover:text-foreground"
                  } disabled:opacity-60`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => handleModeSwitch("register")}
                disabled={isLoading}
                className={`flex-1 py-3 lg:py-3.5 rounded-lg text-sm z-50 lg:text-base font-medium transition-all duration-200 ${mode === "register"
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "text-muted-foreground hover:text-foreground"
                  } disabled:opacity-60`}
              >
                Sign Up
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 pb-16">
              {mode === "register" && (
                <>
                  {/* Username */}
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input type="text" disabled={isLoading} autoComplete="username" placeholder="Username" value={authInputs.Username}
                      onChange={(e) => setAuthInputs({ ...authInputs, Username: e.target.value.trim() })}
                      className="input-dark w-full py-3.5 lg:py-4 pl-12 pr-4 text-sm lg:text-base"
                    />
                  </div>

                  {/* Name & Surname */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input type="text" disabled={isLoading} autoComplete="given-name" placeholder="Name" value={authInputs.Name}
                        onChange={(e) => setAuthInputs({ ...authInputs, Name: e.target.value.trim() })}
                        className="input-dark w-full py-3.5 lg:py-4 pl-12 pr-4 text-sm lg:text-base"
                      />
                    </div>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input type="text" disabled={isLoading} autoComplete="family-name" placeholder="Surname" value={authInputs.Surname}
                        onChange={(e) => setAuthInputs({ ...authInputs, Surname: e.target.value.trim() })}
                        className="input-dark w-full py-3.5 lg:py-4 pl-12 pr-4 text-sm lg:text-base"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Email or Username */}
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input type="text" disabled={isLoading} value={authInputs.EmailOrUsername}
                  autoComplete={mode === "login" ? "username" : "email"} placeholder={mode === "login" ? "Email or username" : "Email address"}
                  onChange={(e) => setAuthInputs({ ...authInputs, EmailOrUsername: e.target.value.trim() })}
                  className="input-dark w-full py-3.5 lg:py-4 pl-12 pr-4 text-sm lg:text-base"
                />
              </div>

              {/* Password */}
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input type={showPassword ? "text" : "password"} disabled={isLoading} autoComplete="password" placeholder="Password" value={authInputs.Password}
                  onChange={(e) => setAuthInputs({ ...authInputs, Password: e.target.value.trim() })}
                  className="input-dark w-full py-3.5 lg:py-4 pl-12 pr-12 text-sm lg:text-base"
                />
                <button type="button" disabled={isLoading}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {mode === "register" && (
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input type={showConfirmPassword ? "text" : "password"} disabled={isLoading} autoComplete="confirm-password"
                    placeholder="Confirm password" value={authInputs.ConfirmPassword}
                    onChange={(e) => setAuthInputs({ ...authInputs, ConfirmPassword: e.target.value.trim() })}
                    className="input-dark w-full py-3.5 lg:py-4 pl-12 pr-12 text-sm lg:text-base"
                  />
                  <button type="button" disabled={isLoading}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              )}

              {mode === "login" && (
                <div className="text-right">
                  <button type="button" onClick={() => alert("da implementare")} disabled={isLoading}
                    className="text-sm text-primary hover:underline transition-all hover:text-primary/80"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-border" />
              </div>

              <button type="submit" disabled={isLoading}
                className="w-full py-3.5 lg:py-4 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm lg:text-base hover:shadow-lg active:scale-[0.98]"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  <>
                    {mode === "login" ? "Sign In" : "Create Account"}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
