# Capacity Pulse — Data Dictionary

## SPP Time Tracking Fields

### Time Buckets (SUM across rows per consultant per week)
| Field | Description | Revenue Impact |
|-------|-------------|----------------|
| `funded_billable_hrs` | Paid consulting — customer purchased hours | Direct NRR |
| `adoption_billable_hrs` | Adoption consulting — ACE and adoption services | Retention driver |
| `investment_billable_hrs` | $0 Oppty / strategic investment hours | Relationship building |
| `strategic_hrs` | Internal strategic initiatives | Internal |
| `admin_hrs` | Administrative overhead | Overhead |
| `total_logged_hrs` | Sum of all above | Total productivity |

### Target Fields (DO NOT SUM — one value per consultant)
| Field | Description |
|-------|-------------|
| `target_wkly_funded_billable_hrs` | Weekly funded billable target |
| `target_wkly_adoption_billable_hrs` | Weekly adoption billable target |
| `target_wkly_investment_billable_hrs` | Weekly investment billable target |
| `target_wkly_strategic_hrs` | Weekly strategic hours target |
| `target_wkly_admin_hrs` | Weekly admin hours target |

### Capacity & Project Fields
| Field | Description | Notes |
|-------|-------------|-------|
| `work_capacity` | Available hours for the week | Adjusted for PTO/holidays. DO NOT SUM across rows. |
| `project_hours_purchased` | Total hours purchased for the project | Use for forward projection |
| `project_hours_remaining` | Hours left on the project | Key for predicting when consultant frees up |
| `billable_hrs_consumed` | Billable hours consumed on project | Cumulative |

### Identity Fields
| Field | Description |
|-------|-------------|
| `user` | Consultant name (lowercase) |
| `role` | TC (Technical Consultant), BC (Business Consultant), EM (Engagement Manager), PM (Project Manager) |
| `vertical_team` | Team: West/Corp, East/Midwest, India, EMEA, APAC, Japan, Consulting PMO |
| `adoption_segment` | PAID, $0 Oppty, adopt. segment |
| `metric_date` | Week start date (YYYY-MM-DD, typically Sunday) |

## Asana Assignment Board Fields

**Project GID**: Retrieved from memory — call `memory_recall("Asana assignment board GID")` before querying. If not found in memory, ask the user: "What is the Asana project GID for the assignment board?" and save it with `memory_remember`. Do not hardcode a GID — it changes between customers and board restructures.

### Pipeline Sections (in order)
1. **Project Identified** — Scoping phase
2. **SOW/SO Signed** — Committed, needs staffing
3. **Internal Handoff** — Ready for delivery team
4. **Customer Kickoff** — Should be fully staffed
5. **Completed** — Done

### Key Custom Fields
| Field | Description |
|-------|-------------|
| `Tier` | Tier 1 (large/complex), Tier 2 (medium), Tier 3 (small/kickstarter) |
| `BC` | Assigned Business Consultant(s) |
| `TC` | Assigned Technical Consultant(s) |
| `SME/Squad Captain` | Specialist / squad lead |
| `CS Owner` | Customer Success owner |
| `Business` | Enterprise or Corporate segment |
| `Pending Action` | Current blocker or next step |
| `Expiration date` | Service hours expiration |
| `Education Package` | Education component if any |

### Reading Hours from Task Names
Task names on the assignment board typically follow this pattern:
`{Account Name} - {Engagement Type}: {Month/Year} - {Hours} hours`

Example: `Marriott International - Custom Consulting (Per Hour): 2/26 - 110 hours`

Parse the hours value from the task name for demand-side capacity math.

## Role Definitions
| Role | Code | Primary Focus |
|------|------|---------------|
| Technical Consultant | TC | Hands-on build — data pipelines, cards, apps, integrations |
| Business Consultant | BC | Solution design, stakeholder management, business outcomes |
| Engagement Manager | EM | Project oversight, client relationship, delivery quality |
| Project Manager | PM | Timeline, resource coordination, risk management |

## Team Structure
| Team | Region | Notes |
|------|--------|-------|
| West/Corp | US West + Corporate | Largest domestic team |
| East/Midwest | US East + Midwest | Second largest domestic |
| India | India | Offshore delivery |
| EMEA | Europe/Middle East/Africa | International |
| APAC | Asia-Pacific | International |
| Japan | Japan | International |
| Consulting PMO | Cross-regional | EMs and PMs |
