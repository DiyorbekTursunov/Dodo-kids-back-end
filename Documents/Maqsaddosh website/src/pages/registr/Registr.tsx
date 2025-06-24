"use client"

import type React from "react"
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

function Registr() {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const navigate = useNavigate()
  const location = useLocation()
  const { setToken } = useAuth()

  const from = location.state?.from?.pathname || "/home"

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    try {
      const response = await apiService.post("/signup", { fullName, email, password })
      if (response.data.success) {
        setToken(response.data.token)
        navigate(from, { replace: true })
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || "Signup failed"
      const uzbekErrors: { [key: string]: string } = {
        "User already exists": "Foydalanuvchi allaqachon mavjud",
        "Invalid email": "Noto'g'ri email formati",
        "Password must be at least 8 characters long": "Parol kamida 8 belgidan iborat bo'lishi kerak",
      }
      setError(uzbekErrors[errorMsg] || "Ro'yxatdan o'tishda xatolik yuz berdi")
    }
  }

  const handleGoogleLogin = () => {
    // Ensure these environment variables are set in your .env file (e.g., .env.local for Vite)
    // VITE_GOOGLE_CLIENT_ID=your_google_client_id
    // VITE_GOOGLE_REDIRECT_URI=http://localhost:3000/api/google (or your frontend callback if handling there)
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${import.meta.env.VITE_GOOGLE_CLIENT_ID}&redirect_uri=${import.meta.env.VITE_GOOGLE_REDIRECT_URI}&response_type=code&scope=email%20profile`
    window.location.href = googleAuthUrl
  }

  // Setup Telegram callback on the window object
  useEffect(() => {
    window.handleTelegramLogin = (user: any) => {
      // `user` is the object from Telegram
      apiService
        .get("/telegram", { params: user }) // Send all user data from Telegram as query params
        .then((response) => {
          if (response.data.success) {
            setToken(response.data.token)
            navigate(from, { replace: true })
          } else {
            setError(response.data.error || "Telegram orqali ro'yxatdan o'tishda xatolik.")
          }
        })
        .catch((err) => {
          console.error("Telegram signup error:", err)
          setError(err.response?.data?.error || "Telegram orqali ro'yxatdan o'tishda xatolik.")
        })
    }
    // Cleanup the global function when the component unmounts
    return () => {
      delete window.handleTelegramLogin
    }
  }, [navigate, from, setToken])

  return (
    <div className="login flex justify-center items-center min-h-screen bg-gray-100">
      <div className="login-container max-w-[504px] w-full mx-auto sm:rounded-2xl rounded-0 border-[0.5px] border-gray-200 bg-white md:px-14 px-5 py-10 shadow-xl">
        <h2 className="font-manrope font-semibold text-[32px] leading-[120%] tracking-[0%] mb-7 text-center text-gray-900">
          Roʻyxatdan oʻtish
        </h2>
        {error && <p className="text-red-500 text-center mb-4 text-sm">{error}</p>}

        <button
          onClick={handleGoogleLogin}
          className="flex items-center justify-center w-full sm:h-[56px] h-12 gap-2.5 border border-gray-300 rounded-xl cursor-pointer mb-3 hover:bg-gray-50 transition-colors"
        >
          <img className="flex w-5 h-5" src={google || "/placeholder.svg"} alt="Google" />
          <span className="font-manrope font-semibold text-[16px] leading-[140%] tracking-[0%] text-gray-700">
            Google orqali
          </span>
        </button>

        {/* Telegram Login Button - ensure VITE_TELEGRAM_BOT_USERNAME is set */}
        <script
          async
          src="https://telegram.org/js/telegram-widget.js?22"
          data-telegram-login={import.meta.env.VITE_TELEGRAM_BOT_USERNAME} // e.g. your_bot_username (without @)
          data-size="large"
          data-radius="10"
          data-onauth="handleTelegramLogin(user)"
          data-request-access="write"
          className="telegram-login-button mb-3" // For styling if needed
        ></script>
        {/* Fallback or custom styled button if script doesn't render as expected */}
        {/* <button
            onClick={() => {}} // This button would be a placeholder if the script above is used
            className="flex items-center justify-center w-full sm:h-[56px] h-12 gap-2.5 border border-gray-300 rounded-xl cursor-pointer mb-3 hover:bg-gray-50 transition-colors"
        >
            <img className="flex w-5 h-5" src={tg || "/placeholder.svg"} alt="Telegram" />
            <span className="font-manrope font-semibold text-[16px] leading-[140%] tracking-[0%] text-gray-700">
                Telegram orqali
            </span>
        </button> */}

        <div className="flex items-center my-6">
          <hr className="flex-grow border-t border-gray-300" />
          <span className="px-3 text-gray-500 text-sm">yoki</span>
          <hr className="flex-grow border-t border-gray-300" />
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <input
            className="w-full sm:h-[56px] h-12 rounded-xl border border-gray-300 bg-gray-50 outline-none px-4 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="To'liq ism"
            required
          />
          <input
            className="w-full sm:h-[56px] h-12 rounded-xl border border-gray-300 bg-gray-50 outline-none px-4 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email kiriting"
            required
          />
          <input
            className="w-full sm:h-[56px] h-12 rounded-xl border border-gray-300 bg-gray-50 outline-none px-4 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Parol (kamida 8 belgi)"
            required
            minLength={8}
          />
          <button
            type="submit"
            className="w-full sm:h-14 h-12 rounded-xl border-none bg-blue-600 text-white cursor-pointer font-semibold hover:bg-blue-700 transition-colors sm:mb-8 mb-5"
          >
            RO'YXATDAN O'TISH
          </button>
        </form>
        <p className="text-center font-normal text-gray-600 text-sm">
          Sizda allaqachon hisob bormi?{" "}
          <a href="/login" className="font-semibold text-blue-600 hover:underline">
            Kirish
          </a>
        </p>
      </div>
    </div>
  )
}

export default Registr
