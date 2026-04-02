import { useContext } from "react";

import { WebSocketContext } from "../context/websocket-context";

export const useWebSocketContext = () => {
	const context = useContext(WebSocketContext);
	if (context === undefined) {
		throw new Error(
			"useWebSocketContext must be used within a WebSocketProvider",
		);
	}
	return context;
};
