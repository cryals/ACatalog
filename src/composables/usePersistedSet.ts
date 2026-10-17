import { computed, ref } from 'vue'

export function usePersistedSet(key: string) {
  const initial = (() => {
    try { return JSON.parse(localStorage.getItem(key) ?? '[]') as string[] } catch { return [] }
  })()
  const values = ref(new Set(initial))
  const persist = () => localStorage.setItem(key, JSON.stringify([...values.value]))
  const toggle = (value: string) => {
    const next = new Set(values.value)
    if (next.has(value)) next.delete(value)
    else next.add(value)
    values.value = next
    persist()
  }
  const remove = (value: string) => {
    const next = new Set(values.value)
    next.delete(value)
    values.value = next
    persist()
  }
  const clear = () => { values.value = new Set(); persist() }
  return { values: computed(() => values.value), toggle, remove, clear, has: (value: string) => values.value.has(value) }
}
