-- Initial schema. Dates are stored as INTEGER (Unix timestamp, seconds).

CREATE TABLE statuses (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL UNIQUE,
    description TEXT    NOT NULL DEFAULT '',
    priority    INTEGER NOT NULL
);

CREATE TABLE repos (
    id  INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT    NOT NULL UNIQUE
);

-- Hierarchy: projects > epics > macros > tasks.
-- `slug` is the public id: unique per table; collisions get a "_N" suffix.

CREATE TABLE projects (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL,
    slug       TEXT    NOT NULL UNIQUE,
    status_id  INTEGER NOT NULL REFERENCES statuses (id),
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    closed_at  INTEGER,
    deadline   INTEGER
);

-- An epic always belongs to a project.
CREATE TABLE epics (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL,
    slug       TEXT    NOT NULL UNIQUE,
    status_id  INTEGER NOT NULL REFERENCES statuses (id),
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    closed_at  INTEGER,
    deadline   INTEGER,
    project_id INTEGER NOT NULL REFERENCES projects (id) ON DELETE CASCADE
);

-- A macro belongs either to an epic or directly to a project (exactly one of them).
CREATE TABLE macros (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL,
    slug       TEXT    NOT NULL UNIQUE,
    status_id  INTEGER NOT NULL REFERENCES statuses (id),
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    closed_at  INTEGER,
    deadline   INTEGER,
    project_id INTEGER REFERENCES projects (id) ON DELETE CASCADE,
    epic_id    INTEGER REFERENCES epics (id) ON DELETE CASCADE,
    branch     TEXT,
    issue      TEXT,
    repo_id    INTEGER REFERENCES repos (id) ON DELETE SET NULL,
    CHECK ((project_id IS NULL) <> (epic_id IS NULL))
);

-- A task always belongs to a macro.
CREATE TABLE tasks (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL,
    slug       TEXT    NOT NULL UNIQUE,
    status_id  INTEGER NOT NULL REFERENCES statuses (id),
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    closed_at  INTEGER,
    deadline   INTEGER,
    macro_id   INTEGER NOT NULL REFERENCES macros (id) ON DELETE CASCADE
);

-- Repositories allowed for each project.
CREATE TABLE project_repos (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
    repo_id    INTEGER NOT NULL REFERENCES repos (id) ON DELETE CASCADE,
    UNIQUE (project_id, repo_id)
);

CREATE TABLE labels (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    name  TEXT    NOT NULL,
    color TEXT    NOT NULL
);

-- Polymorphic link between labels and any item type.
CREATE TABLE items_labels (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    label_id  INTEGER NOT NULL REFERENCES labels (id) ON DELETE CASCADE,
    item_id   INTEGER NOT NULL,
    item_type TEXT    NOT NULL CHECK (item_type IN ('project', 'epic', 'macro', 'task')),
    UNIQUE (label_id, item_id, item_type)
);

CREATE INDEX idx_epics_project_id  ON epics (project_id);
CREATE INDEX idx_macros_project_id ON macros (project_id);
CREATE INDEX idx_macros_epic_id    ON macros (epic_id);
CREATE INDEX idx_tasks_macro_id    ON tasks (macro_id);
CREATE INDEX idx_items_labels_item ON items_labels (item_type, item_id);

INSERT INTO statuses (name, description, priority) VALUES
    ('Canceled',         'The started work or the proposal has been canceled and will not be developed, at least not with the current requirements.', 0),
    ('Done',             'The work has been deployed, delivered and validated. The task is closed as finished.', 10),
    ('Testing',          'The changes have been deployed and delivered to the requester. Pending confirmation that the work does what was requested.', 12),
    ('Deploy Requested', 'The work is done. The PR has been requested and is pending the approver.', 15),
    ('Triage',           'It is a request. Work has not started yet, nor has it been validated that it will start.', 70),
    ('Backlog',          'The work will be done, but requirements still need to be gathered, hours estimated or a delivery date proposed.', 79),
    ('Paused',           'Development is paused by decision.', 80),
    ('Blocked',          'Another development or a third-party response prevents progress on the ongoing development.', 89),
    ('In Progress',      'The work is being done.', 99);
