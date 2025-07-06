/**
 * Shared Supabase Client
 * Convenience export for the supabase client
 */

import { createClient } from '../../supabase/client'

export const supabase = createClient()