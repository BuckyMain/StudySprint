import { json } from '@sveltejs/kit';
import { GoogleGenAI } from '@google/genai';
import { env } from '$env/dynamic/private';

const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

function stripCodeFence(value) {
	return String(value || '')
		.replace(/^```json\s*/i, '')
		.replace(/^```\s*/i, '')
		.replace(/\s*```$/, '')
		.trim();
}

function normalizeDate(dateValue) {
	const value = String(dateValue || '').trim();
	if (!value) return null;

	// Accepts dd.mm.yyyy and yyyy-mm-dd formats
	const dotMatch = value.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
	if (dotMatch) {
		const [, day, month, year] = dotMatch;
		const normalizedYear = year.length === 2 ? `20${year}` : year;
		return `${normalizedYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
	}

	const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
	if (isoMatch) return value;

	return null;
}

function sanitizeItems(items) {
	if (!Array.isArray(items)) return [];

	return items
		.map((item) => {
			const title = String(item?.title || '').trim();
			const module = String(item?.module || 'Allgemein').trim() || 'Allgemein';
			const dueDate = normalizeDate(item?.dueDate);
			const priority = ['Hoch', 'Mittel', 'Niedrig'].includes(item?.priority)
				? item.priority
				: 'Hoch';

			if (!title || !dueDate) return null;
			return { title, module, dueDate, priority };
		})
		.filter(Boolean);
}

function parseGeminiError(error) {
	const fallback = {
		status: 500,
		message: 'OCR fehlgeschlagen. Bitte erneut versuchen.'
	};

	const raw = String(error?.message || '').trim();
	if (!raw) return fallback;

	const firstBraceIndex = raw.indexOf('{');
	if (firstBraceIndex === -1) {
		return { ...fallback, message: raw };
	}

	try {
		const parsed = JSON.parse(raw.slice(firstBraceIndex));
		const details = parsed?.error || {};
		const statusText = String(details.status || '').toUpperCase();
		const code = Number(details.code);
		const retryDelay = details?.details?.find((item) => item?.['@type']?.includes('RetryInfo'))
			?.retryDelay;

		if (code === 429 || statusText === 'RESOURCE_EXHAUSTED') {
			const waitSeconds = Number.parseInt(String(retryDelay || '').replace(/[^\d]/g, ''), 10);
			const waitHint = Number.isFinite(waitSeconds)
				? ` Bitte in ca. ${waitSeconds} Sekunden erneut versuchen.`
				: ' Bitte spaeter erneut versuchen.';
			return {
				status: 429,
				message:
					'OCR Kontingent aufgebraucht (Gemini API). Pruefe API-Billing/Quota im Google AI Studio.' +
					waitHint
			};
		}

		const detailsMessage = String(details.message || '').toLowerCase();
		if (
			detailsMessage.includes('no longer available') ||
			detailsMessage.includes('not found for api version') ||
			detailsMessage.includes('unsupported model')
		) {
			return {
				status: 400,
				message:
					'Das konfigurierte Gemini-Modell ist nicht verfuegbar. Nutze GEMINI_MODEL=gemini-2.5-flash (oder ein aktuelles Modell) in der .env.'
			};
		}

		return {
			status: Number.isFinite(code) && code >= 400 ? code : 500,
			message: details.message || fallback.message
		};
	} catch {
		return { ...fallback, message: raw };
	}
}

export async function POST({ request }) {
	if (!env.GEMINI_API_KEY) {
		return json({ error: 'GEMINI_API_KEY fehlt in den Umgebungsvariablen.' }, { status: 500 });
	}

	const payload = await request.json();
	const imageBase64 = String(payload?.imageBase64 || '').trim();
	const mimeType = String(payload?.mimeType || 'image/png').trim();
	const model = String(env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL).trim();

	if (!imageBase64) {
		return json({ error: 'imageBase64 ist erforderlich.' }, { status: 400 });
	}

	try {
		const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
		const response = await ai.models.generateContent({
			model,
			contents: [
				{
					role: 'user',
					parts: [
						{
							text: [
								'Extrahiere alle Abgabe-Deadlines aus diesem Semesterplan-Bild.',
								'Antwort NUR als JSON-Objekt ohne Erklaerung mit Schema:',
								'{ "items": [ { "title": "string", "module": "string", "dueDate": "yyyy-mm-dd", "priority": "Hoch|Mittel|Niedrig" } ] }',
								'Wenn eine Information fehlt, triff eine sinnvolle Schaetzung.',
								'Nutze deutschsprachige Titel und Module.'
							].join('\n')
						},
						{
							inlineData: {
								data: imageBase64,
								mimeType
							}
						}
					]
				}
			]
		});

		const rawText = stripCodeFence(response.text);
		const parsed = JSON.parse(rawText);
		const items = sanitizeItems(parsed?.items);

		return json({ items });
	} catch (error) {
		const parsedError = parseGeminiError(error);
		return json(
			{
				error: parsedError.message
			},
			{ status: parsedError.status }
		);
	}
}
