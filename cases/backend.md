# Backend integration case sets

These are specifications for future integration tests, not test implementations. Run each case against the Node TCP fixture in `harness/backend.mjs`. When practical, repeat the same command sequence with the direct backend as a reference. Capture events and correlate them by `commandId`, `cloudId`, `sceneRevision`, `layoutVersion`, and `contentVersion`.

## 1. Session and cloud lifecycle

| Case | Commands and setup | Expected observations |
| --- | --- | --- |
| Initialize | Connect with realistic frontend buffer limits; wait for `ready`. | Commands submitted before `ready` execute in order after initialization. Closing the connection disposes that session's backend. |
| URL load | Serve a small canonical PLY over HTTP; send `load-cloud`. | One `cloud-loaded` and one `buffers-replaced`; source count, bounds, attribute formats and payload lengths match the fixture. |
| Client buffer load | Send `load-cloud-from-buffer` with the same PLY bytes. | The cloud and packed attributes match URL loading, including `lodLevel`. The sender's buffer remains intact over TCP. |
| Unload | Unload one of two loaded clouds. | `cloud-unloaded` identifies the command and cloud; a replacement no longer includes its Gaussian slots. |
| Invalid input | Load HTML or a PLY with missing canonical properties. | `error` has the load command ID; no `cloud-loaded` or partially published packed layout. A subsequent valid load succeeds. |
| Session isolation | Open two TCP clients and reuse the same cloud and command IDs in both. | Each connection has its own backend state and event stream. Disconnecting one leaves the other usable. |

## 2. Layout, LOD and attributes

| Case | Commands and setup | Expected observations |
| --- | --- | --- |
| Shared budget | Load two clouds with different priorities and a small `maxGaussians` limit. | Total rendered count fits the budget, cloud counts and priority order are reproducible. |
| Camera and transforms | Send two `set-cloud-transform` commands and `set-camera` for one scene revision, including both camera matrices. | One effective scene update; the resulting layout or patches carry the revision and reflect the new LOD selection. |
| Packing strategy | Switch a cloud between `maximum`, `radial`, `tiered-radial` and `distance-aware-radial`. | Counts and `lodLevel` match each strategy; invalid settings report an error without breaking the next valid command. |
| Custom attributes | Create an attribute from a buffer in one cloud and a filled attribute in another; leave a third cloud without it. | The packed scene buffer has the expected format and per-Gaussian width; absent values are zero-filled. |
| Range mutation | Write a subrange of a custom attribute, then a core attribute. | Only affected packed slots are patched when possible; a geometry change rebuilds source spatial data and refreshes raycast state. |
| Raycast flag | Load with `raycastable: false`, then enable and disable it. | Full octree snapshot appears on enable and is removed on disable. The snapshot covers the full source cloud, independent of rendered LOD. |

## 3. Streaming, versions and failure recovery

| Case | Commands and setup | Expected observations |
| --- | --- | --- |
| Bounded patching | Configure a small upload budget and move the camera enough to change many cells. | Multiple ordered `buffers-patched` events; each uses the previous `contentVersion` as `baseContentVersion`, and `lodPending` eventually becomes false. |
| Layout change | Add or unload a cloud with different SH degree or attribute schema. | A new `layoutVersion` arrives with complete buffers; patches from the old layout must not be applied by a client. |
| Late response | Delay and reorder captured patches on a test client. | The client accepts only matching layout and base content versions; stale responses do not overwrite newer data. |
| Cancel pending fetch | Delay the HTTP PLY response and dispatch `cancel` for the load command. | The load emits `command-cancelled`; no cloud or packed buffers are published. |
| Queued cancellation | Queue work behind an in-flight fetch and cancel a command before it starts. | Cancelled command emits `command-cancelled`, leaves scene state unchanged, and the queue continues. |
| Ordinary command error | Send an invalid range or packing option, followed by a valid update. | The error is tied to the bad command; prior buffers remain usable and later commands still update them. |

CPU parsing, octree building, LOD building and packing intentionally run without yielding inside an active command. A cancel message received while one of these stages is running waits in the worker message queue; it cannot undo a command already completed before cancellation is handled.
