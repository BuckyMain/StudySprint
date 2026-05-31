import { MongoClient, ServerApiVersion } from 'mongodb';
import { env } from '$env/dynamic/private';
import { ensureLegacyOwnershipMigration } from '$lib/server/migrations';

let client = null;
let dbInstance;
let indexesEnsured = false;

async function ensureIndexes(db) {
	if (indexesEnsured) return;
	await db.collection('semesters').dropIndex('name_1').catch(() => {});
	await Promise.all([
		db.collection('tasks').createIndex({ userId: 1, semesterId: 1, status: 1 }),
		db.collection('tasks').createIndex({ userId: 1, dueDate: 1 }),
		db.collection('tasks').createIndex({ userId: 1, moduleId: 1 }),
		db.collection('modules').createIndex({ userId: 1, semesterId: 1, name: 1 }, { unique: true }),
		db.collection('reflections').createIndex({ userId: 1, taskId: 1 }),
		db.collection('semesters').createIndex({ userId: 1, name: 1 }, { unique: true }),
		db.collection('settings').createIndex({ userId: 1 }, { unique: true }),
		db.collection('users').createIndex({ email: 1 }, { unique: true }),
		db.collection('sessions').createIndex({ tokenHash: 1 }, { unique: true }),
		db.collection('sessions').createIndex({ userId: 1 }),
		db.collection('sessions').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
	]);
	await ensureLegacyOwnershipMigration(db);
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

