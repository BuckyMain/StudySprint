import { MongoClient, ServerApiVersion } from 'mongodb';
import { env } from '$env/dynamic/private';

let client = null;
let dbInstance;

export async function getDb() {
	const mongodbUri = env.MONGODB_URI;
	const dbName = env.MONGODB_DB_NAME || 'StudySprintDev';

	if (!client && mongodbUri) {
		client = new MongoClient(mongodbUri, {
			serverApi: {
				version: ServerApiVersion.v1,
				strict: true,
				deprecationErrors: true
			}
		});
	}

	if (!client) {
		throw new Error('Missing MONGODB_URI in environment variables.');
	}

	if (dbInstance) {
		return dbInstance;
	}

	await client.connect();
	dbInstance = client.db(dbName);
	return dbInstance;
}

export async function closeDbConnection() {
	if (!dbInstance) {
		return;
	}

	await client.close();
	dbInstance = null;
}
