"use client"

import type React from "react"
import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import { X } from 'lucide-react'
import "../app/modal.css"
import { IMaskInput } from "react-imask"

interface FormModalProps {
  isOpen: boolean
  onClose: () => void
}

export function FormModal({ isOpen, onClose }: FormModalProps) {
  const router = useRouter()
  const modalContentRef = useRef<HTMLDivElement>(null)

  const [formData, setFormData] = useState({
    firstName: "",
    phone: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Function to format date as YYYY-MM-DD HH:MM
  const formatDate = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0') // +1 because months are 0-based
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Create FormData object
    const formDataToSend = new FormData()
    formDataToSend.append("Ism va Familya", `${formData.firstName}`)
    formDataToSend.append("Telefon raqam", formData.phone)
    formDataToSend.append("Qoshilgan vaqti", formatDate(new Date()))
    router.push("/thank-you")
    try {
      await axios.post(
        "https://script.google.com/macros/s/AKfycbzmBH02lYkrgLlbTDQz-1ApbnZvO9c__pt9COaaoeL9k0r2GXEqygm5kG6Ly4Bs8pQ0/exec",
        formDataToSend,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          }
        }
      )

      console.log("Form successfully submitted:", Object.fromEntries(formDataToSend))
      setFormData({ firstName: "", phone: "" })
      onClose()
    } catch (error) {
      console.error("Error submitting form:", error)
      alert("Ma'lumotlarni yuborishda xatolik yuz berdi")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content" ref={modalContentRef}>
        <div className="modal-close-wrapper">
          <button onClick={onClose} className="modal-close">
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-header">
            <h2 className="modal-title">Xoziroq ro&apos;yhatdan o&apos;ting</h2>
          </div>

          <form onSubmit={handleSubmit} className="modal-form">
            <div className="form-group">
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Ism va Familya"
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <IMaskInput
                id="phoneNumber"
                name="phoneNumber"
                mask="+{998} 00 000 00 00"
                value={formData.phone}
                onAccept={(value) => setFormData((prev) => ({ ...prev, phone: value }))}
                required
                disabled={isSubmitting}
                placeholder="+998 __ ___ __ __"
                className="form-input"
              />
            </div>

            <button
              type="submit"
              className="form-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Yuborilmoqda..." : "Yuborish"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}