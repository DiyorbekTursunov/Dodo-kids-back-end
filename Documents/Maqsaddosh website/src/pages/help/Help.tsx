"use client";

import { useState } from "react";
import { Menu, PlusCircle, Bell, User2, Send, ChevronDown } from "lucide-react";
import Navbar from "../../components/navbar/Navbar";

const faqData = [
  {
    id: "item-1",
    question: "Royxatdan o'tib bolmayapti",
    answer:
      "Описание - краткая расшифровка часто задаваемого вопроса. Описывайте информацию, на которую не нашлось ответа на лендинге или которую стоит уточнить. Помогите пользователю решить его проблему и снять нагрузку с центра поддержки",
  },
  {
    id: "item-2",
    question: "Parolni unutdim, nima qilish kerak?",
    answer:
      "Agar parolingizni unutgan bo'lsangiz, 'Parolni tiklash' sahifasiga o'ting va ko'rsatmalarga amal qiling. Emailingizga parolni tiklash uchun havola yuboriladi.",
  },
  {
    id: "item-3",
    question: "Platformadan qanday foydalanish mumkin?",
    answer:
      "Platformadan foydalanish bo'yicha to'liq qo'llanma 'Qo'llanmalar' bo'limida mavjud. Shuningdek, har bir bo'limda yordamchi maslahatlar topishingiz mumkin.",
  },
  {
    id: "item-4",
    question: "To'lov usullari qanday?",
    answer:
      "Biz turli xil to'lov usullarini qabul qilamiz, jumladan bank kartalari (Visa, MasterCard), elektron hamyonlar va bank o'tkazmalari. Batafsil ma'lumot 'To'lov' sahifasida.",
  },
  {
    id: "item-5",
    question: "Qo'llab-quvvatlash xizmatiga qanday bog'lansam bo'ladi?",
    answer:
      "Qo'llab-quvvatlash xizmatiga ushbu sahifadagi 'BOG'LANISH' tugmasi orqali, yoki support@example.com elektron pochta manziliga xat yozish orqali bog'lanishingiz mumkin.",
  },
];

export default function SupportPage() {
  const [openAccordionItemId, setOpenAccordionItemId] = useState<
    string | undefined
  >(faqData[0].id);

  const handleAccordionToggle = (itemId: string) => {
    setOpenAccordionItemId((prevId) =>
      prevId === itemId ? undefined : itemId
    );
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="max-w-[1200px] mx-auto">
        {/* Header */}
        <Navbar />

        {/* Main Content */}
        <main className="flex flex-col lg:flex-row lg:justify-between px-6 py-12 gap-12 lg:gap-[100px]">
          {/* Left Section */}
          <div className="lg:w-[500px] flex-shrink-0">
            <p className="text-gray-600 text-xl mb-6">Yordam kerakmi?</p>
            <h1 className="text-4xl lg:text-[40px] font-bold leading-tight text-gray-800 mb-8">
              Bizda 24/7 mavjud qo'llab-quvvatlash.
            </h1>
            <button
              type="button"
              className="bg-blue-700 hover:bg-blue-600 text-white px-8 py-4 rounded-2xl h-[60px] w-full sm:w-[285px] text-base font-semibold flex items-center justify-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Send className="w-5 h-5" />
              BOG'LANISH
            </button>
          </div>

          {/* Right Section - Custom Accordion */}
          <div className="lg:w-[600px] flex-shrink-0">
            <div className="w-full flex flex-col gap-4">
              {faqData.map((item) => {
                const isOpen = openAccordionItemId === item.id;
                return (
                  <div
                    key={item.id}
                    className={`rounded-xl overflow-hidden border transition-all duration-300 ${
                      isOpen
                        ? "bg-gradient-to-br from-blue-600 to-blue-700 border-transparent text-white"
                        : "bg-white border-gray-200 text-gray-800 hover:border-gray-300"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleAccordionToggle(item.id)}
                      aria-expanded={isOpen}
                      aria-controls={`faq-content-${item.id}`}
                      className={`flex justify-between items-center w-full px-6 py-5 text-left font-medium text-base group focus:outline-none ${
                        isOpen ? "text-white" : "text-gray-700 hover:text-gray-900"
                      }`}
                    >
                      <span className="flex-grow">{item.question}</span>
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-200 ml-4 shrink-0 ${
                          isOpen ? "bg-white" : "bg-gray-100 group-hover:bg-gray-200"
                        }`}
                      >
                        <ChevronDown
                          className={`w-4 h-4 transition-transform duration-300 ${
                            isOpen
                              ? "rotate-180 text-blue-700"
                              : "text-gray-500 group-hover:text-gray-700"
                          }`}
                        />
                      </div>
                    </button>
                    {isOpen && (
                      <div
                        id={`faq-content-${item.id}`}
                        className="px-6 pb-6 text-sm opacity-95"
                      >
                        {item.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
