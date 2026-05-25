export function parseDateValue(value) {
	if (!value) return null;
	if (typeof value === 'string') {
		const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
		if (match) {
			const year = Number(match[1]);
			const month = Number(match[2]);
			const day = Number(match[3]);
			return new Date(year, month - 1, day);
		}
	}
	const parsed = new Date(value);
	return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function startOfLocalDay(date = new Date()) {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function getWeekRange(referenceDate = new Date()) {
	const dayOfWeek = referenceDate.getDay();
	const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
	const weekStart = startOfLocalDay(referenceDate);
	weekStart.setDate(weekStart.getDate() + diffToMonday);
	const weekEnd = new Date(weekStart);
	weekEnd.setDate(weekStart.getDate() + 7);
	return { weekStart, weekEnd };
}

export function getMonthRange(referenceDate = new Date()) {
	const monthStart = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
	const nextMonthStart = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 1);
	return { monthStart, nextMonthStart };
}

export function formatDate(value) {
	if (!value) return '—';
	const d = parseDateValue(value);
	return !d ? value : d.toLocaleDateString('de-CH');
}

export function formatDateShort(value) {
	const d = value instanceof Date ? value : new Date(value);
	if (Number.isNaN(d.getTime())) return '';
	return d.toLocaleDateString('de-CH');
}

export function formatSeconds(s) {
	return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export function formatOvertime(s) {
	return `+${formatSeconds(Math.max(0, s))}`;
}

export function getProgressPeriodRange(period, referenceDate = new Date()) {
	if (period === 'semester') {
		return {
			start: new Date(1970, 0, 1),
			end: new Date(9999, 11, 31)
		};
	}
	if (period === 'month') {
		const start = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
		const end = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 1);
		return { start, end };
	}
	const { weekStart, weekEnd } = getWeekRange(referenceDate);
	return { start: weekStart, end: weekEnd };
}

export function formatProgressPeriodLabel(progressPeriod, progressFilterSemester, mySemesters, progressPeriodRange) {
	if (progressPeriod === 'semester') {
		const selected = mySemesters.find((s) => s.id === progressFilterSemester);
		return selected ? `Gesamtes Semester: ${selected.name}` : 'Gesamtes ausgewähltes Semester';
	}
	const { start, end } = progressPeriodRange;
	const inclusiveEnd = new Date(end);
	inclusiveEnd.setDate(inclusiveEnd.getDate() - 1);
	return `${formatDateShort(start)} – ${formatDateShort(inclusiveEnd)}`;
}
