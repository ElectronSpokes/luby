# Use Cases — Luby
*Maintained by: Cleireach*
*Last updated: 2026-05-25*

## Overview

Luby is a personal wellness companion that replaces a stack of bloated health apps with one simple, AI-coached tool. The primary user is 48k — built for daily use, not for a market. The app lives on the phone, knows your day, and coaches rather than just counting. Use cases are ordered by how often they happen in a typical day.

---

## UC-1: Log Food Quickly

**Consumer**: 48k — eating a meal, wants to track it in seconds.

**Situation today**: Open the app, tap the food tab, either type a description or use the camera scanner. Camera sends a photo to Gemini Vision which returns calories, protein, carbs, fat, fiber, sugar. Confirm or edit, tap save. Haptic feedback confirms the log.

**What they need**:
- Log a meal in under 10 seconds (camera scan path)
- Accurate macro breakdown without manual data entry
- Edit AI estimates when they're wrong
- See today's running total immediately after logging

**Success looks like**: Every meal logged without friction. Open app → point camera → confirm → done. The AI estimates are close enough that editing is rare.

**When it fails**: The camera scan misidentifies food or gives wildly wrong macros. The user stops scanning and falls back to manual entry (slower), or stops logging altogether.

**Traces to**: Vision ("Simple — log anything in seconds"), Roadmap (Core App)

---

## UC-2: Track Hydration

**Consumer**: 48k — drinking water throughout the day.

**Situation today**: Tap hydration tab, tap the glass icon, amount logged. Haptic tap confirms. Running total visible.

**What they need**:
- One-tap water logging (no menus, no typing)
- Running total visible at a glance
- Reminder if they haven't logged in a while (future: push notification)

**Success looks like**: Logging water is so fast it becomes automatic. Tap, feel the haptic, move on.

**When it fails**: Too many taps to log. Or the reminder is annoying instead of helpful.

**Traces to**: Vision ("Simple"), Roadmap (Core App, Priority 2: Push Notifications)

---

## UC-3: Track Movement

**Consumer**: 48k — finished a workout or walk, wants to log it.

**Situation today**: Movement tab, select activity type, enter duration and intensity. Save.

**What they need**:
- Quick logging after activity (not during — this isn't a fitness tracker)
- Activity types that match what they actually do
- Duration as the primary metric (not steps or GPS)

**Success looks like**: Log a walk in 5 seconds. Activity type remembered from last time.

**When it fails**: Too many fields. Or activity types don't match real activities.

**Traces to**: Vision ("Simple"), Roadmap (Core App)

---

## UC-4: Run a Fasting Timer

**Consumer**: 48k — starting an intermittent fast, wants to track duration.

**Situation today**: Fasting tab, set target duration, start timer. Timer shows elapsed time and progress toward target. Complete when done. History of past fasts visible.

**What they need**:
- Start/stop a fast with one tap
- See progress toward target duration
- Get notified when the fast completes (future: push notification)
- History of completed fasts

**Success looks like**: Start fast after dinner, phone buzzes in the morning when target is hit. Log shows a streak.

**When it fails**: Timer doesn't persist if app is closed. No notification means they forget to check.

**Traces to**: Vision ("Complete"), Roadmap (Core App, Priority 2: Push Notifications)

---

## UC-5: Get a Daily Coaching Plan

**Consumer**: 48k — morning routine, wants to know what to focus on today.

**Situation today**: Coaching tab, tap generate. Gemini receives today's stats (food, hydration, movement so far) and produces a personalised plan with eating steps and movement steps. Plan cached — one per day.

**What they need**:
- A plan that reflects what they actually ate/did today, not generic advice
- Specific, actionable steps ("eat more protein at lunch" not "maintain a balanced diet")
- One plan per day — not a new one every time they open the tab

**Success looks like**: Read the coaching plan over breakfast. It references yesterday's actual intake. The steps are specific enough to follow.

**When it fails**: Coaching is generic because the AI doesn't receive enough context. Or the plan conflicts with what they've already eaten. Or it feels like a lecture.

**Traces to**: Vision ("Smart — AI that understands your day"), Roadmap (AI Integration)

---

## UC-6: Scan Food with Camera

**Consumer**: 48k — looking at a plate of food, wants macros without typing.

**Situation today**: Tap camera icon on food tab. Capacitor native camera opens. Take photo. Base64 sent to `POST /ai/scan-food`. Gemini Vision returns structured macro breakdown. User confirms or edits values, then saves.

**What they need**:
- Fast camera launch (native, not browser `getUserMedia`)
- Accurate food identification from a photo
- Reasonable macro estimates (within ~20% of actual)
- Ability to correct before saving

**Success looks like**: Point at plate, tap, see "Chicken stir fry — 450 cal, 35g protein". Confirm. Done.

**When it fails**: Camera is slow to open. AI identifies food incorrectly ("rice" when it's couscous). Macros are way off. Multiple items on plate confused.

**Traces to**: Vision ("Smart"), Roadmap (AI Integration), Architecture (Gemini Vision endpoint)

---

## UC-7: Generate a Weekly Meal Plan

**Consumer**: 48k — Sunday evening, planning the week ahead.

**Situation today**: Meal planner tab, set preferences, generate. Gemini produces a 7-day plan with breakfast/lunch/dinner/snack for each day plus a consolidated shopping list. Save plan and shopping list.

**What they need**:
- Meal plan that reflects dietary preferences and goals
- Shopping list they can actually take to the store
- Ability to check off shopping items

**Success looks like**: Generate plan Sunday, shop Monday, follow it all week. Shopping list checked off in the store.

**When it fails**: Meals are unrealistic (who has time for a 3-course Tuesday lunch?). Ingredients are hard to find locally. Shopping list is disorganised.

**Traces to**: Vision ("Complete"), Roadmap (AI Integration)

---

## UC-8: Chat with Luby

**Consumer**: 48k — has a health question or wants conversational advice.

**Situation today**: Chat tab, type a message. Gemini receives the conversation history plus current health stats as context. Responds as the Luby persona — friendly, knowledgeable, encouraging.

**What they need**:
- Natural conversation about health and wellness
- Answers grounded in their actual data ("you've had 1200 cal today, so...")
- Consistent persona across conversations
- Chat history preserved

**Success looks like**: Ask "what should I eat for dinner?" and get an answer that accounts for what you already ate today.

**When it fails**: Luby gives generic advice that ignores your data. Or the persona is inconsistent. Or chat history is lost.

**Traces to**: Vision ("Personal"), Roadmap (AI Integration)

---

## UC-9: Use the App on My Phone

**Consumer**: 48k — wants to log health data wherever they are, not just at a desk.

**Situation today**: Debug-signed APK installed on Android device. Google Sign-In for auth (native popup, no browser redirect). Frontend bundled in APK, API calls go through Cloudflare Tunnel. Works anywhere with internet. Production-signed APK + Play Store distribution still pending (see Roadmap P1).

**What they need**:
- App on their phone (home screen, not a bookmark)
- Fast launch — open to the dashboard, not a loading screen
- Auth that persists (30-day JWT, no daily re-login)
- Works on mobile data, not just home WiFi

**Success looks like**: Tap app icon, see today's dashboard immediately, log food, close. No auth prompts, no loading spinners.

**When it fails**: Login screen on every launch. Slow to load. Doesn't work outside home network. App Store submission blocked by credentials/signing.

**Traces to**: Vision ("Available on phone"), Roadmap (Mobile Shell, Priority 1: App Store)

---

## UC-10: Search and Save Recipes

**Consumer**: 48k — looking for recipe ideas that match their health goals.

**Situation today**: Recipes tab, type a search. Gemini generates recipe suggestions with ingredients and steps. Save favourites for later.

**What they need**:
- Recipe search that accounts for dietary preferences
- Clear ingredients list and steps
- Save and retrieve favourites

**Success looks like**: Search "high protein dinner", get 3 good options, save one, cook it.

**When it fails**: Recipes are impractical or don't match dietary goals. Saved recipes hard to find later.

**Traces to**: Vision ("Complete"), Roadmap (AI Integration)

---

## UC-11: See Health Trends Over Time

**Consumer**: 48k — wants to know if they're making progress.

**Situation today**: Partial — basic recharts `BarChart` of the last 7 food entries shipped in `App.tsx`. No multi-domain charts (hydration, movement, fasting), no weekly/monthly summaries, no trend lines, no AI-generated weekly recap.

**What they need**:
- Weekly/monthly charts of food intake, hydration, movement
- Trend lines showing direction (improving, declining, stable)
- AI-generated weekly summary ("This week you averaged 1800 cal/day, up from 1600 last week")

**Success looks like**: Glance at a chart, see the trend, feel motivated (or informed).

**When it fails**: Charts are confusing or ugly. No insight beyond raw numbers. Looking at data feels like work, not progress.

**Traces to**: Vision ("Personal — your data, your patterns"), Roadmap (Priority 5: Data and Insights)

---

## UC-12: Use the App Offline

**Consumer**: 48k — in an area with poor signal, still wants to log.

**Situation today**: Not built yet. `better-sqlite3` is in dependencies but not wired. No offline cache, no sync queue.

**What they need**:
- Log food/hydration/movement without internet
- Entries sync automatically when connection returns
- No data loss — if they logged it offline, it persists

**Success looks like**: Log a meal on the train with no signal. When you get home, it syncs silently.

**When it fails**: App shows errors or blank screens offline. Synced data conflicts with server state. Duplicate entries.

**Traces to**: Vision ("Works offline for basic logging"), Roadmap (Priority 3: Offline Support)

---

## Sources

*Consolidated from:*
- `product/vision.md` — target users, pillars, success criteria
- `product/roadmap.md` — feature status and priorities
- `product/architecture.md` — technical capabilities
- `product/data-flow.md` — how data moves through the system
