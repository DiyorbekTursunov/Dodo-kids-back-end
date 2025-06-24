"use client"

import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import apiService from "../../api/apiService"
import type { Goal } from "../../types"
import { ChevronLeft, Flag, ClipboardCheck, ArrowRight, SearchX } from "lucide-react"
import Navbar from "../../components/navbar/Navbar"
import defaultAvatar from "../../assets/images/profile.png"

const calculateDaysLeft = (endDate: string): number => {
  const end = new Date(endDate)
  const now = new Date()
  const diffInMs = end.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diffInMs / (1000 * 60 * 60 * 24)))
}

function SearchResultsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchResults, setSearchResults] = useState<Goal[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState("") // For "No results found" type messages

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search)
    const q = queryParams.get("q")

    if (q) {
      setSearchTerm(q)
      setIsLoading(true)
      setError("")
      setMessage("")
      apiService
        .get<{ success: boolean; data: Goal[]; error?: string; message?: string }>(
          `/goals?q=${encodeURIComponent(q)}`,
        )
        .then((response) => {
          if (response.data.success) {
            setSearchResults(response.data.data)
            if (response.data.data.length === 0) {
              setMessage(response.data.message || `"${q}" uchun natija topilmadi.`)
            }
          } else {
            setError(response.data.error || "Qidiruvda xatolik yuz berdi.")
          }
        })
        .catch((err: any) => {
          console.error("Search error:", err)
              setMessage(`"${q}" uchun natija topilmadi.`)
        })
        .finally(() => {
          setIsLoading(false)
        })
    } else {
      setError("Qidiruv so'rovi topilmadi.")
      setIsLoading(false)
    }
  }, [location.search])

  const handleGoalClick = (goalId: string) => {
    navigate(`/goals/${goalId}`)
  }

  const handleBackClick = () => {
    navigate(-1) // Go back to the previous page
  }

  return (
    <div className="font-sans min-h-screen bg-[#FBFBFB]">
      <Navbar />
      <div className="max-w-[1058px] mx-auto px-5 py-6">
        <div className="flex items-center justify-between text-[20px] font-semibold mb-5">
          <button className="flex items-center gap-2 text-gray-700 hover:text-gray-900" onClick={handleBackClick}>
            <ChevronLeft className="text-gray-500" />
            <span>Orqaga</span>
          </button>
          <h1 className="text-2xl font-semibold text-gray-800 truncate">
            Qidiruv natijalari: <span className="text-blue-600">"{searchTerm}"</span>
          </h1>
          <div className="w-20"></div> {/* Spacer */}
        </div>

        {isLoading && <p className="text-gray-600 text-center py-10">Qidirilmoqda...</p>}
        {error && <p className="text-red-500 text-center py-10">{error}</p>}
        {!isLoading && !error && message && (
          <div className="text-center py-10">
            <SearchX size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-700 text-xl">{message}</p>
          </div>
        )}

        {!isLoading && !error && !message && searchResults.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {searchResults.map((goal) => (
              <div
                key={goal.id}
                className="rounded-[20px] bg-white shadow-sm cursor-pointer hover:shadow-lg transition-shadow duration-300 overflow-hidden border border-gray-200 flex flex-col"
                onClick={() => handleGoalClick(goal.id)}
              >
                <div className="px-5 py-4 flex-grow">
                  <div className="flex items-center gap-2 mb-3">
                    <img
                      src={goal.creator.avatar || defaultAvatar}
                      alt={goal.creator.fullName}
                      className="w-9 h-9 rounded-full object-cover"
                    />
                    <span className="text-[16px] text-gray-700 truncate font-medium">{goal.creator.fullName}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-[19px] leading-tight mb-2.5 min-h-[40px] line-clamp-2">
                    {goal.name}
                  </h3>
                  <div className="flex items-center text-[14px] text-gray-600 bg-gray-100 w-fit rounded-full mb-3 gap-1 py-1 px-3">
                    <Flag className="w-4 h-4 text-gray-500" />
                    <span>{calculateDaysLeft(goal.endDate)} kun qoldi</span>
                  </div>
                </div>
                <div className="px-5 pb-4 pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center bg-gray-100 rounded-full gap-1 py-1.5 px-2.5">
                      <ClipboardCheck className="w-4 h-4 text-gray-500" />
                      <span className="text-[14px] text-gray-600">+{goal.participants.length}</span>
                      <div className="flex -space-x-2 ml-1">
                        {goal.participants.slice(0, 3).map((p, index) => (
                          <img
                            key={p.userId + index}
                            src={(p as any).avatar || defaultAvatar}
                            alt="participant"
                            className="w-5 h-5 rounded-full border-2 border-white object-cover"
                          />
                        ))}
                      </div>
                    </div>
                    <div
                      aria-label="Maqsadga o'tish"
                      className="flex items-center justify-center bg-blue-600 w-10 h-10 rounded-full hover:bg-blue-700 transition-colors"
                    >
                      <ArrowRight className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default SearchResultsPage
