import { type ReactNode, useState } from "react";

import { SortContext, type SortOrder, type SortType } from "./sort-context";

export function SortProvider({ children }: { children: ReactNode }) {
	const [sortType, setSortType] = useState<SortType>("default");
	const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

	return (
		<SortContext.Provider
			value={{ sortType, setSortType, sortOrder, setSortOrder }}
		>
			{children}
		</SortContext.Provider>
	);
}
