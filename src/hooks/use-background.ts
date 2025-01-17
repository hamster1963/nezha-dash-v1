import { useEffect, useState } from "react"

declare global {
  interface Window {
    CustomBackgroundImage: string
  }
}

const BACKGROUND_CHANGE_EVENT = "backgroundChange"

export function useBackground() {
  const [backgroundImage, setBackgroundImage] = useState<string | undefined>(() => {
    // 首先检查 sessionStorage 中是否有保存的背景图
    const savedImage = sessionStorage.getItem("savedBackgroundImage")
    // 如果 window.CustomBackgroundImage 为空但有保存的背景图，则恢复它
    if (!window.CustomBackgroundImage && savedImage) {
      window.CustomBackgroundImage = savedImage
    }
    return window.CustomBackgroundImage || undefined
  })

  useEffect(() => {
    const handleBackgroundChange = () => {
      setBackgroundImage(window.CustomBackgroundImage || undefined)
    }

    window.addEventListener(BACKGROUND_CHANGE_EVENT, handleBackgroundChange)
    return () => window.removeEventListener(BACKGROUND_CHANGE_EVENT, handleBackgroundChange)
  }, [])

  const updateBackground = (newBackground: string | undefined) => {
    window.CustomBackgroundImage = newBackground || ""
    window.dispatchEvent(new Event(BACKGROUND_CHANGE_EVENT))
  }

  return { backgroundImage, updateBackground }
}
