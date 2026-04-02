import { useContext } from "react";

import { StatusContext } from "../context/status-context";

export function useStatus() {
	const context = useContext(StatusContext);
	if (context === undefined) {
		throw new Error("useStatus must be used within a StatusProvider");
	}
	return context;
}
