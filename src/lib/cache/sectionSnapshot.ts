import type { SectionListing } from "../api/folders";

// Preserve the number of loaded files when revalidating a paginated folder.
export async function fetchSectionSnapshot(
  fetchPage: (offset: number) => Promise<SectionListing>,
  loadedCount: number,
  paginated: boolean,
): Promise<SectionListing> {
  const first = await fetchPage(0);
  let result = first;
  const offsets = new Set<number>([0]);
  while (paginated && result.nextOffset !== undefined && result.files.length < loadedCount) {
    const offset = result.nextOffset;
    if (offsets.has(offset)) throw new Error("The folder returned a repeated page offset.");
    offsets.add(offset);
    const next = await fetchPage(offset);
    result = {
      files: [...new Map([...result.files, ...next.files].map((file) => [file.id, file])).values()],
      folders: next.folders,
      nextOffset: next.nextOffset,
    };
  }
  return result;
}
