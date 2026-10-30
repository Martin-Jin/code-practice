export function hasAcknowledgedSolution(run, progress, uid) {
  return run ? !!(run.solutionAcknowledged && run.solutionAcknowledged[uid]) : !!(progress && progress.solutionAcknowledged);
}

export function acknowledgeSolution(run, progress, uid) {
  if (run) {
    return { ...run, solutionAcknowledged: { ...run.solutionAcknowledged, [uid]: true } };
  }
  return { ...progress, solutionAcknowledged: true };
}
