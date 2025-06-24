"use client"

import { useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import searchIcon from "../../assets/images/search-normal.svg" // Ensure this path is correct

function Hero() {
  const [searchTerm, setSearchTerm] = useState("")
  const navigate = useNavigate()

  const handleSearchSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      navigate(`/search/goals?q=${encodeURIComponent(searchTerm.trim())}`)
      setSearchTerm("") // Optionally clear search term after navigation
    }
  }

  return (
    <section className="hero lg:py-14 md:py-10 py-8 bg-white">
      <div className="container max-w-[700px] w-full mx-auto px-5 text-center">
        <h1 className="font-semibold md:text-5xl text-4xl leading-tight tracking-tight font-manrope text-gray-900 mb-5">
          <span className="text-blue-600">Maqsaddosh!</span> <br />
          bilan maqsadlaringiz <br /> orzu bo'lib qolmaydi.
        </h1>
        <p className="font-medium md:text-xl text-lg leading-relaxed font-manrope text-gray-700 md:mb-10 mb-8">
          Maqsadlaringizga mos maqsaddoshlarni <br className="hidden sm:inline" /> yo’nalishlarni belgilash orqali oson
          toping.
        </p>
        <form
          onSubmit={handleSearchSubmit}
          className="flex items-center gap-3 max-w-[600px] h-14 rounded-xl border border-gray-200 bg-gray-50 px-4 mx-auto shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500"
        >
          <label htmlFor="search-hero" className="cursor-pointer">
            {/* Corrected image source */}
            <img
              className="w-5 h-5 text-gray-400"
              src={searchIcon || "/placeholder.svg?width=20&height=20&query=search"}
              alt="Search Icon"
            />
          </label>
          <input
            className="w-full h-full bg-transparent outline-none text-gray-800 placeholder-gray-500 text-md"
            type="text"
            id="search-hero"
            placeholder="Maqsaddosh qidiring..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {/* You could add a visually hidden submit button for accessibility or a visible one */}
          <button type="submit" className="sr-only">
            Qidirish
          </button>
        </form>
      </div>
    </section>
  )
}
export default Hero
