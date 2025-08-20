import { serve } from "@hono/node-server";
import chat from "./chat.js";
import { getProviderKeys, isValidApiKey } from "./lib/keys.js";
import { createHono } from "./hono.js";
import { cors } from "hono/cors";

const app = createHono().basePath("/v1");
app.use(
	"*",
	cors({
		origin: "*",
		allowHeaders: ["Authorization", "Content-Type"],
		allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
	})
);

app.use("*", async (c, next) => {
	const auth = c.req.header("Authorization");
	if (!auth) {
		console.log("No auth header found");
		return c.json({ error: "Unauthorized" }, 401);
	}

	const key = auth.split(" ")[1];
	if (!key) {
		console.log("No key found");
		return c.json({ error: "Unauthorized" }, 401);
	}
	const isValid = await isValidApiKey(key);
	if (!isValid) {
		console.log("Invalid key");
		return c.json({ error: "Unauthorized" }, 401);
	}

	const providerKeys = await getProviderKeys(key);
	if (!providerKeys) {
		console.log("No provider keys found");
		return c.json({ error: "Unauthorized" }, 401);
	}

	c.set("providers", providerKeys);
	c.set("apiKey", key);
	return next();
});
app.route("/chat", chat);

serve(
	{
		fetch: app.fetch,
		port: 3001,
	},
	(info) => {
		console.log(`Server is running on http://localhost:${info.port}`);
	}
);
