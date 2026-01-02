import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";

// Get git commit hash
const getGitHash = () => {
	try {
		return execSync("git rev-parse --short HEAD").toString().trim();
	} catch (e) {
		console.log(e);
		return "unknown";
	}
};

// https://vite.dev/config/
export default defineConfig({
	base: "/",
	define: {
		"import.meta.env.VITE_GIT_HASH": JSON.stringify(getGitHash()),
	},
	plugins: [react()],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
	server: {
		https: {
			key: fs.readFileSync("./.cert/key.pem"),
			cert: fs.readFileSync("./.cert/cert.pem"),
		},
		proxy: {
			"/api/v1/ws/server": {
				target: "ws://localhost:8008",
				changeOrigin: true,
				ws: true,
			},
			"/api/v1/": {
				target: "http://localhost:8008",
				changeOrigin: true,
			},
		},
		headers: {
			"Cache-Control": "no-store",
			Pragma: "no-cache",
		},
	},
	build: {
		rollupOptions: {
			output: {
				entryFileNames: `assets/[name].[hash].js`,
				chunkFileNames: `assets/[name].[hash].js`,
				assetFileNames: `assets/[name].[hash].[ext]`,
				manualChunks(id) {
					if (id.includes("node_modules")) {
						return id
							.toString()
							.split("node_modules/")[1]
							.split("/")[0]
							.toString();
					}
				},
			},
		},
		chunkSizeWarningLimit: 1500,
	},
});
