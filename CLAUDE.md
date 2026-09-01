# CLAUDE.md — marketpilot-ai

Guidance for Claude Code working in this repository. Everything below was verified
by reading the code; where a subsystem only *looks* implemented, that is called out.

---

## 1. What this is

An AI marketing-video SaaS ("MarketPilot AI"): a user describes a product/campaign,
the app plans a short vertical reel (scenes, voice lines, captions, transitions) and
renders it to MP4.

**Stack (from `package.json`, name `ai-video-saas`):**

- Next.js 14.2.15, App Router, React 18, TypeScript 5 (`strict: true`)
- Tailwind CSS 3 + `next-themes`, framer-motion, lucide-react, sonner, recharts
- Zustand 5 for client state
- `fluent-ffmpeg` + `ffmpeg-static` + `ffprobe-static` for rendering
- Path alias `@/*` → `./src/*`

**Not present, despite what the module names suggest:** no Prisma or any ORM, no
database driver, no `@google-cloud/storage`, no Stripe, no auth library, no AI SDK
(Gemini/OpenAI/Anthropic), no test runner. Only two env vars are read anywhere in
the repo: `HYBRID_AI_MODE` and `GEMINI_API_KEY`.

**Scripts:** `dev`, `build`, `start`, `lint`. There is no `test` script.

> `next.config.mjs` sets `eslint.ignoreDuringBuilds: true` **and**
> `typescript.ignoreBuildErrors: true`. The build passes regardless of type errors,
> and there are real ones (see §7). Run `npx tsc --noEmit` yourself before trusting
> a green build.

---

## 2. Directory map

```
src/
  app/
    page.tsx, login/, owner-login/, owner-dashboard/   # public + auth shells
    dashboard/[workspaceId]/{user-type,industry,library,campaign-builder/[type],studio/[campaignId]}
    api/                                              # 22 route handlers, see §4
    actions/auth.ts                                   # server actions (cookie only)
  middleware.ts                                       # cookie-based route gate
  components/                                         # 28 components; ~21 orphaned (§6)
  store/useAppStore.ts                                # 1439-line Zustand store, demo-seeded
  services/                                           # legacy/"v1" service layer
    aiProviderRouter, visionService, scriptService, avatarService,
    videoRenderService, renderers/{VideoRenderer,RendererFactory,FFmpegRenderer}
  modules/marketpilot/                                # the "v2" domain layer
    video-planner/      # campaign -> VideoPlan (deterministic templates)
    video-generator/    # VideoPlan -> RenderTimeline -> render submission
    orchestrator/       # step pipeline for campaign generation
    storage/            # StorageProvider interface + GCS *mock*
    database/           # in-memory repositories + DB-shaped types
    social-publisher/   # simulated platform publishing + analytics
    cinematic-ai/, visual-enhancement/, avatar-engine/, voice-personality/
    brand-profile/, campaign-profile/, workspace/, engine/, generators/, config/
  types/database.ts                                   # legacy domain types (§5)
  config/promotion-templates/, promotionTypes.config.ts
scripts/                                              # 11 hand-rolled test scripts
public/renders/                                       # committed render output + asset cache
```

There are effectively **two generations of code side by side**: the older
`src/services/*` + `src/types/database.ts` layer, and the newer
`src/modules/marketpilot/*` layer with its own types and repositories. They overlap
(two `User` types, two job models, two render entry points) and are only partly
bridged — `MarketPilotRenderAdapter` is the one seam between them.

---

## 3. Render pipeline (verified end to end)

There are **four** render entry points, and they do very different things. Only one
produces a real MP4.

### 3a. The real path — `POST /api/marketpilot/generate-video`

```
route.ts
  └─ HybridCreativePlanner.createCreativePlan()      -> VideoPlan   [BROKEN, see §7]
  └─ RenderCoordinator.startVideoGeneration(plan, ttsProvider, simulateAsync)
       ├─ activeJobs: static Map<videoId, MarketPilotVideoResult>   (in-process)
       ├─ runAsyncGenerationPipeline()   nested setTimeout 600/1300/2200/1200ms
       │    or runSyncGenerationPipeline()
       ├─ TimelineBuilder.buildTimeline(plan, ttsProvider)
       │    ├─ AssetGenerator.generateSceneAssets()   -> user mediaUrls or Unsplash pool
       │    └─ VoiceGenerator.generateVoiceTimeline() -> stock mixkit MP3, fake word timings
       └─ MarketPilotRenderAdapter.submitToExistingVideoEngine(timeline, mockMode=false)
            └─ VideoRenderService.createRenderJob()
                 ├─ mockJobs: static Map<jobId, RenderJob>          (in-process)
                 └─ executeProductionRender()
                      └─ RendererFactory.getRenderer("ffmpeg") -> FFmpegRenderer.render()
```

`FFmpegRenderer` (`src/services/renderers/FFmpegRenderer.ts`) is the one genuinely
implemented piece of infrastructure:

- lazily `require`s `fluent-ffmpeg` / `ffmpeg-static`, falls back to system PATH
- downloads remote assets (with redirect following) and `data:` URIs into
  `public/renders/cache/`
- builds a real `complexFilter` graph: scale/crop to 1080x1920 (or 1920x1080),
  centre product overlay, `drawtext` title at y=220 and caption at y=h-380,
  per-scene fade in/out, `fps=25`, `trim`, then `concat`; audio mapped with
  `-stream_loop -1`, AAC 192k
- writes `public/renders/render_<timelineId>_<ts>.mp4`
- on any FFmpeg error it silently falls back to `generateFallbackVideo()` — a black
  1080x1920 clip — and resolves as success

**Returns a local path: `/renders/<file>.mp4`.** Nothing else.

### 3b. Where GCS *would* go, and why it does not happen

- `FFmpegRenderer.render()` ends with the cloud upload **commented out**
  (`// const cloudUrl = await CloudStorage.uploadFile(...)`), and returns `publicUrl`.
- `GCSStorageProvider` (`modules/marketpilot/storage/providers/gcsStorageProvider.ts`)
  is a stub: `console.log("[GCS Mock] ...")`, a 100 ms sleep, and a synthesised
  `gs://bucket/path` string. `getSignedUrl` returns a URL with
  `?signature=mock_sig`. No GCS SDK, no credentials, no bucket config.
- The only production caller is `POST /api/marketpilot/campaigns/generate`, which
  constructs `new GCSStorageProvider()` → `AssetService` → `GenerationOrchestrator`.
  The upload lives in `AssetResolutionStep`, which returns immediately unless
  `context.assetLocalPaths` is non-empty — and that route never sets it.

So: **the render pipeline never touches GCS.** Output lives on the server's local
disk under `public/renders/` (which is committed to git — ~40 MP4s and a cache of
JPG/PNG/MP3 files are in the repo). This is the single biggest gap between the
architecture as designed and as built.

Also note there is **no worker process**. "Async" is `setTimeout` inside the Next.js
server process, and job state is a `static Map` on a class. On serverless/multi-
instance deploys, or any restart, in-flight jobs vanish and status polling 404s.

### 3c. `POST /api/marketpilot/campaigns/generate` — orchestrator path

`GenerationOrchestrator` runs four `GenerationStep`s with retry (max 2) and
per-step timing, writing job state through `JobRepository`:
`AssetResolution → CreativePlanning → TimelineAssembly → Render`.
The final `RenderStep` is stubbed — it sets `context.videoUrl = "mock_output_url"`
with the real call commented out. The route fires it with
`orchestrator.runGeneration(ctx).catch(console.error)` and returns immediately;
`GET /api/marketpilot/campaigns/status?jobId=` polls `JobRepository`.

### 3d. Simulation-only endpoints

- `POST /api/render-video` — defaults `mockMode: true` and passes an empty
  `renderTimeline`; drives five fake milestones (10/30/50/75/100%) via `setTimeout`
  and finishes with a hardcoded mixkit.co stock URL as `outputUrl`.
- `POST /api/render-hybrid-video` — no logic at all: sleeps 900 ms, returns the same
  stock mixkit URL plus invented metadata (`1080x1920`, 60fps, 12Mbps).

---

## 4. API surface (22 routes)

`src/app/api/`

| Route | Real work? |
|---|---|
| `marketpilot/generate-video` (POST/GET) | Yes — the FFmpeg path. POST currently broken (§7) |
| `marketpilot/campaigns/generate`, `campaigns/status`, `campaigns` | Orchestrator + in-memory jobs; render step stubbed |
| `marketpilot/video-plan` (+ `/test`) | Deterministic planner output |
| `marketpilot/generate-script`, `analyze`, `create-campaign` | Delegate to mock services |
| `marketpilot/publish` (+ `/test`), `schedule`, `analytics` | Simulated publishing / `Math.random()` metrics |
| `marketpilot/test`, `marketpilot/generate-video/test` | Run the hand-rolled suites and return JSON |
| `render-video`, `render-hybrid-video` | Simulation only |
| `analyze-video`, `generate-script` | `VisionService` / `ScriptService` — mock branch only |
| `publish-social` | 500 ms sleep, fabricated `postId` |
| `assets`, `projects` | Return hardcoded sample arrays |

No route reads a session or checks authorization. `middleware.ts` only matches
`/dashboard/*` and `/owner-dashboard/*`, so every API route is public.

---

## 5. Data model

There is **no database**. Two parallel type systems describe one, and seven
repositories implement it as `static Map`s that die with the process.

**`src/modules/marketpilot/database/types/database.types.ts`** — the current model:

- `DBWorkspace` (extends `Workspace`) — `workspaceId`, `ownerId`
- `DBBrandProfile` (extends `BrandProfile`) — `brandId`, `workspaceId`
- `DBCampaign` — `campaignId`, `workspaceId`, `brandId?`, `campaignProfile`, `status: DRAFT|GENERATING|COMPLETED|FAILED`
- `DBGeneratedVideo` — `videoId`, `campaignId`, `videoUrl?`, `status: PROCESSING|READY|FAILED`
- `GenerationJob` — `jobId`, `campaignId`, `provider` (`replicate|flux|runway|google_cloud_run|string`), `status: PENDING|RUNNING|COMPLETED|FAILED`, `externalId?`
- `AssetRecord` — `assetId`, `userId`, `workspaceId`, `campaignId?`, `storageUrl` (`gs://…`), `assetType`, `status: UPLOADING|READY|FAILED`

Ownership chain: `User → Workspace → Brand → Campaign → {GeneratedVideo, GenerationJob, Asset}`.

**Repositories** (`database/repositories/`): `user`, `workspace`, `brand`, `campaign`,
`video`, `job`, `asset`. Each is 14–27 lines, `private static X: Map<string, T>`,
with `create` / `findById` / occasionally `update` / `findBy…Id`. No delete, no
list-all, no pagination, no transactions, no persistence.

**`src/types/database.ts`** (315 lines) is the older, richer, *unused-by-the-domain*
model: `User`, `Organization`, `Brand`, `MediaAsset`, `ScriptVersion`,
`VideoProject`, `ChatMemory`, `RenderJob` (+ `RenderJobStatus` =
`QUEUED|ANALYZING|SCRIPTING|AVATAR_PREP|COMPOSITING|COMPLETED|FAILED`),
`ProductCatalogItem`, `PromotionCampaign(Plan)`, `IndustryTemplate`,
`SaaSPricingTier`. It backs `VideoRenderService`, the `assets`/`projects` sample
routes, and the Zustand store. **Treat it as legacy** — but `VideoRenderService`
still depends on it, so it cannot simply be deleted.

When a real DB lands, `database.types.ts` is the schema to port and the repository
classes are the seam to reimplement.

---

## 6. Complete vs half-built

### Genuinely implemented

- **FFmpeg rendering** — `FFmpegRenderer`, `RendererFactory`, `VideoRenderer`.
- **Video planner** (`video-planner/`) — `ScenePlanner` + 8 scene templates,
  `timingCalculator` (ratio normalisation with last-scene drift correction),
  `transitionPlanner`, `voicePlanner`, `visualPlanner`, `hybridCreativePlanner`,
  `motionDirector`, plus plan validation (ordering, NaN timestamps, >0.5 s gaps).
  Fully working — and **entirely deterministic template logic, not AI**.
- **Timeline assembly** — `TimelineBuilder`, `sceneRenderer` (layer config),
  `videoExporter` (real SRT generation with correct timecode formatting).
- **Orchestrator skeleton** — step interface, retry, metrics, job lifecycle.
- **Provider/registry plumbing** — storage, cinematic, and visual-enhancement all
  have clean interfaces + registries. Extensible; just unimplemented behind.
- **UI shell** — landing page, theme provider, Tailwind design system, and a large
  library of polished studio components.

### Mocked, stubbed, or fake

| Area | Reality |
|---|---|
| Auth | `actions/auth.ts` sets an unsigned `mock_role` cookie with no arguments. Login forms' inputs have no `name` and are never read. `document.cookie = "mock_role=owner"` grants the owner dashboard. No user store, no credential check, no session. |
| GCS / storage | `console.log` mock, `signature=mock_sig`. Never called from any render path. |
| Persistence | Seven `static Map` repositories. Zustand store has no `persist` middleware. |
| AI text | `AIProviderRouter.generateText()` — the `if (provider === "gemini" && GEMINI_API_KEY)` block is an **empty `try {}`**; always falls through to a 400 ms sleep and `Synthesized AI output for prompt: …`, `providerUsed: "mock"`. |
| Vision / script / avatar | `visionService`, `scriptService`, `avatarService` default `mockMode ?? true` and **throw** on the non-mock branch ("configured in provider-ready mode"). Hardcoded keyframes, one fixed script, three Unsplash personas, `avatarStreamUrl: "mock://…"`. |
| TTS | `voiceGenerator` maps every provider to a mixkit.co **sound-effect** MP3. There is no speech anywhere. Word timings are `duration ÷ wordCount`, not forced alignment. |
| Image generation | `assetGenerator` picks from hardcoded Unsplash pools when the user supplies no media. |
| Asset analysis | `assetAnalyzer.simulateVisionAnalysis()` derives sharpness/lighting from a djb2 hash of the URL. |
| Cinematic AI | Only `mockCinematicProvider` exists; registry defaults to `"mock"`. |
| Visual enhancement | Only `standardVisualProvider`; `removeBackground()` returns the source URL unchanged. |
| Social publishing | `platformAdapters.validateCredentials()` → `return true`. `publishVideo()` sleeps 350 ms and fabricates `IG_REEL_<random>` IDs and plausible URLs. No OAuth, no HTTP. |
| Analytics | `analyticsTracker` generates metrics from `Math.random()`. |
| Owner dashboard | 100% static literals, including a fake "GCS Upload Timeout Exception" incident list. |
| Billing (Stripe) | Not present at all. `SaaSPricingModal` is UI only. |

### Dead / unreachable code

Only **5 of the 28 components under `src/components/` are reachable from a page**:
`ThemeProvider` (`app/layout.tsx`) and `public/{LandingNavigation, HeroSection,
ProductDemo, HowItWorks}` (`app/page.tsx`). Nothing else is imported by any route.

The other 23 form a dead island. `MarketPilotDashboard` pulls in `VideoPlanPreview`,
`VideoCreationStudio` (→ `HybridVideoPlayer`) and `MarketPilotCampaignDashboard`
(→ `CampaignList`, `CampaignPreviewModal`, `PublishScheduleModal`,
`AnalyticsDashboard`, `ScheduleCalendar`) — but nothing imports
`MarketPilotDashboard`. `Header` (→ `SaaSPricingModal`), `Sidebar`, `BrandKitModal`,
`RenderProgressModal`, `SocialPublisher`, `MultimodalDropzone`,
`ProductVideoCreator`, `BrandPromotionCreator`, `CompositorModeSelector`,
`PromotionWorkflowSelector`, `SessionChatSidepanel` and `VisionInspectorDrawer` have
no importer at all. `dashboard/layout.tsx` and `owner-dashboard/page.tsx` contain a
literal `{/* Sidebar */}` JSX comment and inline their own markup rather than
importing the component.

Consequently **the 1439-line Zustand store is unreachable** (every file importing it
is orphaned) and **20 of 22 API routes are called by no reachable UI**. What a user
can actually reach: landing page → cookie login → hardcoded workspace card → three
static chooser/library screens → a 3-step campaign wizard that posts only
`{workspaceId, type}` (all its form fields are decorative) → a studio page that polls
status while faking its own progress bar client-side.

### Tests

16 `*.test.ts` files and 11 `scripts/*.ts`, none of which use a test framework —
they export `runXTestSuite()` with a hand-rolled `assert` and self-execute under
`require.main === module`. There is no jest/vitest/ts-node/tsx dependency and no
`test` script, so **nothing in the repo can currently run them** except the two
`/api/**/test` routes that import a suite directly.

---

## 7. Known bugs to be aware of

1. **`POST /api/marketpilot/generate-video` is broken on its main path.**
   `route.ts:55` calls `HybridCreativePlanner.createCreativePlan(...)` without
   `await`, but the method is `async`. `videoPlan` becomes a `Promise`, so the guard
   at `route.ts:67` sees `videoPlan.scenes === undefined` and every hybrid request
   returns **HTTP 400 "Invalid request. A valid VideoPlan object with scenes is
   required."** Adding `await` is the fix.
2. **`generationOrchestrator.ts:6` imports `"../../services/renderers/FFmpegRenderer"`,
   which resolves to `src/modules/services/...` — a directory that does not exist.**
   It only survives because the import is unused *and* `ignoreBuildErrors` is on.
3. **`TimelineAssemblyStep` passes the wrong argument.**
   `orchestrator:46` calls `TimelineBuilder.buildTimeline(videoPlan, context.campaignId)`,
   but the second parameter is `ttsProvider: TTSProviderType`. It degrades silently
   to the `mock` audio track.
4. **`scenePlanner.test.ts:181` doesn't `await` its async suite**, so
   `report.failed` is `undefined`, the report prints `Passed: undefined`, and
   `process.exit()` always returns 0. The suite can never fail.
5. **`renderCoordinator.runAsyncGenerationPipeline`'s `try/catch` catches nothing** —
   all work happens inside `setTimeout` callbacks, so a failure there is an unhandled
   rejection and the job is stuck in `RENDERING_VIDEO` forever.
6. **`scriptService.ts:38-40`** — both branches of the `isRecruiting` conditional
   produce the same hook string (dead conditional).
7. `public/renders/` (~40 MP4s + cache) is committed and not gitignored; it grows
   on every local render.

---

## 8. Conventions

- Domain logic lives in `src/modules/marketpilot/<domain>/`, with `types/` beside it
  and `__tests__/` for the hand-rolled suites. Prefer adding there, not to
  `src/services/`.
- Classes with `static` methods are the dominant style for services, repositories,
  engines and planners; instances are used only where a dependency is injected
  (`AssetService`, `GenerationOrchestrator`).
- New external capabilities follow the interface + registry + provider pattern
  (`storage.types.ts` / `cinematicProvider.interface.ts` /
  `visualProvider.interface.ts`). Add a real provider next to the mock rather than
  editing the mock.
- Routes use `@/` imports in `src/app/api/marketpilot/generate-video` and
  deep relative imports (`../../../../../modules/...`) elsewhere. Prefer `@/`.
- `"use client"` components live under `src/components/`; server actions under
  `src/app/actions/`.

## 9. Working here

- `npm run dev` starts everything; rendering needs `ffmpeg-static` to have installed
  its binary (`npm install` must not have run with `--ignore-scripts`).
- Type errors do not fail the build — run `npx tsc --noEmit` explicitly.
- To exercise the real renderer, call `RenderCoordinator.startVideoGeneration(plan,
  provider, false)` (sync) with a valid `VideoPlan`, or fix bug #1 and POST to
  `/api/marketpilot/generate-video`.
- Anything labelled "AI" in a filename should be assumed mocked until proven
  otherwise by an actual network call — there are currently zero outbound HTTP
  calls to any model provider in this repo.
