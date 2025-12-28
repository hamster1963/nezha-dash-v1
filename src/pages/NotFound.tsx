import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function NotFound() {
	const navigate = useNavigate();
	const { t } = useTranslation();

	return (
		<div className="flex  flex-col items-center justify-center">
			<div className="flex flex-col items-center gap-2">
				<h1 className="text-4xl font-semibold">404</h1>
				<p className="text-xl text-muted-foreground">
					{t("error.pageNotFound")}
				</p>
				<Button onClick={() => navigate("/")} className="mt-2">
					{t("error.backToHome")}
				</Button>
			</div>
		</div>
	);
}
