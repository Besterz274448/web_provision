// Stands in for flow-api and flow-auth, so a request sent from this UI runs its whole course on a
// laptop and writes nothing anywhere else. It keeps only the contract in tenant-provisioning's
// internal/downstream package, and never prints a password.
//
// The order prefix picks what happens:
//   DUP... flow-auth says the prefix is taken        REJ... flow-api refuses the data
//   ERR... flow-api fails, so Provision retries      HUSH... flow-api never answers
//   VAN... one vehicle fails                         anything else succeeds

const PORT = Number(process.env.FAKE_FLOW_PORT ?? 18081);
const PROVISION_URL = process.env.PROVISION_URL ?? 'http://localhost:18080';
const CALLBACK_TOKEN = process.env.FLOW_API_TOKEN ?? 'demo-flow-api';
const CALLBACK_DELAY_MS = Number(process.env.FAKE_FLOW_DELAY_MS ?? 6000);

type TenantRequest = {
  request_id: string;
  supplier_id: string;
  order_prefix: string;
  source_supplier_id?: string;
  catalog_brands?: string[];
  vehicles?: { vehicle_request_id: string }[];
};

const CATALOG_BRANDS = [
  { name: 'FNDT', sku_count: 64 },
  { name: 'NESTLE', sku_count: 120 },
  { name: 'Philip Morris', sku_count: 18 },
  { name: 'Sermsuk', sku_count: 95 },
  { name: 'TBV', sku_count: 412 }
];

const startsWith = (prefix: string, marker: string) => prefix.toUpperCase().startsWith(marker);

const step = (name: string, target: string, ms: number, status = 'succeeded') => ({
  step: name,
  target_db: target,
  status,
  duration_ms: ms,
  ...(status === 'succeeded'
    ? {}
    : { error_code: 'db_lock', error_message: 'database lock timeout or deadlock' })
});

function callback(tenant: TenantRequest) {
  const prefix = tenant.order_prefix;
  const failed = startsWith(prefix, 'ERR');
  const rejected = startsWith(prefix, 'REJ');
  const vehicles = (tenant.vehicles ?? []).map((vehicle, index) =>
    startsWith(prefix, 'VAN') && index === 0
      ? {
          vehicle_request_id: vehicle.vehicle_request_id,
          status: 'rejected',
          error_code: 'duplicate_personal_id',
          error_message: 'personal_id is not available'
        }
      : {
          vehicle_request_id: vehicle.vehicle_request_id,
          status: 'completed',
          van_id: crypto.randomUUID(),
          van_vehicle_id: crypto.randomUUID()
        }
  );
  const finished = !failed && !rejected;
  return {
    event_id: crypto.randomUUID(),
    request_id: tenant.request_id,
    supplier_id: tenant.supplier_id,
    service: 'flow-api',
    status: failed ? 'failed' : rejected ? 'rejected' : 'completed',
    ...(failed && { error_code: 'db_lock', error_message: 'database lock timeout or deadlock' }),
    ...(rejected && {
      error_code: 'missing_global_reference',
      error_message: 'employee type is missing'
    }),
    vehicles: finished ? vehicles : [],
    catalog:
      finished && (tenant.source_supplier_id || tenant.catalog_brands?.length)
        ? { status: 'completed', found: 128, inserted: 121, skipped: { no_price: 5, no_brand: 2 } }
        : undefined,
    steps: finished
      ? [step('write_dms', 'dms', 8420), step('write_r9', 'r9', 390)]
      : [step('write_dms', 'dms', 50020, 'rolled_back')]
  };
}

Bun.serve({
  port: PORT,
  async fetch(request) {
    const { pathname } = new URL(request.url);

    if (pathname.startsWith('/flow-auth/api/v1/provisioning/order-prefixes/')) {
      const prefix = decodeURIComponent(pathname.split('/').pop() ?? '');
      return Response.json({ order_prefix: prefix, available: !startsWith(prefix, 'DUP') });
    }
    if (pathname === '/flow-auth/api/v1/provisioning/validate') {
      const body = (await request.json()) as { order_prefix: string };
      return Response.json({
        order_prefix_taken: startsWith(body.order_prefix, 'DUP'),
        usernames_taken: []
      });
    }
    if (pathname === '/flow-auth/api/v1/provisioning/tenants') {
      return Response.json({ ok: true });
    }
    if (pathname === '/flow-api/api/v1/provisioning/catalog-options') {
      return Response.json({ brands: CATALOG_BRANDS });
    }
    if (pathname === '/flow-api/api/v1/provisioning/tenants') {
      const tenant = (await request.json()) as TenantRequest;
      if (!startsWith(tenant.order_prefix, 'HUSH')) {
        setTimeout(() => {
          void fetch(`${PROVISION_URL}/provisioning-requests/${tenant.request_id}/callback`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Service-Token': CALLBACK_TOKEN },
            body: JSON.stringify(callback(tenant))
          }).catch(() => console.error(`callback failed for ${tenant.request_id}`));
        }, CALLBACK_DELAY_MS);
      }
      return Response.json({ accepted: true }, { status: 202 });
    }
    return new Response('not found', { status: 404 });
  }
});

console.warn(`fake flow-api and flow-auth on :${PORT}`);
