"use client"

import type React from "react"

import "./Login.css"
import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import apiService from "../../api/apiService"
import google from "../../assets/images/google.svg"


// Make sure this is defined on the window object for the Telegram script
declare global {
  interface Window {
    handleTelegramLogin: (user: any) => void
  }
}

function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const navigate = useNavigate()
  const location = useLocation()
  const { setToken } = useAuth()

  const from = location.state?.from?.pathname || "/home"

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    try {
      const response = await apiService.post("/login", { email, password })
      if (response.data.success) {
        setToken(response.data.token)
        navigate(from, { replace: true })
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || "Login failed"
      const uzbekErrors: { [key: string]: string } = {
        "Invalid credentials": "Noto'g'ri email yoki parol",
        "User not found": "Foydalanuvchi topilmadi",
      }
      setError(uzbekErrors[errorMsg] || "Kirishda xatolik yuz berdi")
    }
  }

  const handleGoogleLogin = () => {
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${import.meta.env.VITE_GOOGLE_CLIENT_ID}&redirect_uri=${import.meta.env.VITE_GOOGLE_REDIRECT_URI}&response_type=code&scope=email%20profile`
    window.location.href = googleAuthUrl
  }

  // Setup Telegram callback on the window object
  useEffect(() => {
    window.handleTelegramLogin = (user) => {
      apiService
        .get("/telegram", { params: user })
        .then((response) => {
          if (response.data.success) {
            setToken(response.data.token)
            navigate(from, { replace: true })
          }
        })
        .catch((err) => {
          console.error("Telegram login error:", err)
          setError("Telegram orqali kirishda xatolik.")
        })
    }

    // Cleanup the global function when the component unmounts
    return () => {
      delete window.handleTelegramLogin
    }
  }, [navigate, from, setToken])

  return (
    <div className="login flex justify-center items-center min-h-screen">
      <div className="login-container max-w-[504px] w-full mx-auto sm:rounded-4xl rounded-0 border-[0.5px] border-gray-100 bg-gray-50 md:px-14 px-5 pt-10 pb-5">
        <h2 className="font-manrope font-medium text-[32px] leading-[120%] tracking-[0%] mb-7">Kirish</h2>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        <button
          onClick={handleGoogleLogin}
          className="flex items-center justify-center w-full sm:h-[60px] h-12 gap-2.5 border-[0.5px] border-blue-800 rounded-2xl cursor-pointer mb-2"
        >
          <img className="flex w-6 h-6" src={google || "/placeholder.svg"} alt="Google" />
          <span className="font-manrope font-semibold text-[16px] leading-[140%] tracking-[0%] uppercase text-gray-900">
            Gmail orqali
          </span>
        </button>

        <script
          async
          src="https://telegram.org/js/telegram-widget.js?22"
          data-telegram-login={import.meta.env.VITE_TELEGRAM_BOT_USERNAME}
          data-size="large"
          data-onauth="handleTelegramLogin(user)"
          data-request-access="write"
        ></script>

        <p className="text-center text-gray-600 mb-6">yoki</p>
        <form onSubmit={handleLogin}>
          <input
            className="w-full sm:h-[60px] h-12 rounded-[8px] border-[0.5px] border-gray-200 bg-gray-100 outline-none px-4 mb-4"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Gmail kiriting"
            required
          />
          <input
            className="w-full sm:h-[60px] h-12 rounded-[8px] border-[0.5px] border-gray-200 bg-gray-100 outline-none px-4 mb-1"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Parol"
            required
          />
          <a className="flex text-gray-600 text-end mb-6" href="/forgot-password">
            Parolingiz esdan chiqdimi?
          </a>
          <button
            type="submit"
            className="w-full sm:h-16 h-14 rounded-2xl border-[1px] border-blue-700 bg-blue-700 text-gray-50 cursor-pointer font-semibold hover:opacity-80 sm:mb-10 mb-5"
          >
            KIRISH
          </button>
        </form>
        <a className="flex justify-center font-normal text-gray-700 gap-1" href="/sign-up">
          Hali hisobingiz yo'qmi? <span className="font-semibold text-blue-600">Roʻyxatdan oʻtish</span>
        </a>
      </div>
    </div>
  )
}

export default Login
