export const getGitUpdateDecision = ({
    currentCommit,
    availableCommit,
    canFastForward,
}) => {
    if (!currentCommit || !availableCommit) {
        throw new Error('Lokaler und verfügbarer Git-Commit sind erforderlich');
    }

    if (currentCommit === availableCommit) return 'up-to-date';
    if (!canFastForward) return 'diverged';
    return 'update';
};
