import { createFileRoute } from '@tanstack/react-router';

// Liveness of this web server only. It does not call the provisioning API.
export const Route = createFileRoute('/api/health')({
  server: {
    handlers: {
      GET: () => Response.json({ status: 'ok', time: new Date().toISOString() })
    }
  }
});
