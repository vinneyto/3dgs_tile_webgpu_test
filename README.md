# 3dgs_tile_webgpu_test

Integration scenarios for the [3dgs-tile-webgpu](https://github.com/vinneyto/3dgs_tile_webgpu) streaming backend. The dependency is pinned to the commit that adds the Node TCP transport in [renderer PR #32](https://github.com/vinneyto/3dgs_tile_webgpu/pull/32). This repository currently contains **test cases and a backend fixture only**; it has no executable tests yet.

## Structure

- [`harness/backend.mjs`](harness/backend.mjs) imports the actual renderer package and exposes a Node TCP backend alongside the direct engine for future comparative scenarios.
- [`cases/backend.md`](cases/backend.md) describes end-to-end commands, events and data expectations.
- [`cases/transport.md`](cases/transport.md) separates common wire behavior from worker-only transferable ownership.

Run `npm install` to install the pinned renderer package. Each future test should treat the backend as a black box through `dispatch`, `subscribe`, and `dispose`. The Node fixture starts a server on an ephemeral loopback port, then connects a client using the package's `GaussianBackend` protocol. Browser rendering and synchronous raycasts can be added as a separate layer later.

The TCP transport serializes `ArrayBuffer` bytes into binary attachments and reconstructs new buffers at the other end. It cannot prove the worker's ownership-transfer behavior; that requires a test using the actual worker proxy in a browser or a separate `worker_threads` harness.
