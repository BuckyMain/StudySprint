export function priorityBadgeClass(priority) {
	const n = Number(priority);
	if (n === 1) return 'text-bg-danger';
	if (n === 2) return 'text-bg-warning text-dark';
	if (n === 3) return 'text-bg-primary';
	if (n === 4) return 'text-bg-info text-dark';
	return 'text-bg-secondary';
}

export function priorityBadgeClassNeutral() {
	return 'text-body border';
}

export function statusBadgeClass(status) {
	if (status === 'erledigt') return 'text-bg-success';
	if (status === 'in Bearbeitung') return 'text-bg-warning text-dark';
	return 'text-bg-light text-dark border';
}

export function statusLabel(status) {
	if (status === 'erledigt') return 'Erledigt';
	if (status === 'in Bearbeitung') return 'In Bearbeitung';
	return 'Offen';
}

export function isTaskNoteLong(note) {
	return String(note || '').length > 140 || String(note || '').includes('\n');
}

export function toggleIdInSet(ids, id) {
	const normalizedId = String(id);
	const next = new Set(ids);
	if (next.has(normalizedId)) next.delete(normalizedId);
	else next.add(normalizedId);
	return next;
}

export function getFilteredSortedTasks(list, taskFilterStatus, taskFilterModule, taskSortBy, parseDateValue) {
	let tasks = list;
	if (taskFilterStatus === 'open') tasks = tasks.filter((t) => t.status !== 'erledigt');
	else if (taskFilterStatus) tasks = tasks.filter((t) => t.status === taskFilterStatus);
	if (taskFilterModule) tasks = tasks.filter((t) => t.module === taskFilterModule);

	const compareByTitle = (a, b) =>
		String(a.title || '').localeCompare(String(b.title || ''), 'de', { sensitivity: 'base' });

	return [...tasks].sort((a, b) => {
		if (taskSortBy === 'priority') {
			const priorityDiff = Number(a.priority) - Number(b.priority);
			if (priorityDiff !== 0) return priorityDiff;
			const dueA = parseDateValue(a.dueDate);
			const dueB = parseDateValue(b.dueDate);
			if (dueA && dueB) {
				const dueDiff = dueA - dueB;
				if (dueDiff !== 0) return dueDiff;
			} else if (dueA && !dueB) return -1;
			else if (!dueA && dueB) return 1;
			return compareByTitle(a, b);
		}
		if (taskSortBy === 'dueDate') {
			const dueA = parseDateValue(a.dueDate);
			const dueB = parseDateValue(b.dueDate);
			if (!dueA && !dueB) {
				const priorityDiff = Number(a.priority) - Number(b.priority);
				if (priorityDiff !== 0) return priorityDiff;
				return compareByTitle(a, b);
			}
			if (!dueA) return 1;
			if (!dueB) return -1;
			const dueDiff = dueA - dueB;
			if (dueDiff !== 0) return dueDiff;
			const priorityDiff = Number(a.priority) - Number(b.priority);
			if (priorityDiff !== 0) return priorityDiff;
			return compareByTitle(a, b);
		}
		if (taskSortBy === 'duration') {
			const durationDiff = Number(a.duration) - Number(b.duration);
			if (durationDiff !== 0) return durationDiff;
			return compareByTitle(a, b);
		}
		return compareByTitle(a, b);
	});
}

export function normalizeExtractedDeadlines(items = []) {
	const normalizePriority = (value) => {
		const raw = String(value || '').trim().toLowerCase();
		if (['1', '2', '3', '4', '5'].includes(raw)) return raw;
		if (raw.includes('höch') || raw.includes('hoch')) return '1';
		if (raw.includes('niedrig')) return '5';
		if (raw.includes('mittel') || raw.includes('normal')) return '3';
		return '3';
	};

	return items.map((item) => ({
		...item,
		detectedModule: String(item.module || '').trim(),
		priority: normalizePriority(item.priority)
	}));
}
