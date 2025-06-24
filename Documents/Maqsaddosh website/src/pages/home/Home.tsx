"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import apiService from "../../api/apiService"
import type { Direction } from "../../types" // Assuming Direction type includes id, name, and potentially icon/color info if dynamic

import Hero from "../../components/hero/Hero"
import Navbar from "../../components/navbar/Navbar"
import Cart from "../../components/cart/Cart" // Assuming Cart.tsx is in components/cart/

// Static definitions for icons and colors, as backend might only provide name/id
import cart1 from "../../assets/images/teacher.svg"
import cart2 from "../../assets/images/weight.svg"
import cart3 from "../../assets/images/message-programming.svg"
import cart4 from "../../assets/images/book.svg"
import cart5 from "../../assets/images/language-square.svg"
import cart6 from "../../assets/images/flash-circle.svg"
import cart7 from "../../assets/images/presention-chart.svg"
import cart8 from "../../assets/images/airplane-square.svg"
import cart9 from "../../assets/images/ranking.svg"
import cart10 from "../../assets/images/flash.svg"
import cart11 from "../../assets/images/profile-2user.svg"
import cart12 from "../../assets/images/heart-circle.svg"
import cart13 from "../../assets/images/people.svg"
import cart14 from "../../assets/images/bank.svg"
import cart15 from "../../assets/images/lovely.svg"
import cart16 from "../../assets/images/award.svg"
import cart17 from "../../assets/images/crown.svg"
import cart18 from "../../assets/images/coffee.svg"

// Interface for frontend category styling
interface CategoryStyle {
  icon: string
  bgColor: string
  iconColor: string
}

// Map backend direction names or IDs to frontend styles
const categoryStyles: Record<string, CategoryStyle> = {
  "Ta'lim": { icon: cart1, bgColor: "bg-[#DBDFFC]", iconColor: "bg-[#7182FE]" },
  Sport: { icon: cart2, bgColor: "bg-[#D1F5E7]", iconColor: "bg-[#00F898]" },
  "Zamonaviy kasblar": { icon: cart3, bgColor: "bg-[#F0DBFC]", iconColor: "bg-[#B94AF9]" },
  Kitobxonlik: { icon: cart4, bgColor: "bg-[#FADD75]", iconColor: "bg-[#FFC700]" },
  "Til o'rganish": { icon: cart5, bgColor: "bg-[#FBEADA]", iconColor: "bg-[#F48216]" },
  "Shaxsiy rivojlanish": { icon: cart6, bgColor: "bg-[#D3F0FF]", iconColor: "bg-[#75CFFD]" },
  Biznes: { icon: cart7, bgColor: "bg-[#A6FE5A]", iconColor: "bg-[#76FF00]" },
  Sayohat: { icon: cart8, bgColor: "bg-[#FFD3D4]", iconColor: "bg-[#FE686B]" },
  Karyera: { icon: cart9, bgColor: "bg-[#F3F3F3]", iconColor: "bg-[#5FC5C5]" }, // Check if this color is intended
  Qiziqishlar: { icon: cart10, bgColor: "bg-[#DBFCF9]", iconColor: "bg-[#5FF3E7]" },
  "Ustoz-Shogirt": { icon: cart11, bgColor: "bg-[#DBFCDE]", iconColor: "bg-[#5AF167]" },
  "Sog’lom hayot": { icon: cart12, bgColor: "bg-[#E8DAFB]", iconColor: "bg-[#A161F6]" },
  Talabalar: { icon: cart13, bgColor: "bg-[#F1FCDB]", iconColor: "bg-[#97BB51]" }, // Used for "Talabalar" and "IELTS/SAT"
  Universitetlar: { icon: cart14, bgColor: "bg-[#E3E6F1]", iconColor: "bg-[#8F9CCC]" },
  Volontyorlik: { icon: cart15, bgColor: "bg-[#E8F1E3]", iconColor: "bg-[#4CB0B0]" },
  "IELTS/SAT": { icon: cart16, bgColor: "bg-[#F1ECE3]", iconColor: "bg-[#C49D53]" },
  "Do’stlar": { icon: cart17, bgColor: "bg-[#EDF9FF]", iconColor: "bg-[#46B0E5]" },
  Qariyalar: { icon: cart18, bgColor: "bg-[#DBFCEE]", iconColor: "bg-[#27D68D]" },
  // Add a default style for directions not explicitly mapped
  default: { icon: cart1, bgColor: "bg-gray-200", iconColor: "bg-gray-400" },
}

interface DisplayDirection extends Direction {
  style: CategoryStyle
}

function Home() {
  const [showAll, setShowAll] = useState(false)
  const [directions, setDirections] = useState<DisplayDirection[]>([])
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchDirections = async () => {
      setIsLoading(true)
      setError("")


      try {
        const response = await fetch('https://maqsaddosh-backend-o2af.onrender.com/api/directions')
        const data: { data: Direction[] } = await response.json()
        const fetchedDirections = data.data.map((dir) => ({
          ...dir,
          style: categoryStyles[dir.name] || categoryStyles["default"],
        }))
        setDirections(fetchedDirections)
      } catch (err: any) {
        console.error("Directions error:", err)
        setError(err.response?.data?.error || "Yo'nalishlar yuklanmadi")
      } finally {
        setIsLoading(false)
      }
    }
    fetchDirections()
  }, [])

  const handleDirectionClick = (directionId: string) => {
    navigate(`/edu/${directionId}`)
  }

  const visibleDirections = showAll ? directions : directions.slice(0, 6)

  return (
    <>
      <Navbar />
      <Hero />
      <section className="home py-10">
        <div className="container max-w-[1138px] w-full mx-auto px-5">
          <p className="font-semibold md:text-[20px] text-lg leading-[130%] tracking-[0%] font-manrope text-gray-900 mb-5">
            Maqsad yo’nalishlari
          </p>
          {isLoading && <p className="text-center text-gray-600">Yuklanmoqda...</p>}
          {error && <p className="text-red-500 text-center mb-4">{error}</p>}
          {!isLoading && !error && directions.length === 0 && (
            <p className="text-center text-gray-600">Yo'nalishlar topilmadi.</p>
          )}
          {!isLoading && !error && directions.length > 0 && (
            <>
              <div className="transition-all duration-300 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                {visibleDirections.map((item) => (
                  <div key={item.id} onClick={() => handleDirectionClick(item.id)}>
                    <Cart
                      title={item.name}
                      icon={item.style.icon}
                      bgColor={item.style.bgColor}
                      iconColor={item.style.iconColor}
                    />
                  </div>
                ))}
              </div>
              {directions.length > 6 && (
                <div className="transition-all duration-300 flex justify-center">
                  <button
                    onClick={() => setShowAll(!showAll)}
                    className="cursor-pointer flex items-center justify-center gap-1 w-[152px] h-12 text-gray-900 border border-gray-200 rounded-2xl bg-white hover:bg-gray-100 transition px-4 py-2 shadow-sm"
                  >
                    {showAll ? "Yopish" : "Barchasi"}
                    <svg
                      className={`w-4 h-4 transform transition-transform duration-300 ${
                        showAll ? "rotate-180" : "rotate-0"
                      }`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  )
}

export default Home
