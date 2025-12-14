# eConference

## Brand Overview

A **unified platform** for academic conference management, designed to streamline the complex workflow of organizing events, submitting research, and facilitating peer reviews. The platform bridges the gap between organizers, authors, and reviewers with a seamless, professional interface.

---

## Brand Identity

### Positioning

A comprehensive academic tool prioritizing efficiency, clarity, and collaboration. Built for educational institutions and research organizations requiring a robust submission and review system.

### Tagline

> _"Streamlining Research. Connecting Minds."_

### Tone of Voice

- **Professional** — Academic and authoritative
- **Efficient** — No-nonsense, workflow-oriented
- **Collaborative** — fostering interaction between roles
- **Clean** — Minimalist interface for focused tasks

---

## Visual Identity

### Color Palette

| Color          | Hex/Likely            | Usage                                        |
| :------------- | :-------------------- | :------------------------------------------- |
| **Primary**    | `oklch(0.43 0.04 42)` | Core brand actions, key buttons (Warm Dark)  |
| **Secondary**  | `oklch(0.92 0.07 74)` | Supportive elements, highlights (Warm Light) |
| **Background** | `oklch(0.98 0 0)`     | Clean canvas for readability                 |
| **Foreground** | `oklch(0.24 0 0)`     | High-contrast text                           |

### Typography

- **Headings**: Geist Sans — Modern, geographic sans-serif
- **Code/Data**: Geist Mono — Precision plotting for data

### Visual Effects

- **Clean Cards** — Distinct containment for papers and reviews
- **Subtle Shadows** — Hierarchy through depth
- **Responsive Layouts** — Adaptive for all devices

---

## Capabilities

### Conference Management

Tools for organizers to create and oversee events:

- **Event Creation** — Set dates, locations, and descriptions
- **Role Management** — Assign reviewers and track participation

### Paper Submission

Streamlined workflow for authors:

- **File Uploads** — Secure PDF handling via Vercel Blob
- **Status Tracking** — Real-time updates (Submitted, Under Review, Accepted)

### Peer Review

Dedicated interface for academic evaluation:

- **Assignment System** — Link papers to qualified reviewers
- **Feedback Loop** — Structured approval/rejection and comments

---

## Tech Stack

| Layer             | Technology                     |
| :---------------- | :----------------------------- |
| **Framework**     | Next.js 16 (App Router)        |
| **Language**      | TypeScript                     |
| **Styling**       | Tailwind CSS 4                 |
| **Database**      | PostgreSQL + Prisma ORM        |
| **Auth**          | NextAuth (Beta) + Custom Roles |
| **UI Components** | Shadcn UI (Radix Primitives)   |
| **Icons**         | Lucide React                   |
| **Animation**     | Motion (Framer Motion)         |
| **Forms**         | React Hook Form + Zod          |
| **File Storage**  | Vercel Blob                    |

---

## Key Features

- ✅ **Role-Based Access Control** (Organizer, Author, Reviewer)
- ✅ **Dynamic Dashboard** — Tailored views per user role
- ✅ **Secure Authentication** — Credential-based login
- ✅ **Server Actions** — Efficient data mutations
- ✅ **Dark Mode Support** — System-aware theming
- ✅ **Responsive Design** — Mobile-first approach

---

## File Structure

```
src/
├── app/
│   ├── (auth)/            → Login & Registration
│   ├── (marketing)/       → Landing pages
│   ├── api/               → Backend API routes
│   └── dashboard/         → App interface (Protected)
│
├── components/
│   ├── providers/         → Context providers (Session, Theme)
│   ├── theme/             → Theme switcher logic
│   └── ui/                → Reusable design tokens
│
├── lib/
│   ├── db.ts              → Prisma client instance
│   └── utils.ts           → Helper functions
│
├── prisma/
│   └── schema.prisma      → Database model definition
│   └── seed.ts            → Initial data population
```

---

© 2025 eConference. Built with academic precision.
