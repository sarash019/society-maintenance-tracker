# System Design Write-Up

**Society Maintenance Tracker** — covering complaint history model, overdue detection, photo handling, and notification flow.

---

## 1. Complaint History Model

The core design principle is **append-only audit trail**. Every status transition is stored as an immutable row in a dedicated `complaint_history` table rather than overwriting fields on the `complaints` table. This means:

- `complaints` holds the **current state**: category, description, photo, current status, current priority, and overdue flag.
- `complaint_history` records **every change**: who made it (`actor_id`, `actor_role`), what changed (`old_status` → `new_status`), when (`changed_at` timestamp), and an optional admin note.

This separation keeps query performance high for listing complaints (single-table scan) while keeping full traceability available on demand through a join. When a resident views their complaint, the history rows are fetched and presented as a chronological timeline — making the lifecycle visible: `Open → In Progress (plumber scheduled) → Resolved (fixed on 5th)`.

The lifecycle is enforced as a PostgreSQL CHECK constraint: `status IN ('Open', 'In Progress', 'Resolved')`. Once a complaint reaches `Resolved` it is effectively closed — the frontend hides the update form and the API does not prevent re-opening (an admin could technically revert), but the UI workflow treats Resolved as terminal.

An initial history record is inserted at the time of complaint creation with `old_status = NULL` and `new_status = 'Open'`, so the history is complete from day one and never has a gap.

---

## 2. Overdue Detection

Overdue detection runs in two modes that complement each other:

**Automatic (threshold-based):** Every time the admin fetches the complaints list, a `detectOverdue()` helper runs a single bulk UPDATE on PostgreSQL:

```sql
UPDATE complaints
SET is_overdue = TRUE
WHERE status != 'Resolved'
  AND created_at < NOW() - INTERVAL '{N} days'
  AND is_overdue = FALSE;
```

`N` is read from the `settings` table (key = `overdue_days`, default = 7). The admin can change this threshold from the dashboard without a deployment. Running detection on each admin fetch — rather than via a cron job — keeps the architecture simple (no scheduler dependency) while still being accurate: the admin sees fresh data every time they open the list.

**Manual flagging:** The admin can also mark any open complaint as overdue with a one-click button. This is useful for complaints that are technically within the time window but have already been escalated or promised resolution.

Overdue complaints are surfaced at the top of the admin list via `ORDER BY is_overdue DESC`. The frontend highlights overdue rows with a red border and an "⚠ Overdue" badge so they are immediately visible without any filtering.

---

## 3. Photo Handling

Photo upload uses **Multer** with disk storage on the server. Design decisions:

- **Storage location:** `backend/uploads/` directory, served as a static route (`/uploads/:filename`). This keeps the setup dependency-free (no S3 key required) while remaining easy to swap: replacing Multer's `diskStorage` with `multer-s3` would be a single config-file change.
- **File naming:** Each uploaded file gets a timestamp + random suffix to prevent collisions (`1700000000000-123456789.jpg`). Original filenames are discarded to avoid path-traversal risks.
- **Validation:** Multer's `fileFilter` accepts only image MIME types (jpeg, jpg, png, gif, webp). A 5 MB size limit is enforced at the middleware layer before the file hits the controller.
- **Storage in DB:** Only the relative path (`/uploads/filename.ext`) is stored in `complaints.photo_url`. The frontend constructs the full URL by prepending the API base URL, keeping the DB record portable if the host changes.

For production, the natural upgrade path is to replace disk storage with an object store (S3, Cloudflare R2) and store the CDN URL instead of the relative path.

---

## 4. Notification Flow

Email is handled by **Nodemailer** with a reusable transporter configured via environment variables (service, user, app password). Two notification types are supported:

**Status change emails:** When an admin updates a complaint's status, the backend immediately looks up the resident's email from the `users` table and sends a templated HTML email containing the new status, category, complaint ID, and optional admin note. The email is sent inside the same request-response cycle (not queued), which is acceptable for this scale. If the send fails, the error is logged but does not fail the API response — the status update is committed regardless.

**Important notice emails:** When an admin posts a notice with `is_important = true`, the backend queries all users with `role = 'resident'` and sends each one a notice email. Emails are sent sequentially in a for-loop using `async/await`. For production scale, this would be replaced with a background queue (e.g., BullMQ + Redis) to avoid blocking the HTTP response when there are many residents.

Both email templates are branded HTML with inline styles, ensuring they render correctly across mail clients. The transporter is created once at module load time and reused for all sends, avoiding repeated connection overhead.

---

## Summary

The design prioritises **correctness and traceability** (append-only history), **operational simplicity** (no cron jobs, no external queues for MVP), and **clear upgrade paths** (swap disk → S3, sequential email → queue). Each component is isolated — history recording, overdue detection, photo storage, and email sending are each in a single function — making the codebase easy to test and extend.
