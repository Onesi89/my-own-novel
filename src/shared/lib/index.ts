// Re-export all shared utilities
export { cn } from './utils';
export { useToast } from './use-toast';

// Supabase client (클라이언트 사이드용만)
export { createClient } from '../../supabase/client';
// server.ts는 서버 컴포넌트에서만 직접 import 해야 함

// Convenience export for the default supabase client
export { supabase } from './supabase';