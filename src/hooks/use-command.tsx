import { CommandContext } from "@/context/command-context"
import { useContext } from "react"

export function useCommand() {
  const context = useContext(CommandContext)
  if (context === undefined) {
    throw new Error("useCommand must be used within a CommandProvider")
  }
  return context
}
