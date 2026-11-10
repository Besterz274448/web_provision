import { createFileRoute } from '@tanstack/react-router';
import { readCurrentUser } from '@/features/auth/api/current-user.server';
import { apiCredentialsPdf } from '@/features/provisioning/api/client.server';

// A server route and not a server function, because the answer is a file. It holds vehicle
// passwords, so it needs a session, and a page on another site must not be able to start it:
// each download writes an audit row under the signed-in user's name.
export const Route = createFileRoute('/api/provisioning/$id/credentials')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const user = await readCurrentUser();
        if (!user) return new Response('sign in first', { status: 401 });
        const site = request.headers.get('sec-fetch-site');
        if (site && site !== 'same-origin') return new Response('forbidden', { status: 403 });

        let upstream: Response;
        try {
          upstream = await apiCredentialsPdf(params.id, user.username);
        } catch {
          return new Response('the provisioning API cannot be reached', { status: 502 });
        }
        if (!upstream.ok) return new Response(null, { status: upstream.status });
        return new Response(upstream.body, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="vehicle-logins-${encodeURIComponent(params.id)}.pdf"`,
            'Cache-Control': 'no-store'
          }
        });
      }
    }
  }
});
