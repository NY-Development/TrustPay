export const ensureFileUri = (path: string): string => {
    if (path.startsWith('file://')) return path;
    if (path.startsWith('/')) return `file://${path}`;
    return path;
};