# Mongo cluster connection fix - My_tube/server

## Step 1 ✅
Update `My_tube/server/index.js`:
- validate `process.env.DB_URL`
- move Mongo connect before `app.listen`
- improve error logging for SRV/DNS/auth/network issues

## Step 2 ✅
Restart server and verify logs.
- New logs confirm SRV/DNS error with `hostname` + `code`

## Step 3
If SRV/DNS error persists:
- Use correct Atlas connection string format (try non-srv if available)
- Verify Atlas Network Access allows your IP
- If on a restricted network/VPN, test from a different network


