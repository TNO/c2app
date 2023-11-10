/** Deep clone functionality */
export const clone = <T>(model: T): T => JSON.parse(JSON.stringify(model));
