/**
 * Supabase Admin Client for RLS setup and administrative tasks
 */

import { createClient } from '@supabase/supabase-js'

// Admin client with service role key
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

/**
 * Initialize RLS policies if they don't exist
 */
export async function initializeRLSPolicies() {
  try {
    console.log('🔒 Initializing RLS policies...')
    
    // Check if RLS is already enabled on stories table
    const { data: policies } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'stories')
    
    if (!policies || policies.length === 0) {
      console.log('❌ Stories table not found')
      return false
    }

    // Enable RLS on all tables
    const rlsStatements = [
      'ALTER TABLE users ENABLE ROW LEVEL SECURITY;',
      'ALTER TABLE oauth_tokens ENABLE ROW LEVEL SECURITY;',
      'ALTER TABLE timelines ENABLE ROW LEVEL SECURITY;',
      'ALTER TABLE stories ENABLE ROW LEVEL SECURITY;',
      'ALTER TABLE ai_prompts ENABLE ROW LEVEL SECURITY;',
      'ALTER TABLE generation_jobs ENABLE ROW LEVEL SECURITY;'
    ]

    for (const statement of rlsStatements) {
      try {
        await supabaseAdmin.rpc('exec_sql', { sql: statement })
      } catch (error) {
        console.log(`⚠️ RLS already enabled or error: ${error}`)
      }
    }

    // Create policies
    const policies_sql = [
      // Users policies
      `CREATE POLICY IF NOT EXISTS "Users can view own profile" ON users
       FOR SELECT USING (auth.uid() = id);`,
      
      `CREATE POLICY IF NOT EXISTS "Users can update own profile" ON users
       FOR UPDATE USING (auth.uid() = id);`,
      
      `CREATE POLICY IF NOT EXISTS "Enable insert for authenticated users" ON users
       FOR INSERT WITH CHECK (auth.uid() = id);`,

      // Stories policies
      `CREATE POLICY IF NOT EXISTS "Users can manage own stories" ON stories
       FOR ALL USING (auth.uid() = user_id);`,

      // Timelines policies
      `CREATE POLICY IF NOT EXISTS "Users can manage own timelines" ON timelines
       FOR ALL USING (auth.uid() = user_id);`,

      // OAuth tokens policies
      `CREATE POLICY IF NOT EXISTS "Users can manage own tokens" ON oauth_tokens
       FOR ALL USING (auth.uid() = user_id);`,

      // AI prompts policies
      `CREATE POLICY IF NOT EXISTS "Users can manage prompts for own stories" ON ai_prompts
       FOR ALL USING (
         EXISTS (
           SELECT 1 FROM stories 
           WHERE stories.id = ai_prompts.story_id 
           AND stories.user_id = auth.uid()
         )
       );`,

      // Generation jobs policies
      `CREATE POLICY IF NOT EXISTS "Users can manage own generation jobs" ON generation_jobs
       FOR ALL USING (auth.uid() = user_id);`
    ]

    for (const policy of policies_sql) {
      try {
        await supabaseAdmin.rpc('exec_sql', { sql: policy })
      } catch (error) {
        console.log(`⚠️ Policy creation error: ${error}`)
      }
    }

    console.log('✅ RLS policies initialized successfully')
    return true
    
  } catch (error) {
    console.error('❌ Error initializing RLS policies:', error)
    return false
  }
}

/**
 * Execute raw SQL with admin privileges
 */
export async function executeAdminSQL(sql: string) {
  try {
    const result = await supabaseAdmin.rpc('exec_sql', { sql })
    return { success: true, data: result.data, error: null }
  } catch (error) {
    console.error('Admin SQL execution error:', error)
    return { success: false, data: null, error }
  }
}