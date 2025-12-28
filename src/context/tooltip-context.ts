import { createContext } from "react";

export interface TooltipData {
	centroid: [number, number];
	country: string;
	count: number;
	servers: Array<{
		id: number;
		name: string;
		status: boolean;
	}>;
}

interface TooltipContextType {
	tooltipData: TooltipData | null;
	setTooltipData: (data: TooltipData | null) => void;
}

export const TooltipContext = createContext<TooltipContextType | undefined>(
	undefined,
);
