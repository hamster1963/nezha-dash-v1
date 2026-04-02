import { type ReactNode, useState } from "react";

import { type Status, StatusContext } from "./status-context";

export function StatusProvider({ children }: { children: ReactNode }) {
	const [status, setStatus] = useState<Status>("all");

	return (
		<StatusContext.Provider value={{ status, setStatus }}>
			{children}
		</StatusContext.Provider>
	);
}
