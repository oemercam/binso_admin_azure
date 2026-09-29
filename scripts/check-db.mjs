import pg from "pg";
if(!process.env.DATABASE_URL)throw new Error("DATABASE_URL is required");
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.DATABASE_SSL==="false"?undefined:{rejectUnauthorized:false}});
try{const r=await pool.query("select current_database() db, now() now");console.log(r.rows[0])}finally{await pool.end()}
