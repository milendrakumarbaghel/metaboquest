# Connecting to the backend

Run Spring Boot on port 8080 and run `npm run dev` in this directory.
With no environment file, requests to `/api` are forwarded by Vite to
`http://localhost:8080`. The same proxy works with `npm run preview`.

For a different local backend port, copy `.env.example` to `.env.local`,
change `API_PROXY_TARGET`, and restart Vite.

For Vercel, set `VITE_API_BASE_URL` to the public Railway backend origin
(for example, `https://your-backend.up.railway.app`) before building, then
redeploy. Do not append `/api` or `/api/v1`: the client supplies those paths.
Vite's proxy runs only during local development and preview; it is not
included in a static deployment. Set the backend's `CORS_ALLOWED_ORIGINS`
and `FRONTEND_URL` to your deployed frontend origin.

If session creation returns 404, inspect the request URL in the browser's
Network panel. Locally, `/api/v1/quiz/sessions` on the Vite origin should
be proxied. In production, it should use the configured backend origin.
After changing any `VITE_*` variable, restart the dev server or rebuild
and redeploy the production frontend.

## Other settings

- `VITE_APP_MODE`: `connected` (default) talks to the backend. `standalone` bundles the questions and makes no network requests; it is what `npm run build:playable` uses. A failed connection never switches mode silently. In connected mode, the error screen offers a user-initiated "Play the offline edition instead".
- `VITE_STEER_URL`: destination of the "See if the programme fits you" and "Talk to a Steer doctor" buttons. Default `https://steerclub.com`. Only origin and path are used. No topic, answer, score or personal data is sent to Steer.
