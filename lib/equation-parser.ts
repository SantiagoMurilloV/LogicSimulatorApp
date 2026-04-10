import type { ASTNode, CircuitError } from './types'

type TokenType = 'VAR' | 'AND' | 'OR' | 'NOT' | 'LPAREN' | 'RPAREN' | 'EOF'

interface Token {
  type: TokenType
  value: string
}

function tokenize(input: string): Token[] {
  const tokens: Token[] = []
  let pos = 0
  const str = input.replace(/\s+/g, ' ').trim()

  while (pos < str.length) {
    const char = str[pos]

    if (char === ' ') { pos++; continue }

    if (char === '(') {
      tokens.push({ type: 'LPAREN', value: '(' }); pos++
    } else if (char === ')') {
      tokens.push({ type: 'RPAREN', value: ')' }); pos++
    } else if (char === "'") {
      tokens.push({ type: 'NOT', value: "'" }); pos++
    } else if (char === '·' || char === '*' || char === '&') {
      tokens.push({ type: 'AND', value: '·' }); pos++
    } else if (char === '+' || char === '|') {
      tokens.push({ type: 'OR', value: '+' }); pos++
    } else if (char === '!' || char === '~') {
      tokens.push({ type: 'NOT', value: "'" }); pos++
    } else if (/[A-Za-z]/.test(char)) {
      // Collect full word to check for keywords
      let word = ''
      while (pos < str.length && /[A-Za-z0-9_]/.test(str[pos])) {
        word += str[pos]; pos++
      }
      const upper = word.toUpperCase()

      if (upper === 'AND') {
        tokens.push({ type: 'AND', value: '·' })
      } else if (upper === 'OR') {
        tokens.push({ type: 'OR', value: '+' })
      } else if (upper === 'NOT') {
        tokens.push({ type: 'NOT', value: "'" })
      } else {
        // Each letter is a separate variable: "AB" becomes A, B (implicit AND)
        for (const letter of upper) {
          tokens.push({ type: 'VAR', value: letter })
          // Check for postfix NOT after each letter — only applies to last
        }
      }

      // Check for postfix NOT: A' or AB' (applies to last variable)
      if (pos < str.length && str[pos] === "'") {
        tokens.push({ type: 'NOT', value: "'" }); pos++
      }
    } else {
      pos++
    }
  }

  tokens.push({ type: 'EOF', value: '' })
  return tokens
}

// Convert postfix NOT to prefix and insert implicit AND
function preprocessTokens(tokens: Token[]): Token[] {
  const result: Token[] = []

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i]

    if (tok.type === 'NOT' && result.length > 0) {
      const prev = result[result.length - 1]
      if (prev.type === 'VAR') {
        // A' -> NOT A
        const varTok = result.pop()!
        result.push({ type: 'NOT', value: "'" })
        result.push(varTok)
        continue
      }
      if (prev.type === 'RPAREN') {
        // (expr)' -> NOT (expr)
        let depth = 0
        let insertIdx = result.length - 1
        for (let j = result.length - 1; j >= 0; j--) {
          if (result[j].type === 'RPAREN') depth++
          if (result[j].type === 'LPAREN') depth--
          if (depth === 0) { insertIdx = j; break }
        }
        result.splice(insertIdx, 0, { type: 'NOT', value: "'" })
        continue
      }
      // Prefix NOT
      result.push(tok)
    } else {
      // Insert implicit AND between adjacent terms
      if (result.length > 0) {
        const prev = result[result.length - 1]
        const needsAnd =
          (prev.type === 'VAR' || prev.type === 'RPAREN') &&
          (tok.type === 'VAR' || tok.type === 'LPAREN' || tok.type === 'NOT')
        if (needsAnd) {
          result.push({ type: 'AND', value: '·' })
        }
      }
      result.push(tok)
    }
  }

  return result
}

class Parser {
  private tokens: Token[]
  private pos: number

  constructor(tokens: Token[]) {
    this.tokens = tokens
    this.pos = 0
  }

  private current(): Token { return this.tokens[this.pos] }
  private advance(): Token {
    const t = this.current()
    if (t.type !== 'EOF') this.pos++
    return t
  }

  parse(): ASTNode {
    const ast = this.orExpr()
    if (this.current().type !== 'EOF') {
      throw new Error(`Token inesperado: ${this.current().value || this.current().type}`)
    }
    return ast
  }

  private orExpr(): ASTNode {
    let left = this.andExpr()
    while (this.current().type === 'OR') {
      this.advance()
      left = { type: 'OR', left, right: this.andExpr() }
    }
    return left
  }

  private andExpr(): ASTNode {
    let left = this.notExpr()
    while (this.current().type === 'AND') {
      this.advance()
      left = { type: 'AND', left, right: this.notExpr() }
    }
    return left
  }

  private notExpr(): ASTNode {
    if (this.current().type === 'NOT') {
      this.advance()
      return { type: 'NOT', operand: this.notExpr() }
    }
    return this.primary()
  }

  private primary(): ASTNode {
    const tok = this.current()
    if (tok.type === 'VAR') {
      this.advance()
      return { type: 'VAR', value: tok.value }
    }
    if (tok.type === 'LPAREN') {
      this.advance()
      const expr = this.orExpr()
      if (this.current().type !== 'RPAREN') throw new Error('Falta paréntesis de cierre')
      this.advance()
      return expr
    }
    throw new Error(`Token inesperado: ${tok.value || tok.type}`)
  }
}

export function parseEquation(equation: string): { ast: ASTNode | null; error: CircuitError | null } {
  if (!equation.trim()) {
    return { ast: null, error: { type: 'syntax', message: 'Ecuación vacía' } }
  }
  try {
    const raw = tokenize(equation)
    const tokens = preprocessTokens(raw)
    const parser = new Parser(tokens)
    return { ast: parser.parse(), error: null }
  } catch (e) {
    return { ast: null, error: { type: 'syntax', message: e instanceof Error ? e.message : 'Sintaxis inválida' } }
  }
}

export function extractVariables(ast: ASTNode): string[] {
  const vars = new Set<string>()
  function walk(n: ASTNode) {
    if (n.type === 'VAR' && n.value) vars.add(n.value)
    if (n.left) walk(n.left)
    if (n.right) walk(n.right)
    if (n.operand) walk(n.operand)
  }
  walk(ast)
  return Array.from(vars).sort()
}

export function evaluateAST(ast: ASTNode, values: Record<string, boolean>): boolean {
  switch (ast.type) {
    case 'VAR': return values[ast.value!] ?? false
    case 'AND': return evaluateAST(ast.left!, values) && evaluateAST(ast.right!, values)
    case 'OR': return evaluateAST(ast.left!, values) || evaluateAST(ast.right!, values)
    case 'NOT': return !evaluateAST(ast.operand!, values)
    default: return false
  }
}

// Canonical notation: A', ·, +
export function astToEquation(ast: ASTNode): string {
  switch (ast.type) {
    case 'VAR':
      return ast.value!
    case 'NOT': {
      const inner = astToEquation(ast.operand!)
      if (ast.operand!.type === 'VAR') return `${inner}'`
      return `(${inner})'`
    }
    case 'AND': {
      const l = astToEquation(ast.left!)
      const r = astToEquation(ast.right!)
      const ls = ast.left!.type === 'OR' ? `(${l})` : l
      const rs = ast.right!.type === 'OR' ? `(${r})` : r
      return `${ls} · ${rs}`
    }
    case 'OR': {
      const l = astToEquation(ast.left!)
      const r = astToEquation(ast.right!)
      const ls = ast.left!.type === 'AND' ? `(${l})` : l
      const rs = ast.right!.type === 'AND' ? `(${r})` : r
      return `${ls} + ${rs}`
    }
    default: return ''
  }
}
