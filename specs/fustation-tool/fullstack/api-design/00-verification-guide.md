# Platform Endpoint Verification Guide

The extension consumes, and does not own, the endpoints listed in `docs/02-backend-conventions.md` section 1. Use this guide when the site changes or a fetch path breaks.

## 1. Fixture Checks (offline)

1. Capture the page while logged in: exam view into `docs/webfetches/examview/`, catalog into `docs/webfetches/home/` or `subject/`.
2. Run `npm test`. Suites 1 to 7 cover RSC parsing, schema, math, images, and PE assets; suite 9 asserts catalog discovery (30 tasks on `homepage-html.html`, 357 on `hompage-fullfetch.html`).
3. A drop in discovered tasks or a `null` dataset means the payload shape moved; compare the new capture against `docs/00-system-context.md` section 5.A.

## 2. Live Checks (logged-in browser, DevTools on fustation.net)

| Endpoint | Check | Pass |
|---|---|---|
| `/marketplace/exam/{cuid}?_rsc=1` | `fetch(url,{credentials:'include'}).then(r=>r.status)` | `200`, body contains `initialData` |
| `/marketplace/{cuid}?_rsc=1` | same | `200` |
| `/api/exams/pdf?productId={id}` | open in tab | PDF renders; `404` means an invalid id was built |
| `/api/exams/question-image?key={key}` | open in tab | image renders |
| presigned ZIP | open `zipUrl` from a fresh RSC fetch | downloads; `403` means expired, refresh via RSC |

## 3. Rules

- Only verify with your own logged-in session. Never paste cookies or presigned URLs into issues or commits.
- Record any shape change as a new issue in `docs/log-issues.md` before changing the parser.
