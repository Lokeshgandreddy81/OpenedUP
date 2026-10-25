# Architecture Decision Records (ADRs)

This directory contains records of significant architectural and design decisions made for the **Charan Interiors** repository and applications.

## What is an ADR?

An Architecture Decision Record (ADR) captures a single architectural decision along with its context, considered alternatives, and consequences (both positive and negative). ADRs help maintainers, new team members, and autonomous agents understand the rationale behind architectural choices over time.

## Index of Decisions

| ID                                     | Title                                                                        | Status   | Date       |
| :------------------------------------- | :--------------------------------------------------------------------------- | :------- | :--------- |
| [0000](0000-adr-template.md)           | ADR Template & Process Guide                                                 | Accepted | 2026-10-22 |
| [0001](0001-frontend-backend-split.md) | Decouple Monolithic Server into Distinct Frontend Client and Backend Service | Accepted | 2026-10-22 |

## Status Lifecycle

- **Proposed**: Under review; feedback is actively being gathered.
- **Accepted**: Decision agreed upon and currently in effect.
- **Rejected**: Proposal was evaluated and declined.
- **Deprecated**: Decision is no longer relevant or active.
- **Superseded**: Replaced by a newer decision (links to the superseding ADR).

## Creating a New ADR

1. Copy [`0000-adr-template.md`](0000-adr-template.md) to a new file named `NNNN-short-descriptive-title.md`, where `NNNN` is the next sequential 4-digit number.
2. Fill out all sections: Context, Decision Drivers, Considered Options, Decision Outcome, and Consequences.
3. Submit a pull request for team review.
4. Update the Index table above once merged.
