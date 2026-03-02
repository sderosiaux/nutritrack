# Foodvisor OSS Clone — Spec

Free, open-source, self-hostable clone of the [Foodvisor](https://apps.apple.com/us/app/foodvisor-ai-calorie-counter/id1064020872) AI nutrition tracking app.

## Spec Files

| File | Contents |
|---|---|
| [00-overview.md](./00-overview.md) | Vision, scope, target users, differentiators |
| [01-features.md](./01-features.md) | Full feature breakdown with details |
| [02-data-models.md](./02-data-models.md) | DB schema, entity relationships, calorie formulas |
| [03-user-flows.md](./03-user-flows.md) | All user journeys with step-by-step flows |
| [04-screens.md](./04-screens.md) | Screen inventory, layouts, responsive breakpoints |
| [05-tech-stack.md](./05-tech-stack.md) | Full stack decisions with rationale |
| [06-ux-design.md](./06-ux-design.md) | Design system, color palette, components, UX fixes |
| [07-api.md](./07-api.md) | REST API endpoints, request/response shapes |
| [08-milestones.md](./08-milestones.md) | Build order, milestone checkboxes |

## What We're Building

> Foodvisor features — minus the paywall, minus the lock-in, plus self-hosting.

Core loop:
1. Log food (photo AI / barcode / search / voice)
2. Track calories + macros vs personal targets
3. Monitor weight + hydration + activity
4. Learn through bite-sized nutrition lessons
5. Browse and log recipes

## Key Technical Choices

- **Frontend**: Next.js 15 + Tailwind v4 + shadcn/ui
- **Backend**: Hono + Drizzle ORM + PostgreSQL
- **Auth**: Better Auth (self-hosted)
- **Food DB**: Open Food Facts + USDA FoodData Central
- **Photo AI**: Ollama (local LLaVA) or OpenAI Vision (configurable)
- **Deploy**: Docker Compose (one command)

## Sources

- [Foodvisor App Store](https://apps.apple.com/us/app/foodvisor-ai-calorie-counter/id1064020872)
- [Foodvisor website](https://www.foodvisor.io/en/)
- [Garage Gym Reviews — Foodvisor Review](https://www.garagegymreviews.com/foodvisor-review)
- [NutriScan vs Foodvisor comparison](https://nutriscan.app/blog/posts/nutriscan-vs-foodvisor-ai-nutrition-tracker-5938767c68)
- [FeastGood Foodvisor Review](https://feastgood.com/foodvisor-review/)
- [UX analysis — satukyrolainen.com](http://www.satukyrolainen.com/foodvisor-the-good-the-bad-and-the-ux/)
