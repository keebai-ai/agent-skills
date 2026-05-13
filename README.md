# Keebai Agent Skills

Official agent skills for [Keebai](https://keebai.com), built on the open Agent Skills format.

## Install

```bash
npx skills add keebai-ai/agent-skills
```

Or clone manually:

```bash
git clone https://github.com/keebai-ai/agent-skills.git ~/.claude/skills/keebai-skills
```

## Available skills

| Skill | Purpose |
|---|---|
| [`integrate-keebai-whatsapp`](skills/integrate-keebai-whatsapp/SKILL.md) | Connect WhatsApp, send messages (text, media, interactive, templates), upload/download media, schedule broadcasts, receive webhook events. |

More skills (`automate-keebai-whatsapp`, `observe-keebai-whatsapp`) coming as additional Keebai surfaces stabilize.

## Setup

Each skill expects these environment variables:

```bash
export KEEBAI_API_KEY=pat_<hex64>        # Personal Access Token from app.keebai.com or `keebai-cli`
export KEEBAI_PHONE_NUMBER_ID=<numeric>  # Meta phone_number_id of your WhatsApp Business number
export KEEBAI_BASE_URL=https://api.keebai.com/v1  # optional, default
```

## Format

Each skill follows the open Agent Skills layout:

```
skill-name/
├── SKILL.md       # entry point (required) — frontmatter + body Markdown
├── package.json   # local script dependencies
├── references/    # detailed docs, lazy-loaded by the agent
├── scripts/       # executable CLI utilities (Node.js)
└── assets/        # JSON examples, templates
```

The `SKILL.md` is what the agent reads on activation. Everything else is opened on demand.

## License

MIT © Keebai
