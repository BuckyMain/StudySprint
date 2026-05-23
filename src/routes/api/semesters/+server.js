import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';

function normalizeColor(value) {
	const color = String(value || '').trim();
	if (!color) return '#2563eb';
	return color;
}

export async function GET() {
	const db = await getDb();
	const semesters = await db
		.collection('semesters')
		.find({})
		.sort({ isActive: -1, createdAt: -1 })
		.toArray();
	return json(semesters);
}

export async function POST({ request }) {
	const payload = await request.json();
	const name = String(payload.name || '').trim();
	const color = normalizeColor(payload.color);

	if (!name) {
		return json({ error: 'Semestername ist erforderlich' }, { status: 400 });
	}

	const db = await getDb();
	const hasAnySemester = await db.collection('semesters').findOne({});
	const semester = {
		name,
		color,
		isActive: payload.isActive === true || !hasAnySemester,
		createdAt: new Date(),
		updatedAt: new Date()
	};

	if (semester.isActive) {
		await db.collection('semesters').updateMany({}, { $set: { isActive: false, updatedAt: new Date() } });
	}

	try {
		const result = await db.collection('semesters').insertOne(semester);
		return json({ ...semester, _id: result.insertedId });
	} catch (error) {
		if (error?.code === 11000) {
			return json({ error: 'Semester mit diesem Namen existiert bereits' }, { status: 409 });
		}
		throw error;
	}
}
