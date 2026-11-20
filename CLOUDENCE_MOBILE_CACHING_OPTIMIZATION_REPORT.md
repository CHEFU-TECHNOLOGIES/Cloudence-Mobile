# Cloudence Mobile Caching Optimization Report

## Summary

Cloudence now uses cache-first metadata loading with stale-while-revalidate for
workspace data and section/folder listings. Native metadata persistence is
account-scoped and configured for SQLCipher. Network and foreground events
trigger freshness checks, while file transfers expose progress and cancellation.

This work improves the request pattern and offline metadata availability, but
does not implement a full offline-file manager, delta synchronization, or
instrumented performance measurement. No latency, bandwidth, memory, or billing
improvements are claimed.

## Existing architecture audit

- The app is an Expo / React Native application using Expo Router, TypeScript,
  and a shared Cloudence data provider.
- Authentication uses CheFu SSO access tokens. API requests send bearer
  authorization and the CheFu app identifier.
- File metadata and storage usage come from the Cloudence API. Root listings
  return at most 100 files; folder listings accept offsets and return
  `nextOffset`.
- The backend does not currently expose a change feed, revision token, ETag /
  conditional request contract, or push-sync contract for this client.
- The previous data refresh also requested a separate dashboard/recent-files
  endpoint. Recent files can be derived from the newest-first file listing.
- The prior app had no persistent metadata cache. File transfers use the
  platform file APIs and fresh backend authorization for downloads.

## Caching strategy implemented

- The shared workspace provider reads cached files and usage before revalidating.
  Stale data remains available while requests run.
- Files and recent-file metadata use a two-minute freshness window; storage
  usage uses three minutes. Section/folder listings use a two-minute window.
- A request in progress is shared by concurrent workspace refresh callers.
  Obsolete workspace and folder requests can be cancelled.
- Retry logic applies only to GET requests: up to two retries for network errors
  and retryable HTTP responses, with bounded delays and `Retry-After` handling.
- Rename and delete update the visible list optimistically and restore the
  previous state if the API call fails. Sharing state changes after server
  confirmation.
- Upload and delete invalidate cached storage usage. Successful uploads update
  the workspace and recent-file lists after server confirmation.
- Connectivity changes and app foregrounding trigger stale-data checks; this is
  foreground/network-event synchronization, not a continuous background worker.

## Files and folders

- Native metadata is stored in SQLCipher SQLite databases separated by a
  SHA-256 hash of the account ID. The encryption key is held in SecureStore.
- Cache entries have a schema version and a 30-day maximum age. The cache keeps
  at most 100 metadata keys per account.
- Workspace files and folder listings omit signed URLs before persistence.
  Folder cache keys include section and folder ID and reside in the
  account-specific database.
- Folder contents are appended by page when the backend provides `nextOffset`.
  Pagination is limited to folder listings; root listings do not currently
  expose a pagination contract.
- Web deliberately uses a no-persistence cache implementation. This also keeps
  the native SQLite / WASM dependency out of the web bundle.

## Offline access and security

- Previously cached metadata can be browsed offline. The UI indicates when only
  cached metadata is available and that file operations need connectivity.
- Cached metadata is not authorization. File preview/download requests still
  obtain fresh backend authorization; signed URLs are not persisted.
- The native cache key is stored separately from encrypted metadata. Cache data
  for the previous account is cleared on sign-out/account change.
- File bytes are not retained as an explicit offline feature. Native downloads
  use transient app cache storage for opening/sharing. There is no
  “Available Offline” manager, offline indicator per file, version validation,
  quota management, or integrity verification.
- SQLCipher configuration is present in Expo config, but the native behavior
  still requires validation in a rebuilt iOS/Android development build.

## Uploads, downloads, and user feedback

- Uploads report progress, support cancellation, prevent a second simultaneous
  upload, and insert the uploaded file after server confirmation. Upload queues,
  resumable/chunked uploads, and automatic upload retries are not implemented.
- Downloads request a fresh authorized URL, support cancellation, and report
  native transfer progress. Web downloads do not currently report byte-level
  progress. Downloaded bytes are not reused as a persistent offline copy.
- The app does not yet have a consistent toast system. Existing dialogs/inline
  errors remain; complete success/error/warning/information toast coverage is
  not implemented.

## Changes and dependencies

Key caching and API files:

- `src/data/CloudenceDataProvider.tsx`
- `src/data/useCloudenceWorkspace.ts`
- `src/data/useCloudenceFileActions.ts`
- `src/data/CloudenceDataContext.ts`
- `src/data/workspaceMetadata.ts`
- `src/hooks/useSectionListing.ts`
- `src/lib/cache/metadataCache.native.ts`
- `src/lib/cache/metadataCache.web.ts`
- `src/lib/api/client.ts`
- `src/lib/api/files.ts`
- `src/lib/api/folders.ts`

Related UI files provide folder browsing and transfer progress/cancellation,
and the app-level screens consume the shared API-backed workspace state.

Dependencies added for this work:

- `expo-sqlite` for native SQLCipher metadata storage.
- `expo-network` for connectivity change handling.

## Verification and measurements

### Measured

- `npx tsc --noEmit` — passed.
- `npx expo export --platform web` — passed. The generated static route list
  contains app routes and does not expose style modules as routes (the profile
  screen route is present).
- `npx expo config --type public --json` — passed; reports
  `expo-sqlite` with `useSQLCipher: true`.
- `git diff --check` — passed; Git only reported existing line-ending
  conversion notices.
- All TypeScript/TSX files under `src` are at or below 500 lines.

These are build/configuration checks, not runtime performance measurements.
There is no mobile test script or existing test-file suite in this project, and
no native device build was performed.

### Estimated / code-derived

- A full workspace refresh previously requested files, dashboard/recent files,
  and usage (three API requests). Deriving recent files from the file listing
  reduces this to files plus usage (two requests), a **33% reduction in those
  refresh request calls when both paths succeed**. This is a code-path
  comparison, not a measured per-session reduction; cache freshness and partial
  failures affect actual traffic.
- No monetary savings are estimated because infrastructure billing data is not
  available.

### Not yet measured

- API requests per user session and cache hit rate.
- Folder open/revisit latency, cold-start time, preview latency, and React
  render/memory behavior.
- Thumbnail or transfer bandwidth, device storage consumption, and backend
  request volume.
- Performance with 1,000 or 10,000 files, and behavior on lower-end Android
  devices.
- Upload/download throughput and cancellation reliability on physical devices.

## Remaining limitations

- There is no delta/change-feed synchronization. Refreshing a stale root listing
  still fetches the full (up to 100-item) listing.
- Folder pagination exists only where the backend supplies offsets; a root
  pagination contract is still needed for larger workspaces.
- No explicit offline file storage, thumbnail/previews cache policy, offline
  operation queue, background task, conflict resolution, folder move UI, or
  resumable transfer support is implemented.
- Folder creation awaits backend confirmation rather than displaying a
  temporary optimistic folder. Star/favorite behavior is not part of this
  caching implementation.
- No toast system, large-list virtualization benchmark, or automated cache,
  retry, pagination, and transfer race tests are present.
- Cache contents can be stale while offline; server permissions remain
  authoritative and cannot be revalidated without connectivity.
