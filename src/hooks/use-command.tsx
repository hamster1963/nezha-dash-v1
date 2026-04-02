import { useContext } from "react";
import { CommandContext } from "@/context/command-context";

export function useCommand() {
	const context = useContext(CommandContext);
	if (context === undefined) {
		throw new Error("useCommand must be used within a CommandProvider");
	}
	return context;
}
