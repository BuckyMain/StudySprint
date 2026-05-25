import { MongoClient, ServerApiVersion } from 'mongodb';
import { env } from '$env/dynamic/private';

let client = null;
let dbInstance;
let indexesEnsured = false;

async function ensureIndexes(db) {
	if (indexesEnsured) return;
	await Promise.all([
		db.collection('tasks').createIndex({ semesterId: 1, status: 1 }),
		db.collection('tasks').createIndex({ dueDate: 1 }),
		db.collection('tasks').createIndex({ moduleId: 1 }),
		db.collection('modules').createIndex({ semesterId: 1, name: 1 }, { unique: true }),
		db.collection('reflections').createIndex({ taskId: 1 }),
		db.collection('semesters').createIndex({ name: 1 }, { unique: true, sparse: true })
	]);
	indexesEnsured = true;
}

export async function getDb() {
	const mongodbUri = env.MONGODB_URI;
	const dbName = env.MONGODB_DB_NAME || 'StudySprint';

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
	await ensureIndexes(dbInstance);
	return dbInstance;
}

