import { serve } from "@hono/node-server";
import chat from "./chat.js";
import { getProviderKeys, isValidApiKey } from "./lib/keys.js";
import { createHono } from "./hono.js";

const app = createHono().basePath("/v1");
app.use("*", async (c, next) => {
	const auth = c.req.header("Authorization");
	if (!auth) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const key = auth.split(" ")[1];
	if (!key) {
		return c.json({ error: "Unauthorized" }, 401);
	}
	const isValid = await isValidApiKey(key);
	if (!isValid) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const providerKeys = await getProviderKeys(key);
	if (!providerKeys) {
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
