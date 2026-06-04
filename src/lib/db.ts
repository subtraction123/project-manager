import Database from '@tauri-apps/plugin-sql'

let db: Database | null = null

async function getDB(): Promise<Database> {
  if (!db) throw new Error('Database not initialized. Call init() first.')
  return db
}

async function createTables(database: Database) {
  await database.execute(`
    CREATE TABLE IF NOT EXISTS daily_items (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      category TEXT DEFAULT '工作跟进',
      record_date TEXT NOT NULL,
      is_converted INTEGER DEFAULT 0,
      is_completed INTEGER DEFAULT 0,
      converted_to_type TEXT,
      converted_to_id TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      estimated_end_date TEXT NOT NULL,
      development_cycle TEXT NOT NULL DEFAULT '',
      start_date TEXT,
      phase TEXT DEFAULT '需求调研',
      parent_id TEXT,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      status TEXT DEFAULT 'pending',
      priority TEXT DEFAULT 'medium',
      assignee TEXT DEFAULT '',
      due_date TEXT,
      completed_at TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS milestones (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      target_date TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS releases (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      version_name TEXT NOT NULL,
      status TEXT DEFAULT 'draft',
      publisher TEXT DEFAULT '',
      description TEXT DEFAULT '',
      published_at TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS release_contents (
      id TEXT PRIMARY KEY,
      release_id TEXT NOT NULL REFERENCES releases(id) ON DELETE CASCADE,
      task_id TEXT REFERENCES tasks(id) ON DELETE SET NULL,
      content_type TEXT NOT NULL,
      content TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS project_risks (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      strategy TEXT DEFAULT '',
      level TEXT DEFAULT '中等',
      status TEXT DEFAULT '处理中',
      recorded_date TEXT DEFAULT (date('now','localtime')),
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS versions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      status TEXT DEFAULT 'draft',
      publisher TEXT DEFAULT '',
      description TEXT DEFAULT '',
      published_at TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS weekly_reports (
      id TEXT PRIMARY KEY,
      week_start_date TEXT NOT NULL,
      week_end_date TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '{}',
      status TEXT DEFAULT 'draft',
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime')),
      UNIQUE(week_start_date, week_end_date)
    );
  `)
}

async function migrate(database: Database) {
  // Migration 001: make tasks.project_id nullable
  await database.execute(`
    CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY);
  `)
  const done = await database.select<{ cnt: number }[]>(
    "SELECT COUNT(*) as cnt FROM _migrations WHERE name = '001_nullable_task_project_id'"
  )
  if ((done as any)[0]?.cnt === 0) {
    await database.execute(`
      CREATE TABLE IF NOT EXISTS tasks_new (
        id TEXT PRIMARY KEY,
        project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        status TEXT DEFAULT 'pending',
        priority TEXT DEFAULT 'medium',
        assignee TEXT DEFAULT '',
        due_date TEXT,
        completed_at TEXT,
        created_at TEXT DEFAULT (datetime('now','localtime')),
        updated_at TEXT DEFAULT (datetime('now','localtime'))
      );
      INSERT INTO tasks_new SELECT
        id, CASE WHEN project_id = '' THEN NULL ELSE project_id END,
        title, description, status, priority, assignee, due_date, completed_at, created_at, updated_at
      FROM tasks;
      DROP TABLE tasks;
      ALTER TABLE tasks_new RENAME TO tasks;
      INSERT INTO _migrations (name) VALUES ('001_nullable_task_project_id');
    `)
  }
}

export function useDB() {
  async function init(): Promise<void> {
    db = await Database.load('sqlite:project-manager.db')
    await createTables(db)
    await migrate(db)
  }

  async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const database = await getDB()
    return database.select<T[]>(sql, params) as unknown as T[]
  }

  async function run(sql: string, params: any[] = []): Promise<void> {
    const database = await getDB()
    await database.execute(sql, params)
  }

  async function exec(sql: string): Promise<void> {
    const database = await getDB()
    await database.execute(sql)
  }

  function generateId(): string {
    return crypto.randomUUID()
  }

  function now(): string {
    return new Date().toISOString()
  }

  return { init, query, run, exec, generateId, now }
}
