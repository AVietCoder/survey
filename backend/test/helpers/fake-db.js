import { randomUUID } from 'node:crypto'

/**
 * DB giả trong bộ nhớ, mô phỏng đúng tập con API supabase-js mà service theo dõi dùng
 * (select/insert/update/delete + eq/neq/in/is/not/order/limit/range/single/maybeSingle),
 * kèm ràng buộc unique (mã lỗi 23505) và cascade — đủ để test idempotency và cô lập dữ liệu.
 */
export function createFakeDb(seed = {}, { unique = {}, cascade = {} } = {}) {
  const tables = Object.fromEntries(Object.entries(seed).map(([name, rows]) => [name, rows.map(row => ({ ...row }))]))
  const rowsOf = name => (tables[name] ||= [])
  const failures = []
  const clone = row => (row === undefined || row === null ? row : JSON.parse(JSON.stringify(row)))

  class Query {
    constructor(table) {
      Object.assign(this, { table, op: 'select', filters: [], sort: [], max: null, offset: 0, payload: null, returning: false, mode: 'many' })
    }
    select() { if (this.op !== 'select') this.returning = true; return this }
    insert(payload) { this.op = 'insert'; this.payload = payload; return this }
    update(payload) { this.op = 'update'; this.payload = payload; return this }
    delete() { this.op = 'delete'; return this }
    eq(column, value) { this.filters.push(row => row[column] === value); return this }
    neq(column, value) { this.filters.push(row => row[column] !== value); return this }
    in(column, values) { this.filters.push(row => values.includes(row[column])); return this }
    is(column, value) { this.filters.push(row => (value === null ? row[column] === null || row[column] === undefined : row[column] === value)); return this }
    not(column, operator, value) { this.filters.push(row => !(operator === 'is' && value === null ? row[column] === null || row[column] === undefined : row[column] === value)); return this }
    gte(column, value) { this.filters.push(row => row[column] >= value); return this }
    gt(column, value) { this.filters.push(row => row[column] > value); return this }
    lte(column, value) { this.filters.push(row => row[column] <= value); return this }
    lt(column, value) { this.filters.push(row => row[column] < value); return this }
    ilike(column, pattern) {
      const expression = new RegExp(`^${String(pattern).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/%/g, '.*')}$`, 'i')
      this.filters.push(row => expression.test(String(row[column] ?? '')))
      return this
    }
    order(column, { ascending = true } = {}) { this.sort.push([column, ascending]); return this }
    limit(count) { this.max = count; return this }
    range(from, to) { this.offset = from; this.max = to - from + 1; return this }
    maybeSingle() { this.mode = 'maybe'; return this }
    single() { this.mode = 'one'; return this }

    matches() { return rowsOf(this.table).filter(row => this.filters.every(test => test(row))) }
    shape(rows) {
      if (this.mode === 'many') return { data: rows.map(clone), error: null }
      if (this.mode === 'maybe') return { data: clone(rows[0] ?? null), error: null }
      return rows.length === 1 ? { data: clone(rows[0]), error: null } : { data: null, error: { code: 'PGRST116', message: 'no single row' } }
    }
    run() {
      const failure = failures.find(item => item.test(this.table, this.op))
      if (failure) return { data: null, error: { code: failure.code, message: 'fake failure' } }
      if (this.op === 'insert') {
        const created = []
        for (const input of Array.isArray(this.payload) ? this.payload : [this.payload]) {
          const row = { id: randomUUID(), created_at: new Date().toISOString(), ...input }
          for (const columns of unique[this.table] || [])
            if (rowsOf(this.table).some(existing => columns.every(column => existing[column] === row[column])))
              return { data: null, error: { code: '23505', message: 'duplicate key value' } }
          rowsOf(this.table).push(row); created.push(row)
        }
        return this.returning ? this.shape(created) : { data: null, error: null }
      }
      if (this.op === 'update') {
        const hit = this.matches()
        hit.forEach(row => Object.assign(row, this.payload))
        return this.returning ? this.shape(hit) : { data: null, error: null }
      }
      if (this.op === 'delete') {
        const hit = new Set(this.matches())
        tables[this.table] = rowsOf(this.table).filter(row => !hit.has(row))
        for (const [child, column] of cascade[this.table] || [])
          tables[child] = rowsOf(child).filter(row => ![...hit].some(parent => parent.id === row[column]))
        return { data: null, error: null }
      }
      let rows = this.matches()
      for (const [column, ascending] of [...this.sort].reverse())
        rows = [...rows].sort((a, b) => (a[column] > b[column] ? 1 : a[column] < b[column] ? -1 : 0) * (ascending ? 1 : -1))
      return { ...this.shape(rows.slice(this.offset, this.offset + (this.max ?? rows.length))), count: rows.length }
    }
    then(resolve, reject) { return Promise.resolve(this.run()).then(resolve, reject) }
  }

  return {
    from: table => new Query(table),
    tables, rowsOf,
    failWhen: (test, code = 'XX000') => failures.push({ test, code }),
    clearFailures: () => { failures.length = 0 }
  }
}

export const TRACKING_CONSTRAINTS = {
  unique: { tracking_credentials: [['token_hash']], tracking_sessions: [['response_id']] },
  cascade: {
    tracking_profiles: [['tracking_credentials', 'profile_id'], ['tracking_consents', 'profile_id'], ['tracking_sessions', 'profile_id']]
  }
}
