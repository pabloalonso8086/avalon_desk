-- Local folder where the repository is cloned. Local disk paths belong to
-- repos (a project can have several), never to projects, epics, macros or tasks.
-- Nullable: a repo can be registered before it is cloned locally.
ALTER TABLE repos ADD COLUMN path TEXT;

-- Repository of the epic, like macros.repo_id. The epic terminal opens in its path.
ALTER TABLE epics ADD COLUMN repo_id INTEGER REFERENCES repos (id) ON DELETE SET NULL;
