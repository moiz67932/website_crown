/**
 * Script to regenerate landing page AI content
 * This deletes the cached content so it will be regenerated on next page load
 * 
 * Usage: node regenerate-landing-content.js [city] [page-name]
 * Example: node regenerate-landing-content.js "los angeles" "homes-under-500k"
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function regenerateLandingContent(city, pageName) {
  const lowercaseCity = city.toLowerCase()
  
  console.log(`\n🔄 Regenerating content for: ${city} - ${pageName}`)
  console.log(`   Looking for city: "${lowercaseCity}", page_name: "${pageName}"`)
  
  try {
    // First, check if the entry exists
    const { data: existing, error: checkError } = await supabase
      .from('landing_pages')
      .select('city, page_name, updated_at')
      .eq('city', lowercaseCity)
      .eq('page_name', pageName)
      .maybeSingle()
    
    if (checkError) {
      console.error('❌ Error checking existing content:', checkError.message)
      return
    }
    
    if (!existing) {
      console.log('⚠️  No existing entry found - content will be generated on first page load')
      return
    }
    
    console.log(`✅ Found existing entry (last updated: ${existing.updated_at})`)
    
    // Delete the ai_description_html to force regeneration
    const { error: updateError } = await supabase
      .from('landing_pages')
      .update({ 
        ai_description_html: null,
        updated_at: new Date().toISOString()
      })
      .eq('city', lowercaseCity)
      .eq('page_name', pageName)
    
    if (updateError) {
      console.error('❌ Error clearing AI content:', updateError.message)
      return
    }
    
    console.log('✅ Successfully cleared AI content')
    console.log('📝 Content will be regenerated on next page load')
    console.log(`   Visit: http://localhost:3000/california/${lowercaseCity.replace(/\s+/g, '-')}/${pageName}`)
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

async function listLandingPages() {
  console.log('\n📋 Fetching all landing pages...')
  
  try {
    const { data, error } = await supabase
      .from('landing_pages')
      .select('city, page_name, updated_at')
      .order('city', { ascending: true })
      .order('page_name', { ascending: true })
    
    if (error) {
      console.error('❌ Error fetching landing pages:', error.message)
      return
    }
    
    if (!data || data.length === 0) {
      console.log('⚠️  No landing pages found')
      return
    }
    
    console.log(`\n✅ Found ${data.length} landing pages:\n`)
    data.forEach((page, i) => {
      console.log(`${i + 1}. City: "${page.city}", Page: "${page.page_name}" (updated: ${page.updated_at})`)
    })
    console.log('\nUsage: node regenerate-landing-content.js "<city>" "<page-name>"')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

// Main execution
const args = process.argv.slice(2)

if (args.length === 0) {
  // No args - list all landing pages
  listLandingPages()
} else if (args.length === 2) {
  // City and page name provided
  const [city, pageName] = args
  regenerateLandingContent(city, pageName)
} else {
  console.error('❌ Invalid arguments')
  console.error('Usage: node regenerate-landing-content.js [city] [page-name]')
  console.error('Example: node regenerate-landing-content.js "los angeles" "homes-under-500k"')
  console.error('\nOr run without arguments to list all landing pages')
  process.exit(1)
}
