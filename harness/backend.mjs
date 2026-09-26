import { StreamingGaussianBackend } from "3dgs-tile-webgpu/backend";
import {
  createNodeStreamingServer,
  NodeStreamingGaussianBackend,
} from "3dgs-tile-webgpu/node";

export const backendConfig = {
  frontend: {
    maxStorageBufferBindingSize: 128 * 1024 * 1024,
    maxBufferSize: 256 * 1024 * 1024,
    maxStorageBuffersPerShaderStage: 8,
    supportsPartialBufferUpdates: true,
  },
  maxGaussians: "auto",
};

/** Later scenarios can use this fixture; no test runner or assertions are included. */
export async function openNodeBackend(config = backendConfig) {
  const server = await createNodeStreamingServer({ port: 0 });
  const address = server.address();
  if (!address || typeof address === "string") {
    await server.close();
    throw new Error("Node backend did not bind a TCP port");
  }
  const backend = new NodeStreamingGaussianBackend(config, { port: address.port });
  try {
    await backend.ready;
  } catch (error) {
    backend.dispose();
    await server.close();
    throw error;
  }
  return {
    backend,
    async close() {
      backend.dispose();
      await server.close();
    },
  };
}

/** Reference core with the same command/event contract and no socket. */
export function openDirectBackend(config = backendConfig) {
  return new StreamingGaussianBackend(config);
}
