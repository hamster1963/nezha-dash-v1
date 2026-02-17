import { createContext } from "react";

export type Status = "all" | "online" | "offline";

export interface StatusContextType {
	status: Status;
	setStatus: (status: Status) => void;
}

export const StatusContext = createContext<StatusContextType | undefined>(
	undefined,
);
