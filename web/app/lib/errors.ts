// An error whose message is safe to show to the user. Anything else is a 500.
export class UserError extends Error {}

export async function userErrors<T>(fn: () => Promise<T>): Promise<T | { error: string }> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof UserError) return { error: e.message };
    throw e;
  }
}
