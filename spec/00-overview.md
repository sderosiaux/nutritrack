# Foodvisor OSS Clone — Project Overview

## What We're Building

A free, open-source, web-based clone of [Foodvisor](https://apps.apple.com/us/app/foodvisor-ai-calorie-counter/id1064020872) — an AI-powered nutrition and calorie tracking app. The target is a responsive web app (mobile-first, works on all devices) that covers the core Foodvisor experience without proprietary dependencies.

**Name: `nutritrack`** — https://github.com/sderosiaux/nutritrack

---

## Product Vision

> Help people understand what they eat, reach health goals, and build sustainable habits — with zero lock-in, fully open-source, self-hostable.

---

## Scope (OSS vs Proprietary)

| Feature | Foodvisor | OSS Clone | Notes |
|---|---|---|---|
| Photo food recognition | Proprietary ML | Open model (e.g. USDA + open CV model or LLM vision) | See `05-tech-stack.md` |
| Barcode scanning | Yes | Yes (Open Food Facts API) | Fully open |
| Manual food entry | Yes | Yes | Core feature |
| Voice logging | Yes | Yes (Web Speech API) | Browser-native |
| Calorie/macro tracking | Yes | Yes | Core |
| Hydration tracking | Yes | Yes | Core |
| Weight tracking | Yes | Yes | Core |
| Activity tracking | Yes | Yes | Core |
| Educational lessons | Yes | Yes | Open content |
| Recipes | Yes | Yes | Open content |
| Color-coded food system | Yes | Optional | Configurable |
| Nutritionist chat | Paid/human | Not in v1 | Future: AI coach |
| Apple Health sync | iOS only | PWA health APIs | Limited on web |
| Registered dietitian | Paid | Out of scope | |
| Subscription/paywall | Yes | No | Fully free |

---

## Target Users

- People tracking calories and nutrition for weight loss, muscle gain, or maintenance
- Privacy-conscious users who want self-hosted or open-source alternatives
- Developers who want to extend/customize their nutrition tracker
- Communities (gyms, clinics) deploying a private instance

---

## Key Differentiators vs Foodvisor

1. **No paywall** — all features free
2. **Self-hostable** — Docker Compose, one command
3. **Open food database** — Open Food Facts + USDA FoodData Central
4. **No dark patterns** — no auto-renewing subscriptions, no manipulative color-coding
5. **Privacy-first** — no tracking, GDPR by design
6. **Extensible** — REST API, plugin-ready
