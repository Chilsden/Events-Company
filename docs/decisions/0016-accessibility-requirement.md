# 0016 Accessibility requirement

- Status: accepted (requirement); proposed (target level and per-product criteria)
- Date: 2026-10-30
- Decided by: requirement from Phil (2026-10-30); target level pending Phil's confirmation

## Context

Independent review finding F-09: accessibility was not covered in any document. Guest-facing pages, operator consoles and large displays all need it, and it is cheaper to build in than to retrofit. Whether any law applies is a question for a qualified adviser.

## Decision

- **Accepted:** guest-facing and operator-facing interfaces in all five products are built to be accessible, with testable acceptance criteria.
- **Proposed target:** WCAG 2.2 Level AA as the engineering target, plus the product-specific criteria in master spec 5.11. Meeting the target is an engineering goal and does not establish legal compliance.

## Not decided

- Confirmation of the target level after advice.
- Whether signature capture offers an alternative to drawing (for example a typed name), and what that is worth legally.

## Consequences

- New backlog items A-07 (baseline), F-11, G-09, H-10, I-09, J-11 (per-product criteria) and O-08 (assistive-technology check before beta).
- Spec 11.1 gains accessibility launch criteria. Shortcut designs keep non-keyboard alternatives (decision 0004).

## Evidence / sources

Independent review F-09; master spec 5.11 and 11.1. WCAG success criteria cited in the spec should be checked against the current published standard when work starts.
