**Database Schema Summary — gamified_app**

- Source: `sql/gamified_app.sql`
- Key tables: `users`, `tasks`, `habits`, `xp_transactions`, `level_requirements`, `habit_completions`, `categories`.

**Tables (short)**
- `users` (PK `user_id`)
  - `username`, `email`, `password_hash`, `total_xp`, `current_level`, `global_streak`.

- `tasks` (PK `task_id`)
  - `user_id` (FK -> `users.user_id`), `category_id` (nullable FK -> `categories.category_id`),
  - `title`, `description`, `difficulty` (enum `easy,medium,hard,extreme`),
  - `deadline` (datetime nullable), `status` (enum `pending,in_progress,completed,skipped,failed`), `xp_earned`.

- `habits` (PK `habit_id`)
  - `user_id` (FK), `title`, `difficulty` (enum like `tasks`), `recurrence_pattern` (JSON-ish string), `current_streak`, `best_streak`, `is_active`.

- `habit_completions` — per-day completion records (unique on `habit_id, completion_date`).

- `xp_transactions` — records XP grants (columns: `user_id`, `source_type` enum, `source_id`, `xp_amount`, `description`).

- `level_requirements` (PK `level`) — lookup: `level`, `xp_required`.

**Enums (examples)**
- `tasks.difficulty`, `habits.difficulty`: `easy, medium, hard, extreme`.
- `tasks.status`: `pending, in_progress, completed, skipped, failed`.
- `xp_transactions.source_type`: `task, habit, combo, streak_bonus, other`.

**Sample rows (from dump)**
- `users`: (1, "Jerome", ... total_xp=105, current_level=2)
- `tasks`: two tasks for user 1 (completed, xp 25/50)
- `habits`: one habit for user 1 ("Drinking Coffee")
- `xp_transactions`: several entries linking tasks/habits to XP earned

**Important relationships**
- `users.user_id` → many tables (ON DELETE CASCADE): `tasks`, `habits`, `xp_transactions`, `categories`, etc.
- `tasks.task_id` → `deadline_changes`, `task_dependencies`, `task_criteria_scores`, and related tables.
- `habits.habit_id` → `habit_completions`.
- `categories.category_id` → `tasks.category_id`, `habits.category_id` (ON DELETE SET NULL).

**API mapping (quick)**
- `api/auth.php` — reads/writes `users` (register/login). Sets `user_id` on success.
- `api/tasks.php` — `list`, `create`, `complete` operate on `tasks`, `xp_transactions`, `users`, `level_requirements`.
- `api/habits.php` — `list`, `create`, `complete` operate on `habits`, `habit_completions`, `xp_transactions`, `users`.
- `api/dashboard.php` — reads `users`, aggregates `tasks`, `habits`, `xp_transactions`, and looks up `level_requirements`.

**Potential issues to watch (observed)**
- Prepared statements bind nullable fields (datetime, category_id) using concrete types; ensure `NULL` is handled correctly (mysqli binds empty string/0 otherwise).
- Several code paths assume queried rows exist; add existence checks before accessing fields.
- Enum values should be validated server-side before DB write.
- Many `prepare()` calls lack null/false checks; if prepare fails, code may emit non-JSON output — break client JSON parsing.

---
Path: `docs/DB_SCHEMA.md` (created). If you want, I can now:
- (A) Expand this doc with a full table-by-table column list and FK details, or
- (B) Patch API files to add prepare/NULL checks and enum validation.

Which would you like next?