import type {
	LoginUserResponse,
	MonitorResponse,
	ServerGroupResponse,
	ServiceHistoryResponse,
	ServiceResponse,
	ServiceSummaryResponse,
	SettingResponse,
} from "@/types/nezha-api";

let lastestRefreshTokenAt = 0;

export const fetchServerGroup = async (): Promise<ServerGroupResponse> => {
	const response = await fetch("/api/v1/server-group");
	const data = await response.json();
	if (data.error) {
		throw new Error(data.error);
	}
	return data;
};

export const fetchLoginUser = async (): Promise<LoginUserResponse> => {
	const response = await fetch("/api/v1/profile");
	const data = await response.json();
	if (data.error) {
		throw new Error(data.error);
	}

	// auto refresh token
	if (
		document.cookie &&
		(!lastestRefreshTokenAt ||
			Date.now() - lastestRefreshTokenAt > 1000 * 60 * 60)
	) {
		lastestRefreshTokenAt = Date.now();
		fetch("/api/v1/refresh-token");
	}

	return data;
};

type MonitorHistoryOptions = {
	start?: number;
	end?: number;
};

const normalizeTimestampSeconds = (timestamp: number) =>
	timestamp > 1_000_000_000_000 ? Math.floor(timestamp / 1000) : timestamp;

const normalizeTimestampMs = (timestamp: number) =>
	timestamp < 1_000_000_000_000 ? timestamp * 1000 : timestamp;

export const fetchMonitor = async (
	service_id: number,
	options: MonitorHistoryOptions = {},
): Promise<MonitorResponse> => {
	const params = new URLSearchParams();
	if (options.start !== undefined) {
		params.set("start", String(normalizeTimestampSeconds(options.start)));
	}
	if (options.end !== undefined) {
		params.set("end", String(normalizeTimestampSeconds(options.end)));
	}
	const query = params.toString();

	const response = await fetch(
		`/api/v1/service/${service_id}/history${query ? `?${query}` : ""}`,
	);
	const data = (await response.json()) as ServiceHistoryResponse;
	if (data.error) {
		throw new Error(data.error);
	}

	const history = data.data;
	const timestamps = history?.timestamps ?? [];
	if (timestamps.length === 0) {
		return { success: data.success, data: [] };
	}

	const serviceName = history?.service_name?.trim() || `Service ${service_id}`;
	const createdAt = timestamps.map((timestamp) =>
		normalizeTimestampMs(timestamp),
	);
	const packetLoss = timestamps.map((_, index) => {
		const up = history?.up?.[index] ?? 0;
		const down = history?.down?.[index] ?? 0;
		const total = up + down;
		if (total <= 0) {
			return 0;
		}
		return Number(((down / total) * 100).toFixed(2));
	});

	return {
		success: data.success,
		data: [
			{
				monitor_id: history?.service_id ?? service_id,
				monitor_name: serviceName,
				server_id: history?.service_id ?? service_id,
				server_name: serviceName,
				created_at: createdAt,
				avg_delay: history?.avg_delay ?? [],
				packet_loss: packetLoss,
			},
		],
	};
};

export const fetchService = async (): Promise<ServiceResponse> => {
	const response = await fetch("/api/v1/service");
	const data = await response.json();
	if (data.error) {
		throw new Error(data.error);
	}
	return data;
};

export const fetchServiceSummary = async (
	service_id: number,
	options: { days?: number } = {},
): Promise<ServiceSummaryResponse> => {
	const params = new URLSearchParams();
	if (options.days !== undefined) {
		params.set("days", String(options.days));
	}
	const query = params.toString();

	const response = await fetch(
		`/api/v1/service/${service_id}/summary${query ? `?${query}` : ""}`,
	);
	const data = (await response.json()) as ServiceSummaryResponse;
	if (data.error) {
		throw new Error(data.error);
	}
	return data;
};

export const fetchSetting = async (): Promise<SettingResponse> => {
	const response = await fetch("/api/v1/setting");
	const data = await response.json();
	if (data.error) {
		throw new Error(data.error);
	}
	return data;
};
