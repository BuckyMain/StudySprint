import { getProgressPeriodRange } from '$lib/features/shared/date-utils';

export function getTaskReflectionsForPeriod(progressPeriodReflections, taskId) {
	return progressPeriodReflections
		.filter((r) => String(r.taskId || '') === String(taskId))
		.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function buildWeeklyData(reflections) {
	const labels = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
	const counts = Array(7).fill(0);
	const now = new Date();
	const dow = now.getDay();
	const diffToMon = dow === 0 ? -6 : 1 - dow;
	const weekStart = new Date(now);
	weekStart.setDate(now.getDate() + diffToMon);
	weekStart.setHours(0, 0, 0, 0);
	const weekEnd = new Date(weekStart.getTime() + 7 * 86400000);
	for (const r of reflections) {
		const d = new Date(r.createdAt);
		if (d >= weekStart && d < weekEnd) counts[(d.getDay() + 6) % 7]++;
	}
	const todayIdx = (now.getDay() + 6) % 7;
	return labels.map((label, i) => ({ label, count: counts[i], isToday: i === todayIdx }));
}

export function buildProgressChartData(progressPeriod, progressPeriodReflections) {
	const now = new Date();
	if (progressPeriod === 'week') {
		const labels = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
		const taskSets = Array.from({ length: 7 }, () => new Set());
		const { start, end } = getProgressPeriodRange('week', now);
		for (const r of progressPeriodReflections) {
			const d = new Date(r.createdAt);
			const taskId = String(r.taskId || '');
			if (!taskId) continue;
			if (d >= start && d < end) taskSets[(d.getDay() + 6) % 7].add(taskId);
		}
		const todayIdx = (now.getDay() + 6) % 7;
		return labels.map((label, i) => ({ label, count: taskSets[i].size, isToday: i === todayIdx }));
	}
	if (progressPeriod === 'semester') {
		const taskSetsByMonth = new Map();
		for (const r of progressPeriodReflections) {
			const d = new Date(r.createdAt);
			const taskId = String(r.taskId || '');
			if (Number.isNaN(d.getTime()) || !taskId) continue;
			const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
			if (!taskSetsByMonth.has(key)) taskSetsByMonth.set(key, new Set());
			taskSetsByMonth.get(key).add(taskId);
		}
		const keys = [...taskSetsByMonth.keys()].sort();
		const visibleKeys = keys.slice(-6);
		if (visibleKeys.length === 0) {
			return [{ label: '—', count: 0, isToday: false }];
		}
		return visibleKeys.map((key) => {
			const [year, month] = key.split('-').map(Number);
			const date = new Date(year, month - 1, 1);
			return {
				label: date.toLocaleDateString('de-CH', { month: 'short' }),
				count: taskSetsByMonth.get(key)?.size || 0,
				isToday: false
			};
		});
	}

	const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
	const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
	const labels = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'];
	const taskSets = Array.from({ length: labels.length }, () => new Set());
	for (const r of progressPeriodReflections) {
		const d = new Date(r.createdAt);
		const taskId = String(r.taskId || '');
		if (!taskId) continue;
		if (Number.isNaN(d.getTime()) || d < monthStart || d >= monthEnd) continue;
		const weekIdx = Math.min(labels.length - 1, Math.floor((d.getDate() - 1) / 7));
		taskSets[weekIdx].add(taskId);
	}
	return labels.map((label, i) => ({ label, count: taskSets[i].size, isToday: false }));
}
