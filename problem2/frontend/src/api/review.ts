import { request, json, idPath } from './client'
import type { ClaimView, PackageView, Decision, ReviewInput } from '../types'
export const reviewApi = {
  claim: (pkg: string, claim: string, approved: boolean, input: ReviewInput) => request<ClaimView>(`/api/v1/review/packages/${idPath(pkg)}/claims/${idPath(claim)}`, json({ approved, ...input }), 'review'),
  package: (pkg: string, decision: Decision, input: ReviewInput) => request<PackageView>(`/api/v1/review/packages/${idPath(pkg)}`, json({ decision, ...input }), 'review'),
}
