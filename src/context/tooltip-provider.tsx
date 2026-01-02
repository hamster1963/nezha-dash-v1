import { type ReactNode, useState } from "react";

import { TooltipContext, type TooltipData } from "./tooltip-context";

export function TooltipProvider({ children }: { children: ReactNode }) {
	const [tooltipData, setTooltipData] = useState<TooltipData | null>(null);

	return (
		<TooltipContext.Provider value={{ tooltipData, setTooltipData }}>
			{children}
		</TooltipContext.Provider>
	);
}
