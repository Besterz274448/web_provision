// Every export is a server function: the handler runs on the server and the browser only gets
// an RPC stub, so the service token stays on the server. Each one is also a public HTTP endpoint,
// so each needs authMiddleware. Route guards alone would leave the data reachable.

import { createServerFn } from '@tanstack/react-start';
import * as z from 'zod';
import { authMiddleware } from '@/features/auth/api/middleware';
import { signupSchema } from '../schemas/signup';
import {
  type ApiRefusal,
  apiGet,
  apiIsHealthy,
  apiPost,
  apiRevealCredentials
} from './client.server';
import type {
  CatalogBrand,
  CreateRequestResult,
  District,
  ModuleOption,
  OrderPrefixCheck,
  Province,
  RequestDetail,
  RequestListResponse,
  RetryRequestResult,
  RevealCredentialsResult,
  StepLog,
  SubDistrict
} from './types';

const listFiltersSchema = z.object({
  page: z.number().int().positive(),
  limit: z.number().int().positive().max(100),
  q: z.string().max(100).optional(),
  status: z.string().max(100).optional()
});

const requestIdSchema = z.string().min(1).max(36);

export const getRequests = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator(listFiltersSchema)
  .handler(({ data }) => {
    const params = new URLSearchParams({ page: String(data.page), limit: String(data.limit) });
    if (data.q) params.set('q', data.q);
    if (data.status) params.set('status', data.status);
    return apiGet<RequestListResponse>(`/provisioning-requests?${params}`);
  });

export const getRequest = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator(requestIdSchema)
  .handler(({ data: id }) =>
    apiGet<RequestDetail>(`/provisioning-requests/${encodeURIComponent(id)}`)
  );

export const getRequestSteps = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator(requestIdSchema)
  .handler(({ data: id }) =>
    apiGet<{ steps: StepLog[] }>(`/provisioning-requests/${encodeURIComponent(id)}/steps`)
  );

export const getModules = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(() => apiGet<{ modules: ModuleOption[] }>('/modules'));

export const getCatalogOptions = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(() => apiGet<{ brands: CatalogBrand[] }>('/catalog-options'));

const addressIdSchema = z.number().int().positive();

export const getProvinces = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(() => apiGet<{ provinces: Province[] }>('/addresses/provinces'));

export const getDistricts = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator(addressIdSchema)
  .handler(({ data: provinceId }) =>
    apiGet<{ districts: District[] }>(`/addresses/provinces/${provinceId}/districts`)
  );

export const getSubDistricts = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator(addressIdSchema)
  .handler(({ data: districtId }) =>
    apiGet<{ sub_districts: SubDistrict[] }>(`/addresses/districts/${districtId}/sub-districts`)
  );

/** Whether a new request may use the prefix. except is the request being approved, which may keep it. */
export const checkOrderPrefix = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator(
    z.object({ prefix: z.string().regex(/^[A-Za-z0-9]{2,4}$/), except: requestIdSchema.optional() })
  )
  .handler(({ data }) => {
    const params = new URLSearchParams(data.except ? { except: data.except } : {});
    return apiGet<OrderPrefixCheck>(`/order-prefixes/${encodeURIComponent(data.prefix)}?${params}`);
  });

const isRefusal = (result: object): result is ApiRefusal => 'refused' in result;

/** Stores a signup and starts it. The API answers before anything reaches flow-api. */
export const createRequest = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator(signupSchema)
  .handler(async ({ data }): Promise<CreateRequestResult> => {
    const result = await apiPost<{ id: string }>('/provisioning-requests', data);
    return isRefusal(result) ? { error: result.refused } : { id: result.id };
  });

/** Fills a request from the survey in with the completed form, and starts it. */
export const approveRequest = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator(z.object({ id: requestIdSchema, signup: signupSchema }))
  .handler(async ({ data, context }): Promise<CreateRequestResult> => {
    const result = await apiPost<{ id: string }>(
      `/provisioning-requests/${encodeURIComponent(data.id)}/approve`,
      data.signup,
      context.user.username
    );
    return isRefusal(result) ? { error: result.refused } : { id: result.id };
  });

export const declineRequest = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator(z.object({ id: requestIdSchema, reason: z.string().trim().max(512) }))
  .handler(async ({ data, context }): Promise<RetryRequestResult> => {
    const result = await apiPost<object>(
      `/provisioning-requests/${encodeURIComponent(data.id)}/decline`,
      { reason: data.reason },
      context.user.username
    );
    return isRefusal(result) ? { error: result.refused } : { ok: true };
  });

export const retryRequest = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator(requestIdSchema)
  .handler(async ({ data: id }): Promise<RetryRequestResult> => {
    const result = await apiPost<object>(`/provisioning-requests/${encodeURIComponent(id)}/retry`);
    return isRefusal(result) ? { error: result.refused } : { ok: true };
  });

/** A POST and never a query: each call writes an audit row, so nothing may repeat it by itself. */
export const revealCredentials = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator(requestIdSchema)
  .handler(({ data: id, context }): Promise<RevealCredentialsResult> =>
    apiRevealCredentials(id, context.user.username)
  );

export const getServiceHealth = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(() => apiIsHealthy());
