"use client"

import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import apiService from "../../api/apiService"
import type { Goal, SubDirection } from "../../types"
import { ChevronLeft, Flag, ClipboardCheck, ArrowRight } from "lucide-react"
import Navbar from "../../components/navbar/Navbar"
import defaultAvatar from "../../assets/images/profile.png" // Default avatar

const calculateDaysLeft = (endDate: string): number => {
  const end = new Date(endDate)
  const now = new Date()
  const diffInMs = end.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diffInMs / (1000 * 60 * 60 * 24)))
}

function AllGoals() {
  const navigate = useNavigate()
  const location = useLocation()
  const [goals, setGoals] = useState<Goal[]>([])
  const [subdirectionName, setSubdirectionName] = useState("Yo'nalish")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const subdirectionId = new URLSearchParams(location.search).get("subdirectionId")
    if (!subdirectionId) {
      setError("Ichki yo'nalish tanlanmadi")
      setIsLoading(false)
      return
    }

    const fetchData = async () => {
      setIsLoading(true)
      setError("")
      try {
        // Fetch subdirection name (assuming an endpoint exists or is part of direction fetch)
        // For simplicity, if your /api/subdirections/:id endpoint exists:
        try {
          const subDirResponse = await apiService.get<{ success: boolean; data: SubDirection }>(
            `/subdirections/${subdirectionId}`,
          ) // Adjust endpoint if needed
          if (subDirResponse.data.success) {
            setSubdirectionName(subDirResponse.data.data.name)
          }
        } catch (subDirErr) {
          console.warn("Could not fetch subdirection name:", subDirErr)
          // Keep default name or try to get from parent direction if structure allows
        }

        const goalsResponse = await apiService.get<{ success: boolean; data: Goal[] }>(
          `/goals/public?subDirection=${subdirectionId}`,
        )
        if (goalsResponse.data.success) {
          setGoals(goalsResponse.data.data)
        } else {
          setError(goalsResponse.data.error || "Maqsadlar yuklanmadi")
        }
      } catch (err: any) {
        console.error("Error fetching data:", err)
        setError(err.response?.data?.error || "Ma'lumotlar yuklanmadi")
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [location])

  const handleGoalClick = (goalId: string) => {
    const subdirectionId = new URLSearchParams(location.search).get("subdirectionId")
    navigate(`/goals/${goalId}${subdirectionId ? `?subdirectionId=${subdirectionId}` : ""}`)
  }

  const handleBackClick = () => {
    // Navigate back to the parent direction page if possible, or just history back
    // Example: navigate(`/edu/${parentDirectionId}`) if you have it
    navigate(-1)
  }

  return (
    <div className="font-sans min-h-screen bg-[#FBFBFB]">
      <Navbar />
      <div className="max-w-[1058px] mx-auto px-5 py-6">
        <div className="flex items-center justify-between text-[20px] font-semibold mb-5">
          <button className="flex items-center gap-2 text-gray-700 hover:text-gray-900" onClick={handleBackClick}>
            <ChevronLeft className="text-gray-500" />
            <span>{subdirectionName}</span>
          </button>
        </div>

        {isLoading && <p className="text-gray-600 text-center">Maqsadlar yuklanmoqda...</p>}
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        {!isLoading && !error && goals.length === 0 && (
          <p className="text-gray-700 text-center">Bu yo'nalishda ommaviy maqsadlar topilmadi.</p>
        )}

        {!isLoading && !error && goals.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {goals.map((goal) => (
              <div
                key={goal.id}
                className="rounded-[20px] bg-white shadow-sm cursor-pointer hover:shadow-lg transition-shadow duration-300 overflow-hidden border border-gray-200"
                onClick={() => handleGoalClick(goal.id)}
              >
                <div className="px-5 py-4">
                  <div className="flex items-center gap-2 mb-3">
                    <img
                      src={goal.creator.avatar || defaultAvatar}
                      alt={goal.creator.fullName}
                      className="w-9 h-9 rounded-full object-cover"
                    />
                    <span className="text-[16px] text-gray-700 truncate">{goal.creator.fullName}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-[19px] leading-tight mb-2.5 min-h-[40px] line-clamp-2">
                    {goal.name}
                  </h3>
                  <div className="flex items-center text-[14px] text-gray-600 bg-gray-100 w-fit rounded-full mb-3 gap-1 py-1 px-3">
                    <Flag className="w-4 h-4 text-gray-500" />
                    <span>{calculateDaysLeft(goal.endDate)} kun qoldi</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center bg-gray-100 rounded-full gap-1 py-1.5 px-2.5">
                      <ClipboardCheck className="w-4 h-4 text-gray-500" />
                      <span className="text-[14px] text-gray-600">+{goal.participants.length}</span>
                      <div className="flex -space-x-2 ml-1">
                        {goal.participants.slice(0, 3).map((p, index) => (
                          <img
                            key={p.userId + index} // Ensure unique key
                            src={(p as any).avatar || defaultAvatar} // Assuming participant might have avatar
                            alt="participant"
                            className="w-5 h-5 rounded-full border-2 border-white object-cover"
                          />
                        ))}
                      </div>
                    </div>
                    <button
                      aria-label="Maqsadga o'tish"
                      className="flex items-center justify-center bg-blue-600 w-10 h-10 rounded-full hover:bg-blue-700 transition-colors"
                    >
                      <ArrowRight className="w-5 h-5 text-white" />
                    </button>
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

export default AllGoals
