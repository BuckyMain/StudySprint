export async function deleteReflectionsForTaskIds(db, taskIds) {
	if (!taskIds.length) return;
	const taskIdStrings = taskIds.map((taskId) => String(taskId));
	await db.collection('reflections').deleteMany({
		$or: [{ taskId: { $in: taskIdStrings } }, { taskId: { $in: taskIds } }]
	});
}
