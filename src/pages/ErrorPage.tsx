import { useTranslation } from "react-i18next";

interface ErrorPageProps {
	code?: string | number;
	message?: string;
}

export default function ErrorPage({ code = "500", message }: ErrorPageProps) {
	const { t } = useTranslation();

	return (
		<div className="flex flex-col items-center justify-center">
			<div className="flex flex-col items-center gap-2">
				<h1 className="text-4xl font-semibold">{code}</h1>
				<p className="text-xl text-muted-foreground">
					{message || t("error.somethingWentWrong")}
				</p>
			</div>
		</div>
	);
}
