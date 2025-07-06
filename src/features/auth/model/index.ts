/**
 * Authentication Model Exports
 * FSD: features/auth/model
 */

export { useAuth, useAuthUser, useAuthSession, useIsAuthenticated, useAuthLoading, useAuthError } from './useAuth'
export type { AuthState } from './useAuth'

export { 
  useAuthStore, 
  authSelectors
} from './authStore'

export type { 
  AuthState as ZustandAuthState, 
  AuthActions
} from './authStore'