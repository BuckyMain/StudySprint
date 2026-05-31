import { env } from '$env/dynamic/private';
import { hashPassword, normalizeEmail } from '$lib/server/auth';

let legacyOwnershipMigrationChecked = false;

const OWNED_COLLECTIONS = ['tasks', 'reflections', 'modules', 'semesters', 'settings'];

function hasLegacyOwnerlessData(db) {
	return Promise.all(
		OWNED_COLLECTIONS.map((collectionName) =>
			db.collection(collectionName).findOne({
				$or: [{ userId: { $exists: false } }, { userId: '' }, { userId: null }]
			})
		)
	).then((docs) => docs.some(Boolean));
}

async function getOrCreateBootstrapUser(db) {
	const email = normalizeEmail(env.AUTH_BOOTSTRAP_EMAIL);
	const password = String(env.AUTH_BOOTSTRAP_PASSWORD || '');
	if (!email || !password) {
		throw new Error(
			'Legacy migration requires AUTH_BOOTSTRAP_EMAIL and AUTH_BOOTSTRAP_PASSWORD environment variables.'
		);
	}

	const users = db.collection('users');
	const existingUser = await users.findOne({ email });
	if (existingUser) return String(existingUser._id);

	const now = new Date();
	const passwordHash = await hashPassword(password);
	const result = await users.insertOne({
		email,
		passwordHash,
		createdAt: now,
		updatedAt: now
	});
	return String(result.insertedId);
}

export async function ensureLegacyOwnershipMigration(db) {
	if (legacyOwnershipMigrationChecked) return;

	const requiresMigration = await hasLegacyOwnerlessData(db);
	if (!requiresMigration) {
		legacyOwnershipMigrationChecked = true;
		return;
	}

	const ownerUserId = await getOrCreateBootstrapUser(db);
	const selector = { $or: [{ userId: { $exists: false } }, { userId: '' }, { userId: null }] };
	const update = { $set: { userId: ownerUserId, updatedAt: new Date() } };

	await Promise.all(
		OWNED_COLLECTIONS.map((collectionName) => db.collection(collectionName).updateMany(selector, update))
	);

	legacyOwnershipMigrationChecked = true;
}

