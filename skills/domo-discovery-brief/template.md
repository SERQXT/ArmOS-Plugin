# Discovery Brief — {{ client.name }}{% if client.short_name %} ({{ client.short_name }}){% endif %}

**Brief date:** {{ meta.brief_date_display|default(meta.brief_date) }}{% if meta.brief_version %} · **Version:** {{ meta.brief_version }}{% endif %}{% if meta.confidentiality %} · **Confidentiality:** {{ meta.confidentiality }}{% endif %}
{% if meta.author %}**Author:** {{ meta.author }}
{% endif %}
---

## Discovery Context

{% if discovery.date %}**Discovery date:** {{ discovery.date_display|default(discovery.date) }}
{% endif %}
{% if discovery.attendees %}**Attendees:**

{% for a in discovery.attendees -%}
- {{ a.name }}{% if a.title %}, {{ a.title }}{% endif %} ({{ a.side|capitalize }})
{% endfor %}
{% endif %}
**Source material:**

{% for s in discovery.sources -%}
- {{ s.label }} ({{ s.type|replace('_', ' ') }})
{% endfor %}

---

## Client Snapshot

**{{ client.name }}**{% if client.industry %} — {{ client.industry }}{% endif %}{% if client.size_signal %} · {{ client.size_signal }}{% endif %}

{% if client.strategic_posture %}**Strategic posture:** {{ client.strategic_posture }}

{% endif %}
{% if client.prior_relationship %}**Prior Domo relationship:** {{ client.prior_relationship }}

{% endif %}
{% if strategic_context %}### Strategic context

{{ strategic_context }}

{% endif %}
---

## Stakeholder Map

| Name | Title | Authority | Disposition | Key concerns |
|------|-------|-----------|-------------|--------------|
{% for s in stakeholders -%}
| {{ s.name }} | {{ s.title }} | {{ s.decision_authority|default('unknown')|capitalize }} | {{ s.disposition|default('unknown')|capitalize }} | {{ s.key_concerns|default('—') }} |
{% endfor %}

---

## Current State

{% if current_state.tech_stack %}### Tech stack today

{% for t in current_state.tech_stack -%}
- **{{ t.name }}**{% if t.purpose %} — {{ t.purpose }}{% endif %}{% if t.status and t.status != 'active' %} *({{ t.status }})*{% endif %}
{% endfor %}

{% endif %}
{% if current_state.data_flow %}### Data flow today

{{ current_state.data_flow }}

{% endif %}
### Pain points

{% for p in current_state.pain_points %}
**{{ loop.index }}. {{ p.description }}**

> {{ p.evidence }}

{% if p.implied_impact %}*Implied impact:* {{ p.implied_impact }}

{% endif %}
{% endfor %}
{% if current_state.what_works %}### What's working (do not replace)

{% for w in current_state.what_works -%}
- {{ w }}
{% endfor %}

{% endif %}
---

## Target Outcomes

### Business outcomes

{% for o in target_outcomes.business_outcomes -%}
- {{ o }}
{% endfor %}

{% if target_outcomes.success_criteria %}### Success criteria

{% for c in target_outcomes.success_criteria -%}
- {{ c }}
{% endfor %}

{% endif %}
{% if target_outcomes.strategic_implications %}### Strategic implications

{{ target_outcomes.strategic_implications }}

{% endif %}
{% if hidden_value %}---

## Hidden Value & Secondary Use Cases

The client did not explicitly ask for these, but they become possible once the explicit ask is delivered:

{% for h in hidden_value %}
**{{ h.name }}** — {{ h.description }}{% if h.marginal_cost %} · *{{ h.marginal_cost }}*{% endif %}

{% endfor %}
{% endif %}
{% if proposed_solution_shape %}---

## Proposed Solution Shape *(DRAFT — to be refined in the proposal)*

{% for sol in proposed_solution_shape %}
### Solution {{ loop.index }}: {{ sol.title }}

{% if sol.weeks_label %}*{{ sol.weeks_label }}*{% endif %} · **{{ sol.rough_hours.low }}–{{ sol.rough_hours.high }} hours**

**Rationale:** {{ sol.rationale }}

{% if sol.key_deliverables %}Key deliverables:

{% for d in sol.key_deliverables -%}
- {{ d }}
{% endfor %}

{% endif %}
{% endfor %}
{% endif %}
{% if out_of_scope_initial %}---

## Out of Scope (Initial)

{% for o in out_of_scope_initial -%}
- {{ o }}
{% endfor %}

{% endif %}
{% if risks_and_dependencies %}---

## Risks & Dependencies

{% for r in risks_and_dependencies -%}
- **{{ r.type|default('risk')|capitalize }}{% if r.severity %} ({{ r.severity }}){% endif %}:** {{ r.description }}
{% endfor %}

{% endif %}
{% if commercial_signals %}---

## Commercial Signals

{% if commercial_signals.timing_pressure %}**Timing pressure:** {{ commercial_signals.timing_pressure }}

{% endif %}
{% if commercial_signals.budget_signals %}**Budget signals:** {{ commercial_signals.budget_signals }}

{% endif %}
{% if commercial_signals.rate_context %}**Rate context:** {{ commercial_signals.rate_context }}

{% endif %}
{% if commercial_signals.competing_solutions %}**Competing solutions:**

{% for c in commercial_signals.competing_solutions -%}
- **{{ c.name }}** — {{ c.status|replace('_', ' ')|capitalize }}{% if c.notes %} · {{ c.notes }}{% endif %}
{% endfor %}

{% endif %}
{% endif %}
{% if external_guidance %}---

## External Guidance *(internal — not from the discovery itself)*

Pricing, delivery, and timeline guidance the brief author brought in from outside the source material — Salesforce, prior calls, account-team tribal knowledge. Treat as high-trust internal context for sizing decisions; do not quote verbatim to the customer.

{% if external_guidance.account_economics %}### Account economics

{% if external_guidance.account_economics.acv %}- **ACV:** {{ external_guidance.account_economics.acv }}
{% endif %}
{%- if external_guidance.account_economics.tcv %}- **TCV:** {{ external_guidance.account_economics.tcv }}
{% endif %}
{%- if external_guidance.account_economics.contract_term %}- **Contract term:** {{ external_guidance.account_economics.contract_term }}
{% endif %}
{%- if external_guidance.account_economics.renewal_window %}- **Renewal window:** {{ external_guidance.account_economics.renewal_window }}
{% endif %}
{%- if external_guidance.account_economics.license_footprint %}- **License footprint:** {{ external_guidance.account_economics.license_footprint }}
{% endif %}
{%- if external_guidance.account_economics.expansion_potential %}- **Expansion potential:** {{ external_guidance.account_economics.expansion_potential }}
{% endif %}

{% endif %}
{% if external_guidance.pricing_guidance %}### Pricing guidance

{% if external_guidance.pricing_guidance.rate_posture %}- **Rate posture:** {{ external_guidance.pricing_guidance.rate_posture }}
{% endif %}
{%- if external_guidance.pricing_guidance.discount_authority %}- **Discount authority:** {{ external_guidance.pricing_guidance.discount_authority }}
{% endif %}
{%- if external_guidance.pricing_guidance.package_preference %}- **Package preference:** {{ external_guidance.pricing_guidance.package_preference }}
{% endif %}
{%- if external_guidance.pricing_guidance.competitive_pressure %}- **Competitive pressure:** {{ external_guidance.pricing_guidance.competitive_pressure }}
{% endif %}
{%- if external_guidance.pricing_guidance.target_total_investment %}- **Target Total Investment:** {{ external_guidance.pricing_guidance.target_total_investment }}
{% endif %}
{%- if external_guidance.pricing_guidance.notes %}- **Notes:** {{ external_guidance.pricing_guidance.notes }}
{% endif %}

{% endif %}
{% if external_guidance.delivery_guidance %}### Delivery guidance

{% if external_guidance.delivery_guidance.preferred_model %}- **Preferred model:** {{ external_guidance.delivery_guidance.preferred_model }}
{% endif %}
{%- if external_guidance.delivery_guidance.team_composition %}- **Team composition:** {{ external_guidance.delivery_guidance.team_composition }}
{% endif %}
{%- if external_guidance.delivery_guidance.phasing_preference %}- **Phasing preference:** {{ external_guidance.delivery_guidance.phasing_preference }}
{% endif %}
{%- if external_guidance.delivery_guidance.customer_capacity %}- **Customer capacity:** {{ external_guidance.delivery_guidance.customer_capacity }}
{% endif %}
{%- if external_guidance.delivery_guidance.notes %}- **Notes:** {{ external_guidance.delivery_guidance.notes }}
{% endif %}

{% endif %}
{% if external_guidance.timeline_guidance %}### Timeline guidance

{% if external_guidance.timeline_guidance.target_start %}- **Target start:** {{ external_guidance.timeline_guidance.target_start }}
{% endif %}
{%- if external_guidance.timeline_guidance.must_finish_by %}- **Must finish by:** {{ external_guidance.timeline_guidance.must_finish_by }}
{% endif %}
{%- if external_guidance.timeline_guidance.blackout_periods %}- **Blackout periods:** {{ external_guidance.timeline_guidance.blackout_periods }}
{% endif %}
{%- if external_guidance.timeline_guidance.sequencing_constraints %}- **Sequencing constraints:** {{ external_guidance.timeline_guidance.sequencing_constraints }}
{% endif %}
{%- if external_guidance.timeline_guidance.notes %}- **Notes:** {{ external_guidance.timeline_guidance.notes }}
{% endif %}

{% endif %}
{% if external_guidance.anecdotal_context %}### Anecdotal context

{{ external_guidance.anecdotal_context }}

{% endif %}
{% endif %}
{% if stakeholder_dynamics %}---

## Stakeholder Dynamics

{% if stakeholder_dynamics.decision_criteria %}**Decision criteria mentioned:**

{% for d in stakeholder_dynamics.decision_criteria -%}
- {{ d }}
{% endfor %}

{% endif %}
{% if stakeholder_dynamics.concerns_raised %}**Concerns and objections raised:**

{% for c in stakeholder_dynamics.concerns_raised -%}
- {{ c }}
{% endfor %}

{% endif %}
{% if stakeholder_dynamics.internal_dynamics %}**Internal dynamics:** {{ stakeholder_dynamics.internal_dynamics }}

{% endif %}
{% endif %}
{% if key_quotes %}---

## Key Quotes

{% for q in key_quotes %}
> {{ q.quote }}

— **{{ q.speaker }}**{% if q.title %}, {{ q.title }}{% endif %}{% if q.context %} *({{ q.context }})*{% endif %}

{% endfor %}
{% endif %}
---

## Open Questions

{% if open_questions %}The following could not be determined from the source material and need to be resolved before (or during) proposal drafting:

{% for q in open_questions -%}
- **{{ q.category|default('other')|replace('_', ' ')|capitalize }}{% if q.blocking %} (blocking){% endif %}:** {{ q.question }}
{% endfor %}
{% else %}*No open questions — the source material was complete.* (Sanity-check: empty Open Questions sections almost always indicate the brief invented context. Re-read the source.)
{% endif %}

{% if brief_author_notes %}---

## Brief Author Notes

{{ brief_author_notes }}

{% endif %}
---

*Generated by `domo-discovery-brief` v{{ meta.schema_version }}. Once reviewed and approved, this brief feeds directly into `domo-interactive-proposal-builder` as starting context — invoke the proposal builder with this JSON file in hand.*
