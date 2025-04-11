"use client"

import { useState } from "react"
import { FormModal } from "./form-modal"
import "../app/modal.css"

export function ModalButton() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <button onClick={() => setIsModalOpen(true)} className="homeCenterBtn">
        Bepul tomosha qiling
      </button>

      <FormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  )
}
