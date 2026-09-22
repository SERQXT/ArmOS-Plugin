---
name: ai-chat-query
tier: 1
bucket: dataset-work
description: "Query Domo AI Chat programmatically to ask natural language questions against instance data and test AI Chat responses. Trigger with 'ask Domo AI', 'query Domo AI Chat', 'test AI Chat', 'send a question to AI Chat', 'discover AI Chat endpoints', 'start an AI Chat conversation', or any request to interact with Domo's built-in AI Chat feature."
maturity: alpha
---

# AI Chat Query — Domo AI Chat Integration

Interact with Domo AI Chat programmatically to ask natural language questions against instance datasets and test AI Chat behavior. Use this skill when the task requires querying instance data via natural language, testing AI Chat responses, or automating AI Chat interactions.

## Scope

- Discover AI Chat endpoints available in the instance
- Start conversations and send queries
- Test AI Chat responses against known datasets

Use the `domo-ai-chat` toolkit.

> **Not a substitute for direct queries**: Use Domo AI Chat when the user specifically wants to test or use the instance's AI layer. For direct SQL queries against datasets, use the `domo-datasets` toolkit.

## MCP Tools

### Domo AI Chat (`domo-ai-chat`)

| Tool | Purpose |
|------|---------|
| `ai_chat_discover_endpoint` | Discover the AI Chat endpoint configured for the instance |
| `ai_chat_new_conversation` | Start a new AI Chat conversation |
| `ai_chat_query` | Send a question to an AI Chat conversation |
| `health_check` | Verify the AI Chat service is reachable |

## Workflow: Query Instance Data via AI Chat

1. **Discover endpoint** — call `ai_chat_discover_endpoint` to find the AI Chat URL for this instance
2. **Start conversation** — call `ai_chat_new_conversation` to create a conversation session
3. **Send query** — call `ai_chat_query` with the conversation ID and question text
4. **Surface response** — present the AI Chat response to the user; include the raw response for transparency
5. **Continue conversation** — use the same conversation ID for follow-up questions in the same context

## Workflow: Test AI Chat Behavior

1. Discover endpoint and start a conversation (steps 1-2 above)
2. For each test question: call `ai_chat_query` and record the response
3. Compare responses against expected answers or known dataset values
4. Report pass/fail and any unexpected responses to the user

## Guardrails

- AI Chat responses reflect the instance's connected datasets and AI configuration — results vary by instance
- Do not treat AI Chat responses as ground truth for data values; verify important figures with `domo-datasets` toolkit direct queries
- AI Chat conversations may be logged by the instance — do not send sensitive data as query text

## Related Skills

- `domo-datasets` toolkit — direct SQL queries for verified data values
- `domo-search` toolkit — keyword-based discovery when AI Chat is unavailable
