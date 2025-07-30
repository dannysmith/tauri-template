import { describe, it, expect } from 'vitest'

function add(a: number, b: number): number {
  return a + b
}

describe('example utility functions', () => {
  it('adds two numbers correctly', () => {
    expect(add(2, 3)).toBe(5)
    expect(add(-1, 1)).toBe(0)
    expect(add(0, 0)).toBe(0)
  })
})
