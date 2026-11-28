import fs from "node:fs/promises";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type DatabaseKind = "supabase" | "json";

export interface Database {
  readonly kind: DatabaseKind;
  select<T>(table: string): Promise<T[]>;
  upsert<T extends Record<string, unknown>>(
    table: string,
    rows: T[],
    conflict: string | string[]
  ): Promise<void>;
  deleteWhere(
    table: string,
    column: string,
    values: (string | number)[]
  ): Promise<void>;
}

export function getDataDir(): string {
  return process.env.DATA_DIR
    ? path.resolve(process.env.DATA_DIR)
    : path.join(process.cwd(), ".data");
}

function readSupabaseConfig(): { url: string; serviceKey: string } | null {
  const url = (process.env.SUPABASE_URL ?? "").trim();
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  return url && serviceKey ? { url, serviceKey } : null;
}

export function isCloudDatabaseEnabled(): boolean {
  return readSupabaseConfig() !== null;
}

let cachedClient: SupabaseClient | null = null;

function getSupabaseClient(config: { url: string; serviceKey: string }): SupabaseClient {
  if (!cachedClient) {
    cachedClient = createClient(config.url, config.serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cachedClient;
}

const PAGE_SIZE = 1000;
const UPSERT_BATCH = 200;

class SupabaseDatabase implements Database {
  readonly kind = "supabase" as const;
  private readonly config: { url: string; serviceKey: string };

  constructor(config: { url: string; serviceKey: string }) {
    this.config = config;
  }

  private client(): SupabaseClient {
    return getSupabaseClient(this.config);
  }

  async select<T>(table: string): Promise<T[]> {
    const rows: T[] = [];
    let from = 0;
    for (;;) {
      const { data, error } = await this.client()
        .from(table)
        .select("*")
        .range(from, from + PAGE_SIZE - 1);
      if (error) {
        throw new Error(`Supabase đọc bảng ${table} thất bại: ${error.message}`);
      }
      const page = (data ?? []) as T[];
      rows.push(...page);
      if (page.length < PAGE_SIZE) break;
      from += PAGE_SIZE;
    }
    return rows;
  }

  async upsert<T extends Record<string, unknown>>(
    table: string,
    rows: T[],
    conflict: string | string[]
  ): Promise<void> {
    if (rows.length === 0) return;
    const onConflict = Array.isArray(conflict) ? conflict.join(",") : conflict;
    for (let i = 0; i < rows.length; i += UPSERT_BATCH) {
      const batch = rows.slice(i, i + UPSERT_BATCH);
      const { error } = await this.client()
        .from(table)
        .upsert(batch as unknown as Record<string, unknown>[], { onConflict });
      if (error) {
        throw new Error(`Supabase ghi bảng ${table} thất bại: ${error.message}`);
      }
    }
  }

  async deleteWhere(
    table: string,
    column: string,
    values: (string | number)[]
  ): Promise<void> {
    if (values.length === 0) return;
    const { error } = await this.client().from(table).delete().in(column, values);
    if (error) {
      throw new Error(`Supabase xoá bảng ${table} thất bại: ${error.message}`);
    }
  }
}

const LEGACY_FILES: Record<string, string> = {
  auth_accounts: "auth-accounts.json",
  auth_sessions: "auth-sessions.json",
  student_records: "student-records.json",
};

function fileForTable(table: string): string {
  const fileName = LEGACY_FILES[table] ?? `${table.replace(/_/g, "-")}.json`;
  return path.join(getDataDir(), fileName);
}

type JsonRow = Record<string, unknown>;

const tableQueues = new Map<string, Promise<unknown>>();

function enqueueForTable<T>(table: string, task: () => Promise<T>): Promise<T> {
  const previous = tableQueues.get(table) ?? Promise.resolve();
  const next = previous.then(task, task);
  tableQueues.set(
    table,
    next.then(
      () => undefined,
      () => undefined
    )
  );
  return next;
}

async function readJsonFile(table: string): Promise<JsonRow[]> {
  try {
    const raw = await fs.readFile(fileForTable(table), "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as JsonRow[]) : [];
  } catch {
    return [];
  }
}

async function writeJsonFile(table: string, rows: JsonRow[]): Promise<void> {
  const file = fileForTable(table);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(rows, null, 2), "utf8");
}

function compositeKey(
  row: JsonRow,
  conflict: string | string[]
): string {
  const keys = Array.isArray(conflict) ? conflict : [conflict];
  return keys.map((key) => String(row[key] ?? "")).join("\u0000");
}

class JsonDatabase implements Database {
  readonly kind = "json" as const;

  async select<T>(table: string): Promise<T[]> {
    return (await readJsonFile(table)) as unknown as T[];
  }

  async upsert<T extends Record<string, unknown>>(
    table: string,
    rows: T[],
    conflict: string | string[]
  ): Promise<void> {
    if (rows.length === 0) return;
    await enqueueForTable(table, async () => {
      const current = await readJsonFile(table);
      const byKey = new Map(
        current.map((row) => [compositeKey(row, conflict), row])
      );
      for (const row of rows) {
        byKey.set(compositeKey(row, conflict), row as JsonRow);
      }
      await writeJsonFile(table, [...byKey.values()]);
    });
  }

  async deleteWhere(
    table: string,
    column: string,
    values: (string | number)[]
  ): Promise<void> {
    if (values.length === 0) return;
    const targets = new Set(values.map((value) => String(value)));
    await enqueueForTable(table, async () => {
      const current = await readJsonFile(table);
      const next = current.filter(
        (row) => !targets.has(String(row[column] ?? ""))
      );
      if (next.length !== current.length) {
        await writeJsonFile(table, next);
      }
    });
  }
}

let jsonDatabase: JsonDatabase | null = null;
let supabaseDatabase: SupabaseDatabase | null = null;

export function getDatabase(): Database {
  const config = readSupabaseConfig();
  if (config) {
    supabaseDatabase ??= new SupabaseDatabase(config);
    return supabaseDatabase;
  }
  jsonDatabase ??= new JsonDatabase();
  return jsonDatabase;
}

export interface RowCodec<T> {
  table: string;
  idColumn: string;
  toRow(record: T): Record<string, unknown>;
  fromRow(row: Record<string, unknown>): T;
  idOf(record: T): string;
}

/**
 * Bộ lưu trữ dạng bảng dùng chung cho cả Supabase lẫn tệp JSON.
 * `replace` chỉ ghi các dòng thay đổi và xoá các dòng không còn — phù hợp
 * với danh sách tài khoản/phiên nhỏ. `upsertMany` chỉ thêm/cập nhật.
 */
export class RowStore<T> {
  private readonly codec: RowCodec<T>;
  private readonly injectedDb: Database | null;
  private queue: Promise<unknown> = Promise.resolve();

  constructor(codec: RowCodec<T>, db: Database | null = null) {
    this.codec = codec;
    this.injectedDb = db;
  }

  private database(): Database {
    return this.injectedDb ?? getDatabase();
  }

  async read(): Promise<T[]> {
    const rows = await this.database().select<Record<string, unknown>>(
      this.codec.table
    );
    return rows.map((row) => this.codec.fromRow(row));
  }

  async upsertMany(records: T[]): Promise<void> {
    if (records.length === 0) return;
    await this.enqueue(async () => {
      await this.database().upsert(
        this.codec.table,
        records.map((record) => this.codec.toRow(record)),
        this.codec.idColumn
      );
    });
  }

  async deleteByColumn(
    column: string,
    values: (string | number)[]
  ): Promise<void> {
    if (values.length === 0) return;
    await this.enqueue(async () => {
      await this.database().deleteWhere(this.codec.table, column, values);
    });
  }

  async replace(records: T[]): Promise<void> {
    await this.enqueue(async () => {
      const db = this.database();
      const current = await this.read();
      const currentById = new Map(
        current.map((record) => [this.codec.idOf(record), record])
      );
      const nextById = new Map(
        records.map((record) => [this.codec.idOf(record), record])
      );

      const rowsToWrite: Record<string, unknown>[] = [];
      for (const [id, record] of nextById) {
        const row = this.codec.toRow(record);
        const previous = currentById.get(id);
        if (
          !previous ||
          JSON.stringify(this.codec.toRow(previous)) !== JSON.stringify(row)
        ) {
          rowsToWrite.push(row);
        }
      }
      const idsToDelete = [...currentById.keys()].filter(
        (id) => !nextById.has(id)
      );

      await db.upsert(this.codec.table, rowsToWrite, this.codec.idColumn);
      await db.deleteWhere(this.codec.table, this.codec.idColumn, idsToDelete);
    });
  }

  private enqueue<TResult>(task: () => Promise<TResult>): Promise<TResult> {
    const next = this.queue.then(task, task);
    this.queue = next.then(
      () => undefined,
      () => undefined
    );
    return next;
  }
}