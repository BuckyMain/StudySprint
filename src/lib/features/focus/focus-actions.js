export async function startFocusAction({
	selectedTask,
	isFocusRunning,
	focusSecondsLeft,
	focusTargetSeconds,
	setTaskStatus,
	startTimerTick
}) {
	if (!selectedTask) throw new Error('Bitte zuerst eine Aufgabe auswählen.');
	if (isFocusRunning) return;

	let nextFocusSecondsLeft = focusSecondsLeft;
	if (nextFocusSecondsLeft > focusTargetSeconds) {
		nextFocusSecondsLeft = focusTargetSeconds;
	}

	if (selectedTask.status !== 'erledigt' && selectedTask.status !== 'in Bearbeitung') {
		await setTaskStatus(selectedTask, 'in Bearbeitung');
	}

	startTimerTick();
	return {
		focusSecondsLeft: nextFocusSecondsLeft,
		isFocusRunning: true,
		focusHasStarted: true
	};
}

export async function pauseFocusAction({
	isFocusRunning,
	selectedTask,
	focusHasStarted,
	focusSecondsLeft,
	focusTargetSeconds,
	setTaskStatus,
	stopTimerTick
}) {
	if (!isFocusRunning) return;
	stopTimerTick();
	if (
		selectedTask &&
		selectedTask.status !== 'erledigt' &&
		selectedTask.status !== 'in Bearbeitung' &&
		focusHasStarted &&
		focusSecondsLeft < focusTargetSeconds
	) {
		await setTaskStatus(selectedTask, 'in Bearbeitung');
	}
}

export async function completeFocusSessionAction({
	api,
	selectedTask,
	reflectionRating,
	reflectionNote,
	focusTargetSeconds,
	focusSecondsLeft,
	setTaskStatus
}) {
	if (!selectedTask) throw new Error('Keine aktive Aufgabe vorhanden.');

	const elapsedMinutes = Math.max(1, Math.round((focusTargetSeconds - focusSecondsLeft) / 60));
	await api('/api/reflections', {
		method: 'POST',
		body: JSON.stringify({
			taskId: selectedTask._id,
			rating: reflectionRating,
			note: reflectionNote,
			focusMinutes: elapsedMinutes
		})
	});
	await setTaskStatus(selectedTask, 'erledigt');
}
