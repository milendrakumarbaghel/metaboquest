import { createContext, useContext, type Dispatch } from 'react'
import type { BatchView, Language, PackageView, PaperView, ScheduledPostView, Tab } from '../types'
export interface ToastMessage { id: number; type: 'success' | 'error' | 'info'; text: string }
export interface AppState {
  papers: PaperView[]; activePaperId: string | null; packages: Record<string, PackageView>;
  packageIdByPaperAndLang: Record<string, Partial<Record<Language, string>>>;
  activeLanguage: 'en'; activeTab: Tab; activePackageId: string | null;
  schedules: Record<string, ScheduledPostView>; loading: Record<string, boolean>;
  errors: Record<string, string | null>; batch: BatchView | null; toasts: ToastMessage[]; offline: boolean
}
export type Action =
  | { type: 'paper'; paper: PaperView; select?: boolean }
  | { type: 'select'; paperId: string }
  | { type: 'package'; pkg: PackageView; activate?: boolean }
  | { type: 'tab'; tab: Tab }
  | { type: 'schedule'; schedule: ScheduledPostView }
  | { type: 'loading'; key: string; value: boolean }
  | { type: 'error'; key: string; value: string | null }
  | { type: 'batch'; batch: BatchView }
  | { type: 'toast'; toast: ToastMessage }
  | { type: 'dismiss'; id: number }
  | { type: 'offline'; value: boolean }
export const initialState: AppState = { papers: [], activePaperId: null, packages: {}, packageIdByPaperAndLang: {}, activeLanguage: 'en', activeTab: 'papers', activePackageId: null, schedules: {}, loading: {}, errors: {}, batch: null, toasts: [], offline: false }
export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'paper': { const papers = [...state.papers.filter(p => p.id !== action.paper.id), action.paper]; return { ...state, papers, ...(action.select ? { activePaperId: action.paper.id, activePackageId: state.packageIdByPaperAndLang[action.paper.id]?.[state.activeLanguage] ?? null } : {}) } }
    case 'select': return { ...state, activePaperId: action.paperId, activePackageId: state.packageIdByPaperAndLang[action.paperId]?.[state.activeLanguage] ?? null }
    case 'package': { const p = action.pkg; return { ...state, packages: { ...state.packages, [p.id]: p }, packageIdByPaperAndLang: { ...state.packageIdByPaperAndLang, [p.paper.id]: { ...state.packageIdByPaperAndLang[p.paper.id], [p.language]: p.id } }, ...(action.activate ? { activePackageId: p.language === state.activeLanguage ? p.id : null, activePaperId: p.paper.id } : {}) } }
    case 'tab': return { ...state, activeTab: action.tab }
    case 'schedule': return { ...state, schedules: { ...state.schedules, [action.schedule.packageId]: action.schedule } }
    case 'loading': return { ...state, loading: { ...state.loading, [action.key]: action.value } }
    case 'error': return { ...state, errors: { ...state.errors, [action.key]: action.value } }
    case 'batch': return { ...state, batch: action.batch }
    case 'toast': return { ...state, toasts: [...state.toasts, action.toast] }
    case 'dismiss': return { ...state, toasts: state.toasts.filter(t => t.id !== action.id) }
    case 'offline': return { ...state, offline: action.value }
  }
}
export const AppContext = createContext<{ state: AppState; dispatch: Dispatch<Action> } | undefined>(undefined)
export function useApp() { const value = useContext(AppContext); if (!value) throw new Error('AppProvider required'); return value }
export function usePackage() { const { state } = useApp(); return state.activePackageId ? state.packages[state.activePackageId] : undefined }
