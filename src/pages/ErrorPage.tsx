import { Button } from "@/components/ui/button"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

interface ErrorPageProps {
  code?: string | number
  message?: string
}

export default function ErrorPage({ code = "500", message }: ErrorPageProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-4xl font-semibold">{code}</h1>
        <p className="text-xl text-muted-foreground">{message || t("error.somethingWentWrong")}</p>
        <Button onClick={() => navigate("/")} className="mt-2">
          {t("error.backToHome")}
        </Button>
      </div>
    </div>
  )
}
