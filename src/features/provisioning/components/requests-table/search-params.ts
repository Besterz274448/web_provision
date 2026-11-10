import {
  createLoader,
  type inferParserType,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum
} from 'nuqs';
import { toURLSearchParams } from '@/lib/search-params';
import type { RequestListFilters } from '../../api/types';
import { REQUEST_VIEWS, VIEW_STATUSES } from '../../lib/status';

export const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

export const requestsSearchParams = {
  view: parseAsStringEnum([...REQUEST_VIEWS]).withDefault('all'),
  q: parseAsString.withDefault(''),
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(DEFAULT_PAGE_SIZE)
};

const loadRequestsSearchParams = createLoader(requestsSearchParams);

export function getRequestFilters(
  search: inferParserType<typeof requestsSearchParams>
): RequestListFilters {
  const q = search.q.trim().slice(0, 100);
  const statuses = VIEW_STATUSES[search.view];
  return {
    page: Math.max(search.page, 1),
    limit: Math.min(Math.max(search.perPage, 1), MAX_PAGE_SIZE),
    ...(q && { q }),
    ...(statuses.length > 0 && { status: statuses.join(',') })
  };
}

/** Same as getRequestFilters, from a route loader's search object. */
export function getRequestFiltersFromSearch(search: Record<string, unknown>) {
  return getRequestFilters(loadRequestsSearchParams(toURLSearchParams(search)));
}
