// Already provided in the previous response.
// Contains User, Goal, Direction, SubDirection interfaces.
export interface User {
  id: string
  email: string
  fullName: string
  avatar?: string | null
  googleId?: string | null
  telegramId?: string | null
}

export interface Goal {
  id: string
  name: string
  description: string | null
  direction: string // This might be an ID, ensure consistency with backend
  subDirection: string | null // This might be an ID
  duration: number
  visibility: "PUBLIC" | "PRIVATE"
  phone: string
  telegram: string
  status: "ACTIVE" | "COMPLETED" | "CANCELLED"
  startDate: string // ISO Date string
  endDate: string // ISO Date string
  creatorId: string
  creator: {
    id: string
    fullName: string
    avatar: string | null
  }
  participants: Array<{
    userId: string
    role: "PARTICIPANT" | "ADMIN" | "REMOVED"
    avatar?: string // Assuming participant might have an avatar URL
  }>
}

export interface Direction {
  id: string
  name: string
  subDirections?: SubDirection[] // Optional if not always fetched together
}

export interface SubDirection {
  id: string
  name: string
  directionId?: string // Foreign key
}
