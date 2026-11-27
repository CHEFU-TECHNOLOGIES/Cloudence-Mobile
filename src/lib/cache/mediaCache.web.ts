export async function clearAccountMediaCache(_userId: string) {}
export async function reuseOrDownloadFile(..._args: unknown[]): Promise<never> {
  throw new Error("Native file caching is not available on the web.");
}
