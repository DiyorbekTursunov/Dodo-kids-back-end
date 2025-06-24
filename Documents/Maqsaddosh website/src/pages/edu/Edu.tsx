"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import apiService from "../../api/apiService"
import type { SubDirection, Direction } from "../../types"

import Navbar from "../../components/navbar/Navbar"
import Hero from "../../components/hero/Hero" // Assuming Hero is generic or not needed here
import eduIcon from "../../assets/images/teacher.svg" // Default icon


function Edu() {
  const { directionsId } = useParams<{ directionsId: string }>()
  const [direction, setDirection] = useState<SubDirection[] | null>(null)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    if (!directionsId) {
      setError("Yo'nalish ID topilmadi.")
      setIsLoading(false)
      return
    }
    const fetchDirectionDetails = async () => {
      setIsLoading(true)
      setError("")
      try {
        // This endpoint should return the direction with its subDirections
        const response = await apiService.get<{ success: boolean; data: SubDirection[] }>(
          `/directions/${directionsId}`, // Assuming this endpoint returns direction name and its subdirections
        )
        if (response.data.success) {
          setDirection(response.data.data)
        } else {
          setError(response.data.error || "Yo'nalish ma'lumotlari yuklanmadi")
        }
      } catch (err: any) {
        console.error("Direction details error:", err)
        setError(err.response?.data?.error || "Yo'nalish ma'lumotlari yuklanmadi")
      } finally {
        setIsLoading(false)
      }
    }
    fetchDirectionDetails()
  }, [directionsId])

  const handleSubdirectionClick = (subdirectionId: string) => {
    navigate(`/goals?subdirectionId=${subdirectionId}`)
  }


  console.log(direction);

  return (
    <>
      <Navbar />
      <Hero /> {/* Consider if Hero component is appropriate here or needs props */}
      <section className="edu py-10 bg-gray-50">
        <div className="container max-w-6xl w-full mx-auto px-5">
          {isLoading && <p className="text-center text-gray-600">Yuklanmoqda...</p>}
          {error && <p className="text-red-500 text-center mb-4">{error}</p>}

          {direction && !isLoading && !error && (
            <>
              <p className="flex font-semibold md:text-[20px] text-lg leading-[130%] tracking-[0%] font-manrope text-gray-900 mb-5">
                 yo’nalishlari
              </p>
              {direction && direction.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full pb-10">
                  {direction.map((sub) => (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between h-20 rounded-2xl border-[0.5px] border-gray-100 bg-[#DBDFFC] pr-5 pl-4 cursor-pointer hover:shadow-lg transition"
                      onClick={() => handleSubdirectionClick(sub.id)}
                    >
                      <span className="font-manrope font-semibold text-[20px] leading-[130%] tracking-[0%] text-gray-900">
                        {sub.name}
                      </span>
                      <img
                        src={eduIcon || "/placeholder.svg"} // Consider dynamic icons if available
                        alt={sub.name}
                        className="w-10 h-10 rounded-[8px] bg-[#7182FE] p-2"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-700 text-center">Bu yo'nalishda ichki bo'limlar mavjud emas.</p>
              )}
            </>
          )}
          {!direction && !isLoading && !error && <p className="text-gray-700 text-center">Yo'nalish topilmadi.</p>}
        </div>
      </section>
    </>
  )
}

export default Edu
