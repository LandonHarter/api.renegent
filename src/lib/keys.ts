import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function isValidApiKey(apiKey: string) {
	const key = await prisma.apiKey.findUnique({
		where: {
			key: apiKey,
		},
	});
	return key !== null && key.enabled;
}

export async function getProviderKeys(apiKey: string) {
	const key = await prisma.apiKey.findUnique({
		where: {
			key: apiKey,
		},
		include: {
			user: {
				include: {
					Providers: true,
				},
			},
		},
	});
	if (!key) {
		return null;
	}
	return key.user.Providers;
}
