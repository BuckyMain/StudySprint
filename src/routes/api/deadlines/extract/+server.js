import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { requireUser } from '$lib/server/auth';

const DATE_REGEX = /\b(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{2,4})\b/g;

function normalizeDate(day, month, year) {
	const normalizedYear = year.length === 2 ? `20${year}` : year;
	return `${normalizedYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function moduleFromLine(line) {
	const cleaned = line.toLowerCase();
	if (cleaned.includes('datenbank')) return 'Datenbanken';
	if (cleaned.includes('mathe')) return 'Mathematik';
	if (cleaned.includes('proto')) return 'Prototyping';
	if (cleaned.includes('software')) return 'Software Engineering';
	return 'Allgemein';
}

export async function POST(event) {
	const { request } = event;
	const db = await getDb();
	const auth = await requireUser(event, db);
	if (!auth.ok) return auth.response;

	const { text } = await request.json();
	const source = String(text || '').trim();
	if (!source) return json({ items: [] });

	const lines = source
		.split('\n')
		.map((line) => line.trim())
		.filter(Boolean);

	const items = [];

	for (const line of lines) {
		const matches = [...line.matchAll(DATE_REGEX)];
		for (const match of matches) {
			const [, day, month, year] = match;
			const dueDate = normalizeDate(day, month, year);
			const title = line.replace(match[0], '').replace(/[-|:]/g, ' ').trim() || `Abgabe ${dueDate}`;
			items.push({
				title,
				module: moduleFromLine(line),
				dueDate,
				priority: 'Hoch'
			});
		}
	}

	return json({ items });
}
