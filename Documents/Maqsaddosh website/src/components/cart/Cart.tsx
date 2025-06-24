// This component seems presentational.
// Props type definition for clarity
"use client"

interface CartProps {
  title: string
  icon: string // Path to the icon
  bgColor: string // Tailwind background class
  iconColor: string // Tailwind background class for icon container
}




function Cart({ title, icon, bgColor, iconColor }: CartProps) {
  return (
    <div
      className={`transition-all duration-300 flex items-center justify-between h-20 rounded-2xl border-[0.5px] border-gray-200 p-4 ${bgColor} cursor-pointer hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]`}
    >
      <span className="font-manrope font-semibold text-[18px] sm:text-[20px] leading-[130%] tracking-[0%] text-gray-900">
        {title}
      </span>
      <div className={`w-10 h-10 rounded-lg ${iconColor} p-2 flex items-center justify-center`}>
        <img src={icon || "/placeholder.svg"} alt={title} className="w-6 h-6" />
      </div>
    </div>
  )
}
export default Cart
