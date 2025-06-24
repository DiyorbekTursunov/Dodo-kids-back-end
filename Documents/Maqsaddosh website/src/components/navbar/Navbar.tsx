"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"

// Assuming your image imports are correctly handled by your bundler (e.g., Vite, Create React App)
import logo from "../../assets/images/Logo (3).svg" // Updated path; ensure this matches your actual file structure
import userIcon from "../../assets/images/user.svg" // Renamed to avoid conflict with user state
import add from "../../assets/images/add.svg"
import menu from "../../assets/images/menu.png"
import notificat from "../../assets/images/notification.svg"
import defaultProfileImage from "../../assets/images/profile.png" // Default if user has no avatar
import userr from "../../assets/images/userr.svg"
import setting from "../../assets/images/setting-2.svg"
import message from "../../assets/images/message-text.svg"
import logoutIcon from "../../assets/images/logout.svg" // Renamed to avoid conflict

// Define User type (or import from a shared types file)
interface User {
  id: string
  email: string
  fullName: string
  avatar?: string | null
}

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const token = localStorage.getItem("token")
      if (!token) {
        setIsLoadingUser(false)
        return
      }

      try {
        setIsLoadingUser(true)
        const response = await fetch("https://maqsaddosh-backend-o2af.onrender.com/api/me", {
          // Adjust API_BASE_URL if needed
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        console.log(response);


        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setCurrentUser(data.data)
            console.log("this is data" + data);

          } else {
            // Token might be invalid or expired
            localStorage.removeItem("token")
            setCurrentUser(null)
          }
        } else {
          // Handle non-200 responses, e.g., 401 Unauthorized
          localStorage.removeItem("token")
          setCurrentUser(null)
        }
      } catch (error) {
        console.error("Failed to fetch user:", error)
        setCurrentUser(null) // Clear user on error
      } finally {
        setIsLoadingUser(false)
      }
    }

    fetchCurrentUser()
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("token")
    setCurrentUser(null)
    setIsModalOpen(false)
    navigate("/login")
  }

  const goGoal = () => {
    navigate("/add-goal")
  }

  const goToProfile = () => {
    setIsModalOpen(false)
    navigate("/profile")
  }

  // Placeholder for navigation, replace with actual paths or functions
  const navigateTo = (path: string) => {
    setIsMenuOpen(false) // Close mobile menu if open
    navigate(path)
  }


  console.log(currentUser);


  return (
    <div className="navbar py-4">
      <div className="relative container flex items-center justify-between max-w-[1200px] w-full mx-auto px-5">
        <button className="md:hidden cursor-pointer" onClick={() => setIsMenuOpen(true)}>
          <img className="" src={menu || "/placeholder.svg"} alt="Menu" />
        </button>
        <a className="hidden md:flex cursor-pointer" onClick={() => navigateTo("/")}>
          <img className="flex w-10 h-12" src={logo || "/placeholder.svg"} alt="logo" />
        </a>
        <ul className="list md:flex hidden items-center gap-10">
          <li className="item">
            <a
              onClick={() => navigateTo("/")}
              className="cursor-pointer link font-medium text-base leading-[130%] tracking-[0%] font-manrope text-gray-600 hover:text-blue-600 active:text-blue-600"
            >
              Bosh sahifa
            </a>
          </li>
          <li className="item">
            <a
              onClick={() => navigateTo("/community")} // Assuming a /community route
              className="cursor-pointer link font-medium text-base leading-[130%] tracking-[0%] font-manrope text-gray-600 hover:text-blue-600 active:text-blue-600"
            >
              Community
            </a>
          </li>
          <li className="item">
            <a
              onClick={() => navigateTo("/blog")} // Assuming an /about route
              className="cursor-pointer link font-medium text-base leading-[130%] tracking-[0%] font-manrope text-gray-600 hover:text-blue-600 active:text-blue-600"
            >
              Biz haqimizda
            </a>
          </li>
          <li className="item">
            <a
              onClick={() => navigateTo("/help")} // Assuming a /help route
              className="cursor-pointer link font-medium text-base leading-[130%] tracking-[0%] font-manrope text-gray-600 hover:text-blue-600 active:text-blue-600"
            >
              Yordam
            </a>
          </li>
        </ul>
        <div className="right flex items-center gap-2">
          <button
            className="flex justify-center items-center gap-1 md:h-11 h-10 md:w-auto w-10 rounded-[8px] border-[0.5px] border-gray-100 bg-gray-50 px-2 cursor-pointer hover:bg-gray-200 active:bg-gray-100"
            onClick={goGoal}
          >
            <img className="w-6 h-6" src={add || "/placeholder.svg"} alt="add" />
            <span className="hidden lg:flex text-gray-800 font-roboto font-normal text-base leading-[140%] tracking-normal">
              Maqsad qo'shish
            </span>
          </button>
          <button className="flex justify-center items-center md:w-11 md:h-11 w-10 h-10 rounded-[8px] border-[0.5px] border-gray-100 bg-gray-50 cursor-pointer hover:bg-gray-100 active:bg-gray-200">
            <img className="w-6 h-6" src={notificat || "/placeholder.svg"} alt="Notifications" />
          </button>
          {currentUser ? (
            <button
              className="flex justify-center items-center lg:w-11 lg:h-11 w-10 h-10 rounded-[8px] border-none cursor-pointer hover:bg-gray-300 active:bg-gray-400"
              onClick={() => setIsModalOpen((prev) => !prev)}
            >
              {currentUser.avatar ? (
                <img
                  className="w-full h-full rounded-full object-cover"
                  src={currentUser.avatar || "/placeholder.svg"}
                  alt="User Avatar"
                />
              ) : (
                <img className="w-6 h-6" src={userIcon || "/placeholder.svg"} alt="User" />
              )}
            </button>
          ) : (
            !isLoadingUser && ( // Only show login if not loading and no user
              <button
                onClick={() => navigate("/login")}
                className="flex justify-center items-center lg:w-auto lg:h-11 px-4 h-10 rounded-[8px] border-none bg-blue-600 text-white cursor-pointer hover:bg-blue-400 active:bg-blue300"
              >
                Kirish
              </button>
            )
          )}
        </div>
        {/* setting modal */}
        {currentUser && (
          <div
            className={`absolute top-20 right-5 z-30 w-[285px] rounded-2xl bg-gray-50 border-[0.5px] border-gray-100 py-5 transform transition-transform duration-300 ease-in-out
            ${isModalOpen ? "translate-x-0" : "translate-x-full hidden"}`}
          >
            <div className="flex items-center gap-2 pb-5 pl-4">
              <img
                className="w-10 h-10 rounded-full object-cover"
                src={currentUser.avatar || "/profile/default_avatar.png"}
                alt="Profile"
              />
              <div>
                <p className="text-gray-900 font-manrope font-semibold text-[16px] leading-[130%] tracking-[0%]">
                  {currentUser.fullName}
                </p>
                <p className="text-gray-800 font-manrope font-normal text-[14px] leading-[140%] tracking-[0%]">
                  {currentUser.email}
                </p>
              </div>
            </div>
            <hr className="w-full h-[1px] bg-gray-200 border-none" />
            <div
              className="flex items-center gap-2 pl-4 pt-5 pb-4 cursor-pointer hover:bg-gray-100"
              onClick={goToProfile}
            >
              <img className="flex w-6 h-6" src={userr || "/placeholder.svg"} alt="Profile" />
              <p className="text-gray-900 font-manrope font-medium text-[16px] leading-[130%] tracking-[0%]">Profile</p>
            </div>
            <div
              className="flex items-center gap-2 pl-4 pb-5 cursor-pointer hover:bg-gray-100"
              onClick={() => {
                setIsModalOpen(false)
                navigateTo("/goals")
              }} // Assuming /goals route
            >
              <img className="flex w-6 h-6" src={setting || "/placeholder.svg"} alt="Settings" />
              <p className="text-gray-900 font-manrope font-medium text-[16px] leading-[130%] tracking-[0%]">
                Maqsaddlarim
              </p>
            </div>
            <hr className="w-full h-[1px] bg-gray-200 border-none" />
            <div
              className="flex items-center gap-2 pl-4 pt-5 cursor-pointer hover:bg-gray-100"
              onClick={() => {
                setIsModalOpen(false)
                navigateTo("/help")
              }} // Assuming /help route
            >
              <img className="flex w-6 h-6" src={message || "/placeholder.svg"} alt="Help" />
              <p className="text-gray-900 font-manrope font-medium text-[16px] leading-[130%] tracking-[0%]">Yordam</p>
            </div>
            <div className="flex items-center gap-2 pl-4 pt-4 cursor-pointer hover:bg-gray-100" onClick={handleLogout}>
              <img className="flex w-6 h-6" src={logoutIcon || "/placeholder.svg"} alt="Logout" />
              <p className="text-gray-900 font-manrope font-medium text-[16px] leading-[130%] tracking-[0%]">Chiqish</p>
            </div>
          </div>
        )}
      </div>
      {/* respons-modal */}
      <div
        className={`respons-modal flex flex-col lg:hidden fixed z-30 top-0 left-0 shadow-md h-full bg-white transform transition-transform duration-300 ease-in-out py-6 px-8 gap-3
        ${isMenuOpen ? "translate-x-0" : "-translate-x-full"} `}
      >
        <button className="close text-left cursor-pointer pb-4 text-2xl font-bold" onClick={() => setIsMenuOpen(false)}>
          &times; {/* Using HTML entity for 'x' */}
        </button>
        <a
          onClick={() => navigateTo("/")}
          className="cursor-pointer link font-medium text-base leading-[130%] tracking-[0%] font-manrope text-gray-600 hover:text-blue-600 active:text-blue-600"
        >
          Bosh sahifa
        </a>
        <a
          onClick={() => navigateTo("/community")}
          className="cursor-pointer link font-medium text-base leading-[130%] tracking-[0%] font-manrope text-gray-600 hover:text-blue-600 active:text-blue-600"
        >
          Community
        </a>
        <a
          onClick={() => navigateTo("/about")}
          className="cursor-pointer link font-medium text-base leading-[130%] tracking-[0%] font-manrope text-gray-600 hover:text-blue-600 active:text-blue-600"
        >
          Biz haqimizda
        </a>
        <a
          onClick={() => navigateTo("/blog")}
          className="cursor-pointer link font-medium text-base leading-[130%] tracking-[0%] font-manrope text-gray-600 hover:text-blue-600 active:text-blue-600"
        >
          Blog
        </a>
        <a
          onClick={() => navigateTo("/help")}
          className="cursor-pointer link font-medium text-base leading-[130%] tracking-[0%] font-manrope text-gray-600 hover:text-blue-600 active:text-blue-600"
        >
          Yordam
        </a>
        {currentUser && (
          <a
            onClick={handleLogout}
            className="cursor-pointer link font-medium text-base leading-[130%] tracking-[0%] font-manrope text-red-600 hover:text-red-800 active:text-red-700 mt-4"
          >
            Chiqish
          </a>
        )}
      </div>
    </div>
  )
}
export default Navbar
