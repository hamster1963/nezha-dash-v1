import { ReactNode, useCallback, useState } from "react"

import { CommandContext } from "./command-context"

export function CommandProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const openCommand = useCallback(() => setIsOpen(true), [])
  const closeCommand = useCallback(() => setIsOpen(false), [])
  const toggleCommand = useCallback(() => setIsOpen((prev) => !prev), [])

  return (
    <CommandContext.Provider
      value={{
        isOpen,
        openCommand,
        closeCommand,
        toggleCommand,
      }}
    >
      {children}
    </CommandContext.Provider>
  )
}
