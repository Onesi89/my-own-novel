/**
 * Authentication API Exports
 * FSD: features/auth/api
 */

export {
  signInWithGoogle,
  getCurrentSession,
  getCurrentUser,
  signOut,
  refreshSession,
  onAuthStateChange,
  handleOAuthCallback,
} from './authApi'

export {
  syncUserToCustomTable,
  saveOAuthToken,
} from './userSync'

// 데이터베이스 테스트 함수들 (임시 비활성화)
// export {
//   testDatabaseConnection,
//   testOAuthTokensTable,
//   checkTableSchema,
// } from './dbTest'

export type {
  GoogleAuthOptions,
  AuthApiResponse,
  UserSession,
} from './authApi'

export type {
  CustomUser,
  SyncUserResult,
} from './userSync'