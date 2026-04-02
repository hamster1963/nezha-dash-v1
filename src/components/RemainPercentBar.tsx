import { cn } from "@/lib/utils";

import { Progress } from "./ui/progress";

export default function RemainPercentBar({
	value,
	className,
}: {
	value: number;
	className?: string;
}) {
	return (
		<Progress
			aria-label={"Server Usage Bar"}
			aria-labelledby={"Server Usage Bar"}
			value={value}
			indicatorClassName={
				value < 30
					? "bg-red-500"
					: value < 70
						? "bg-orange-400"
						: "bg-green-500"
			}
			className={cn("h-[3px] rounded-sm w-[70px]", className)}
		/>
	);
}
