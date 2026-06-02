const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.env.APPDATA, 'big-brother', 'big-brother.db');
const db = new Database(dbPath);

console.log('=== Keywords ===');
console.log('Count:', db.prepare('SELECT COUNT(*) as c FROM keywords').get());
const kws = db.prepare('SELECT term, enabled, match_mode FROM keywords LIMIT 5').all();
console.log('First 5:', JSON.stringify(kws, null, 2));

console.log('\n=== Monitoring Settings ===');
const settings = db.prepare("SELECT * FROM settings WHERE key LIKE 'monitoring%'").all();
console.log(JSON.stringify(settings, null, 2));

console.log('\n=== Logs ===');
console.log('Count:', db.prepare('SELECT COUNT(*) as c FROM logs').get());

db.close();
