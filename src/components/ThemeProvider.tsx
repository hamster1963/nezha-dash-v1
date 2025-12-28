import { ReactNode, createContext, useEffect, useState } from "react"

export type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({ children, storageKey = "vite-ui-theme" }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem(storageKey) as Theme) || "system")

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.add("disable-transitions")
    root.classList.remove("light", "dark")

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"

      root.classList.add(systemTheme)
      const themeColor = systemTheme === "dark" ? "hsl(30 15% 8%)" : "hsl(0 0% 98%)"
      document.querySelector('meta[name="theme-color"]')?.setAttribute("content", themeColor)
      const timeoutId = window.setTimeout(() => {
        root.classList.remove("disable-transitions")
      }, 0)
      return () => window.clearTimeout(timeoutId)
    }

    root.classList.add(theme)
    const themeColor = theme === "dark" ? "hsl(30 15% 8%)" : "hsl(0 0% 98%)"
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", themeColor)
    const timeoutId = window.setTimeout(() => {
      root.classList.remove("disable-transitions")
    }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [theme])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme)
      setTheme(theme)
    },
  }

  return <ThemeProviderContext.Provider value={value}>{children}</ThemeProviderContext.Provider>
}

export { ThemeProviderContext }
