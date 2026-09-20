# Deployment Guide — Calls (Voice & Video) on Vercel + Render

## Architecture

Calls use a **hybrid transport** system — no TURN server or third-party service needed:

```
Attempt 1 — WebRTC P2P (STUN only)
  ↓ Works on most home/office networks
  ↓ If not connected within 5 seconds…

Attempt 2 — Socket.IO media relay (server-side)
  ↓ Audio chunks sent as binary WebSocket frames through your Render server
  ↓ Works on ALL networks: 4G/5G, corporate firewalls, symmetric NAT, VPNs
```

P2P succeeds silently when possible (lower latency, no server bandwidth used).  
Relay kicks in automatically and invisibly when P2P fails.

---

## Required environment variables

### On Render (backend)

| Key | Value |
|---|---|
| `CLIENT_URL` | Your Vercel URL — e.g. `https://learnspace.vercel.app` |
| `NODE_ENV` | `production` |

`CLIENT_URL` is the only variable that needs manual configuration.  
Without it the REST API CORS policy blocks requests from your Vercel frontend.

### On Vercel (frontend)

| Key | Value |
|---|---|
| `VITE_API_URL` | `https://learnspace-backend.onrender.com` |
| `VITE_SOCKET_URL` | `https://learnspace-backend.onrender.com` |

After adding these, do **Redeploy** so Vite bakes them into the build.

---

## Render free tier — hibernation

The free plan hibernates after ~15 minutes of inactivity. First request after
hibernation takes 30–60 seconds (cold start), during which Socket.IO will fail
to connect.

**Already handled in the code:**
- The client pings `/api/health` every 10 minutes while any user is logged in.
- Socket.IO uses `reconnectionAttempts: Infinity` and a 60s timeout so it
  recovers automatically after a cold start.

**Also recommended:** Set up a free [UptimeRobot](https://uptimerobot.com)
monitor to hit `https://learnspace-backend.onrender.com/api/health` every
10 minutes. This keeps the server warm even when no users are active.

---

## Verification

### Check the backend is alive
```
curl https://learnspace-backend.onrender.com/api/health
```
Expected: `{ "status": "ok", ... }`

### Check ICE servers are served
```
curl https://learnspace-backend.onrender.com/api/ice-servers
```
Expected: `{ "iceServers": [ { "urls": "stun:..." }, ... ] }`

### Test a call
1. Open the app in two browser tabs on **different networks** (e.g. one on WiFi,
   one on mobile hotspot) to exercise the relay path.
2. Join the same voice room.
3. Audio should connect within a few seconds — either P2P directly or via relay.

---

## Local development

No special setup needed. Both P2P and relay work locally since both peers are
on the same machine or LAN.

```bash
# Terminal 1
cd server && cp .env.example .env && npm run dev

# Terminal 2
cd client && cp .env.example .env && npm run dev
```

---

## Checklist

- [ ] Set `CLIENT_URL` on Render to your Vercel domain
- [ ] Set `VITE_API_URL` and `VITE_SOCKET_URL` on Vercel and redeploy
- [ ] Verified `/api/health` returns `ok`
- [ ] Set up UptimeRobot to ping `/api/health` every 10 min
- [ ] Tested a call between two different networks
