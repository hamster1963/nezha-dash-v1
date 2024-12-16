import { useQuery } from "@tanstack/react-query"
import React, { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { Route, BrowserRouter as Router, Routes } from "react-router-dom"

import Footer from "./components/Footer"
import Header from "./components/Header"
import { fetchSetting } from "./lib/nezha-api"
import { cn } from "./lib/utils"
import ErrorPage from "./pages/ErrorPage"
import NotFound from "./pages/NotFound"
import Server from "./pages/Server"
import ServerDetail from "./pages/ServerDetail"

const App: React.FC = () => {
  const { data: settingData, error } = useQuery({
    queryKey: ["setting"],
    queryFn: () => fetchSetting(),
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })
  const { i18n } = useTranslation()

  const InjectContext = useCallback((content: string) => {
    const tempDiv = document.createElement("div")
    tempDiv.innerHTML = content

    const handlers: { [key: string]: (element: HTMLElement) => void } = {
      SCRIPT: (element) => {
        const script = document.createElement("script")
        if ((element as HTMLScriptElement).src) {
          script.src = (element as HTMLScriptElement).src
        } else {
          script.textContent = element.textContent
        }
        document.body.appendChild(script)
      },
      STYLE: (element) => {
        const style = document.createElement("style")
        style.textContent = element.textContent
        document.head.appendChild(style)
      },
      DEFAULT: (element) => {
        document.body.appendChild(element)
      },
    }

    Array.from(tempDiv.childNodes).forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement
        ;(handlers[element.tagName] || handlers.DEFAULT)(element)
      } else if (node.nodeType === Node.TEXT_NODE) {
        document.body.appendChild(document.createTextNode(node.textContent || ""))
      }
    })
  }, [])

  if (error) {
    return <ErrorPage code={500} message={error.message} />
  }

  if (!settingData) {
    return null
  }

  if (settingData?.data?.language && !localStorage.getItem("language")) {
    i18n.changeLanguage(settingData?.data?.language)
  }

  if (settingData?.data?.custom_code) {
    InjectContext(settingData?.data?.custom_code)
  }

  const customBackgroundImage =
    // @ts-expect-error ShowNetTransfer is a global variable
    (window.CustomBackgroundImage as string) !== "" ? window.CustomBackgroundImage : undefined

  return (
    <Router basename={import.meta.env.BASE_URL}>
      <div
        className={cn("flex min-h-screen w-full flex-col", {
          " bg-background": !customBackgroundImage,
        })}
        style={{
          backgroundImage: customBackgroundImage ? "url(" + customBackgroundImage + ")" : undefined,
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
        }}
      >
        <main className="flex min-h-[calc(100vh-calc(var(--spacing)*16))] flex-1 flex-col gap-4 p-4 md:p-10 md:pt-8">
          <Header />
          <Routes>
            <Route path="/" element={<Server />} />
            <Route path="/server/:id" element={<ServerDetail />} />
            <Route path="/error" element={<ErrorPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Footer />
        </main>
      </div>
    </Router>
  )
}

export default App
