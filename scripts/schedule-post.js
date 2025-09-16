// Minimal script: schedule a post by id. Usage: node schedule-post.js <postId>
// Requires environment variables for DB connection: DATABASE_URL
const { Client } = require('pg')

async function main() {
  const id = process.argv[2]
  if (!id) { console.error('Usage: node schedule-post.js <postId>'); process.exit(2) }
  const client = new Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()
  try {
    const res = await client.query(`update posts set status='scheduled', scheduled_at=now() - interval '1 minute' where id=$1`, [id])
    console.log('Updated rows:', res.rowCount)
  } catch (e) {
    console.error('SQL error:', e)
  } finally {
    await client.end()
  }
}

main()
