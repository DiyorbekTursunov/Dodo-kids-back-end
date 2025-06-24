import { useState, useEffect, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import apiService from "../../api/apiService"
import type { Direction, SubDirection } from "../../types"
import Navbar from "../../components/navbar/Navbar"
import { ChevronDown } from "lucide-react"

const VISIBILITY_MAP = {
  public: "PUBLIC",
  private: "PRIVATE",
}

const VISIBILITY_DISPLAY_MAP = {
  PUBLIC: "Ommaviy (Barchaga ko'rinsin)",
  PRIVATE: "Shaxsiy (Faqat menga ko'rinsin)",
}

export default function AddGoal() {
  const navigate = useNavigate()

  const [directions, setDirections] = useState([])
  const [subDirections, setSubDirections] = useState([])
  const [selectedDirection, setSelectedDirection] = useState("")
  const [selectedSubDirection, setSelectedSubDirection] = useState("")

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [selectedPeriod, setSelectedPeriod] = useState(null)
  const [visibility, setVisibility] = useState("")
  const [phone, setPhone] = useState("")
  const [telegram, setTelegram] = useState("")

  const [isLoadingDirections, setIsLoadingDirections] = useState(false)
  const [isLoadingSubDirections, setIsLoadingSubDirections] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [subDirectionsMessage, setSubDirectionsMessage] = useState("")

  useEffect(() => {
    const fetchDirections = async () => {
      setIsLoadingDirections(true)
      try {
        const response = await apiService.get("/directions")
        setDirections(response.data.data)
      } catch (err) {
        console.error("Yo'nalishlar yuklanmadi", err)
      } finally {
        setIsLoadingDirections(false)
      }
    }
    fetchDirections()
  }, [])

  useEffect(() => {
    if (selectedDirection) {
      const fetchSubDirections = async () => {
        setIsLoadingSubDirections(true)
        setSubDirections([])
        setSelectedSubDirection("")
        setSubDirectionsMessage("")
        try {
          const response = await apiService.get(`/directions/${selectedDirection}`)
          if (response.data.success) {
            if (response.data.data && response.data.data.length > 0) {
              setSubDirections(response.data.data)
            } else {
              setSubDirectionsMessage("Bu yo'nalish uchun ichki bo'limlar mavjud emas.")
              setSubDirections([])
            }
          } else {
            const errorMsg = response.data.error || "Ichki yo'nalishlar ma'lumotlari noto'g'ri."
            setSubDirectionsMessage("Ichki yo'nalishlarni yuklashda xatolik: " + errorMsg)
            setSubDirections([])
          }
        } catch (err) {
          console.error("Ichki yo'nalishlar yuklashda xatolik:", err)
          setSubDirectionsMessage("Ichki yo'nalishlarni yuklashda server xatoligi yuz berdi.")
          setSubDirections([])
        } finally {
          setIsLoadingSubDirections(false)
        }
      }
      fetchSubDirections()
    } else {
      setSubDirections([])
      setSelectedSubDirection("")
      setSubDirectionsMessage("")
    }
  }, [selectedDirection])

  const calculateEndDate = (durationInDays) => {
    const currentDate = new Date()
    const endDate = new Date(currentDate)
    endDate.setDate(currentDate.getDate() + durationInDays)
    endDate.setHours(23, 59, 59, 999)
    return endDate.toISOString()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name || !selectedDirection || (subDirections.length > 0 && !selectedSubDirection) || !selectedPeriod || !visibility || !phone || !telegram) {
      alert("Iltimos, barcha majburiy maydonlarni to'ldiring!")
      return
    }
    setIsSubmitting(true)
    try {
      const duration = Number.parseInt(selectedPeriod, 10)
      const goalData = {
        name,
        description,
        directionId: selectedDirection,
        subDirectionId: selectedSubDirection || null,
        duration,
        visibility: VISIBILITY_MAP[visibility],
        phone,
        telegram,
        endDate: calculateEndDate(duration),
      }
      await apiService.post("/goals", goalData)
      navigate("/")
    } catch (err) {
      console.error("Maqsad saqlanmadi: Xatolik yuz berdi", err)
      alert("Maqsad saqlanmadi: Xatolik yuz berdi. Tafsilotlar uchun konsolni tekshiring.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const periodOptions = ["7", "14", "21", "28"]
  const inputBaseClass =
    "w-full h-14 px-5 py-3.5 bg-slate-100 rounded-xl text-slate-800 placeholder-slate-500 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="container mx-auto max-w-lg px-4 py-8 sm:py-12">
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl">
          <h2 className="text-3xl font-bold text-slate-800 text-center mb-8">Maqsad qo'shish</h2>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Maqsad nomi"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={3}
              className={inputBaseClass}
            />
            <textarea
              placeholder="Izoh qoldirish"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`${inputBaseClass} resize-none leading-relaxed`}
            />
            <div className="relative">
              <select
                value={selectedDirection}
                onChange={(e) => setSelectedDirection(e.target.value)}
                required
                disabled={isLoadingDirections}
                className={`${inputBaseClass} appearance-none pr-10 cursor-pointer ${selectedDirection ? "text-slate-800" : "text-slate-500"}`}
              >
                <option value="" disabled className="text-slate-500">
                  Yo'nalish tanlang
                </option>
                {directions.map((dir) => (
                  <option key={dir.id} value={dir.id} className="text-slate-800">
                    {dir.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={selectedSubDirection}
                onChange={(e) => setSelectedSubDirection(e.target.value)}
                required={subDirections.length > 0}
                disabled={isLoadingSubDirections || !selectedDirection || subDirections.length === 0}
                className={`${inputBaseClass} appearance-none pr-10 cursor-pointer ${selectedSubDirection ? "text-slate-800" : "text-slate-500"}`}
              >
                <option value="" disabled className="text-slate-500">
                  Ichki yo'nalish tanlang
                </option>
                {subDirections.map((sub) => (
                  <option key={sub.id} value={sub.id} className="text-slate-800">
                    {sub.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            {!isLoadingSubDirections && subDirectionsMessage && (
              <p className={`text-sm mt-1 ${subDirectionsMessage.includes("xatolik") ? "text-red-500" : "text-gray-600"}`}>
                {subDirectionsMessage}
              </p>
            )}
            <div>
              <div className="grid grid-cols-4 gap-3">
                {periodOptions.map((days) => (
                  <button
                    key={days}
                    type="button"
                    className={`h-14 text-base w-full rounded-xl transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500
                      ${selectedPeriod === days ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
                    onClick={() => setSelectedPeriod(days)}
                    disabled={isLoadingDirections || isLoadingSubDirections}
                  >
                    {days} kun
                  </button>
                ))}
              </div>
            </div>
            <div className="relative">
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
                required
                disabled={isLoadingDirections || isLoadingSubDirections}
                className={`${inputBaseClass} appearance-none pr-10 cursor-pointer ${visibility ? "text-slate-800" : "text-slate-500"}`}
              >
                <option value="" disabled className="text-slate-500">
                  Ommaviylik
                </option>
                <option value="public" className="text-slate-800">
                  {VISIBILITY_DISPLAY_MAP.PUBLIC}
                </option>
                <option value="private" className="text-slate-800">
                  {VISIBILITY_DISPLAY_MAP.PRIVATE}
                </option>
              </select>
              <ChevronDown className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <input
              type="tel"
              placeholder="Telefon raqam kiriting (+998 XX XXX XX XX)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className={inputBaseClass}
            />
            <input
              type="text"
              placeholder="Telegram user kiriting (@username)"
              value={telegram}
              onChange={(e) => setTelegram(e.target.value)}
              required
              className={inputBaseClass}
            />
            <button
              type="submit"
              className="w-full h-14 text-lg font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-60"
              disabled={isSubmitting || isLoadingDirections || isLoadingSubDirections}
            >
              {isSubmitting ? "Saqlanmoqda..." : "SAQLASH"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
