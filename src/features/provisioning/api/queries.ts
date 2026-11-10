import { queryOptions } from '@tanstack/react-query';
import { DEFAULT_PAGE_SIZE } from '../components/requests-table/search-params';
import { isFinalStatus } from '../lib/status';
import { retryOnceIfTransient } from './errors';
import {
  getCatalogOptions,
  getDistricts,
  getModules,
  getProvinces,
  getRequest,
  getRequests,
  getRequestSteps,
  getServiceHealth,
  getSubDistricts
} from './service';
import type { RequestListFilters } from './types';

const LIST_REFRESH_MS = 10_000;
const ACTIVE_REFRESH_MS = 5_000;
const FINAL_REFRESH_MS = 30_000;
// Same pace as the list, so the sidebar and a failed list refresh do not disagree for long.
const HEALTH_REFRESH_MS = LIST_REFRESH_MS;
// The module master changes by migration, not while someone is filling in a form.
const MODULES_STALE_MS = 5 * 60_000;
// The address master changes only when someone reloads its seed.
const ADDRESS_STALE_MS = 60 * 60_000;

export const provisioningKeys = {
  all: ['provisioning'] as const,
  list: (filters: RequestListFilters) => [...provisioningKeys.all, 'list', filters] as const,
  detail: (id: string) => [...provisioningKeys.all, 'detail', id] as const,
  steps: (id: string) => [...provisioningKeys.all, 'steps', id] as const,
  health: () => [...provisioningKeys.all, 'health'] as const,
  modules: () => [...provisioningKeys.all, 'modules'] as const,
  catalogOptions: () => [...provisioningKeys.all, 'catalog-options'] as const,
  provinces: () => [...provisioningKeys.all, 'provinces'] as const,
  districts: (provinceId: number) => [...provisioningKeys.all, 'districts', provinceId] as const,
  subDistricts: (districtId: number) =>
    [...provisioningKeys.all, 'sub-districts', districtId] as const
};

export const requestListQueryOptions = (filters: RequestListFilters) =>
  queryOptions({
    queryKey: provisioningKeys.list(filters),
    queryFn: () => getRequests({ data: filters }),
    staleTime: LIST_REFRESH_MS / 2,
    refetchInterval: LIST_REFRESH_MS,
    retry: retryOnceIfTransient
  });

// Same filters as the first page of the approval tab, so both share one cache entry.
const AWAITING_APPROVAL_FILTERS: RequestListFilters = {
  page: 1,
  limit: DEFAULT_PAGE_SIZE,
  status: 'awaiting_approval'
};

/**
 * Requests from the survey that wait for approval, for the sidebar count and the "new survey"
 * toast. It keeps refreshing in a background tab, so the tab title can say one came in.
 */
export const awaitingApprovalQueryOptions = () =>
  queryOptions({
    ...requestListQueryOptions(AWAITING_APPROVAL_FILTERS),
    refetchIntervalInBackground: true
  });

export const requestDetailQueryOptions = (id: string) =>
  queryOptions({
    queryKey: provisioningKeys.detail(id),
    queryFn: () => getRequest({ data: id }),
    staleTime: ACTIVE_REFRESH_MS / 2,
    refetchInterval: (query) =>
      query.state.data && isFinalStatus(query.state.data.status)
        ? FINAL_REFRESH_MS
        : ACTIVE_REFRESH_MS,
    retry: retryOnceIfTransient
  });

export const requestStepsQueryOptions = (id: string) =>
  queryOptions({
    queryKey: provisioningKeys.steps(id),
    queryFn: () => getRequestSteps({ data: id }),
    staleTime: ACTIVE_REFRESH_MS / 2,
    refetchInterval: ACTIVE_REFRESH_MS,
    retry: retryOnceIfTransient
  });

export const modulesQueryOptions = () =>
  queryOptions({
    queryKey: provisioningKeys.modules(),
    queryFn: () => getModules(),
    staleTime: MODULES_STALE_MS,
    retry: retryOnceIfTransient
  });

export const catalogOptionsQueryOptions = () =>
  queryOptions({
    queryKey: provisioningKeys.catalogOptions(),
    queryFn: () => getCatalogOptions(),
    staleTime: MODULES_STALE_MS,
    retry: retryOnceIfTransient
  });

export const provincesQueryOptions = () =>
  queryOptions({
    queryKey: provisioningKeys.provinces(),
    queryFn: () => getProvinces(),
    staleTime: ADDRESS_STALE_MS,
    retry: retryOnceIfTransient
  });

export const districtsQueryOptions = (provinceId: number) =>
  queryOptions({
    queryKey: provisioningKeys.districts(provinceId),
    queryFn: () => getDistricts({ data: provinceId }),
    staleTime: ADDRESS_STALE_MS,
    retry: retryOnceIfTransient
  });

export const subDistrictsQueryOptions = (districtId: number) =>
  queryOptions({
    queryKey: provisioningKeys.subDistricts(districtId),
    queryFn: () => getSubDistricts({ data: districtId }),
    staleTime: ADDRESS_STALE_MS,
    retry: retryOnceIfTransient
  });

export const serviceHealthQueryOptions = () =>
  queryOptions({
    queryKey: provisioningKeys.health(),
    queryFn: () => getServiceHealth(),
    staleTime: HEALTH_REFRESH_MS / 2,
    refetchInterval: HEALTH_REFRESH_MS,
    retry: retryOnceIfTransient
  });
