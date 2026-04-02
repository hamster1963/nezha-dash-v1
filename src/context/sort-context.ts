import { createContext } from "react";

export type SortType =
	| "default"
	| "name"
	| "uptime"
	| "system"
	| "cpu"
	| "mem"
	| "disk"
	| "up"
	| "down"
	| "up total"
	| "down total";

export const SORT_TYPES: SortType[] = [
	"default",
	"name",
	"uptime",
	"system",
	"cpu",
	"mem",
	"disk",
	"up",
	"down",
	"up total",
	"down total",
];

export type SortOrder = "asc" | "desc";

export const SORT_ORDERS: SortOrder[] = ["desc", "asc"];

export interface SortContextType {
	sortType: SortType;
	sortOrder: SortOrder;
	setSortType: (sortType: SortType) => void;
	setSortOrder: (sortOrder: SortOrder) => void;
}

export const SortContext = createContext<SortContextType | undefined>(
	undefined,
);
