import { createContext } from "react"

export interface CommandContextType {
  isOpen: boolean
  openCommand: () => void
  closeCommand: () => void
  toggleCommand: () => void
}

export const CommandContext = createContext<CommandContextType | undefined>(undefined)
