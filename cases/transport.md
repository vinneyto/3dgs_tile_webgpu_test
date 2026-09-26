# Binary transport and transferable ownership cases

The Node TCP server and the browser worker implement the same plain-object command/event contract, but they have different memory semantics. Keep the two expectations separate.

## Common behavior through the Node TCP transport

| Case | Input and observation |
| --- | --- |
| TCP fragmentation | Split one encoded command across many writes, including inside the frame length, JSON metadata, attachment length and attachment bytes. Reconstructed command and buffer bytes match exactly. |
| TCP coalescing | Send several encoded commands in one write. Server dispatches them in order and correlates each response with its command ID. |
| Binary fidelity | Use `ArrayBuffer` values containing zero bytes, nonfinite `Float32` bit patterns and multibyte data. Confirm exact bytes in the received PLY/attribute and returned packed buffer or patch. |
| Buffer shape | Inspect every packed attribute, patch and full raycast octree field. They arrive as `ArrayBuffer`, with the expected byte length; JSON metadata remains plain objects and arrays. |
| Shared reference | Put the same `ArrayBuffer` in two fields of a message. Both decoded fields refer to the same reconstructed buffer within the received message. |
| Limits and disconnect | Reject malformed or oversized frames without affecting another session. A closed server connection yields a transport error and cannot silently accept more commands. |
| TCP ownership | After dispatch, the sender's original `ArrayBuffer.byteLength` is unchanged. Editing it after serialization cannot alter bytes already accepted by the server. |

## Worker-only ownership tests to add later

| Case | How to prove it |
| --- | --- |
| Command input transfer | Use the actual `WorkerStreamingGaussianBackend` with `load-cloud-from-buffer` or `write-attribute-range`; immediately after `dispatch`, assert that the original source `ArrayBuffer` is detached (`byteLength === 0`). |
| Event output transfer | In a real worker harness, capture the outgoing `ArrayBuffer` before and after `postMessage(event, transferList)`; the worker-side event buffer is detached, while the client receives intact bytes. |
| Backend-owned data | After transferring one event, request another camera/LOD update. The worker can still use its private source and packed state; transferable event buffers were separate copies. |
| Duplicate reference | When two fields share a buffer, the worker transfer list includes it once and structured cloning preserves the received reference graph. |

A Node TCP server can validate protocol bytes, framing, ordering, versions and logical equivalence with the worker. It **cannot** validate worker `postMessage` detachment or zero-copy ownership transfer: network IO necessarily serializes bytes and leaves the sender's `ArrayBuffer` attached. `worker_threads` can provide an early check of Node's transferable semantics, but a browser-worker case is needed to exercise this package's actual worker adapter.
