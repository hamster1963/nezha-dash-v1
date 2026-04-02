import { createContext } from "react";

export interface WebSocketContextType {
	lastMessage: { data: string } | null;
	connected: boolean;
	messageHistory: { data: string }[];
	reconnect: () => void;
	needReconnect: boolean;
	setNeedReconnect: (needReconnect: boolean) => void;
}

export const WebSocketContext = createContext<WebSocketContextType>({
	lastMessage: null,
	connected: false,
	messageHistory: [],
	reconnect: () => {},
	needReconnect: false,
	setNeedReconnect: () => {},
});
