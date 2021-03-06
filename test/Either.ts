import * as assert from 'assert'
import {
  Either,
  either,
  fromNullable,
  fromOption,
  fromOptionL,
  fromPredicate,
  fromValidation,
  getSetoid,
  left,
  right,
  tryCatch,
  isLeft,
  isRight
} from '../src/Either'
import { none, option, some } from '../src/Option'
import { setoidNumber, setoidString } from '../src/Setoid'
import { traverse } from '../src/Traversable'
import { failure, success } from '../src/Validation'

describe('Either', () => {
  it('fold', () => {
    const f = (s: string) => `left${s.length}`
    const g = (s: string) => `right${s.length}`
    assert.strictEqual(left<string, string>('abc').fold(f, g), 'left3')
    assert.strictEqual(right<string, string>('abc').fold(f, g), 'right3')
  })

  it('map', () => {
    const f = (s: string): number => s.length
    assert.deepEqual(right('abc').map(f), right(3))
    assert.deepEqual(left<string, string>('s').map(f), left('s'))
    assert.deepEqual(either.map(right('abc'), f), right(3))
    assert.deepEqual(either.map(left<string, string>('s'), f), left('s'))
  })

  it('bimap', () => {
    const f = (s: string): number => s.length
    const g = (n: number): boolean => n > 2
    assert.deepEqual(right<string, number>(1).bimap(f, g), right(false))
    assert.deepEqual(left<string, number>('foo').bimap(f, g), left(3))
    assert.deepEqual(either.bimap(right<string, number>(1), f, g), right(false))
  })

  it('ap', () => {
    const f = (s: string): number => s.length
    assert.deepEqual(right<string, string>('abc').ap(right<string, (s: string) => number>(f)), right(3))
    assert.deepEqual(left<string, string>('a').ap(right<string, (s: string) => number>(f)), left<string, number>('a'))
    assert.deepEqual(
      right<string, string>('abc').ap(left<string, (s: string) => number>('a')),
      left<string, number>('a')
    )
    assert.deepEqual(left<string, string>('b').ap(left<string, (s: string) => number>('a')), left<string, number>('a'))

    assert.deepEqual(right<string, (s: string) => number>(f).ap_(right<string, string>('abc')), right(3))
    assert.deepEqual(
      left<string, (s: string) => number>('a').ap_(right<string, string>('abc')),
      left<string, number>('a')
    )
  })

  it('chain', () => {
    const f = (s: string) => right<string, number>(s.length)
    assert.deepEqual(right<string, string>('abc').chain(f), right(3))
    assert.deepEqual(left<string, string>('a').chain(f), left('a'))
    assert.deepEqual(either.chain(right<string, string>('abc'), f), right(3))
  })

  it('fromPredicate', () => {
    const predicate = (n: number) => n >= 2
    const handleError = (n: number) => `Invalid number ${n}`
    const gt2 = fromPredicate(predicate, handleError)
    assert.deepEqual(gt2(3), right(3))
    assert.deepEqual(gt2(1), left('Invalid number 1'))
  })

  it('tryCatch', () => {
    const e1 = tryCatch(() => {
      return JSON.parse(`{}`)
    })
    assert.deepEqual(e1, right({}))

    const e2 = tryCatch(() => {
      return JSON.parse(``)
    })
    assert.deepEqual(e2, left(new SyntaxError('Unexpected end of JSON input')))

    const e3 = tryCatch(() => {
      throw 'a string'
    })
    assert.deepEqual(e3, left(new Error('a string')))

    type ObjectWithStatusCode = { statusCode: number }
    const thrownIsObjectWithStatusCode = (thrown: {}): thrown is ObjectWithStatusCode =>
      typeof thrown === 'object' && 'statusCode' in thrown
    const onerror = (thrown: {}): Error => {
      if (thrownIsObjectWithStatusCode(thrown)) {
        return new Error(`Bad response: ${thrown.statusCode}`)
      } else if (thrown instanceof Error) {
        return thrown
      } else {
        return new Error('Unexpected error')
      }
    }
    const e4 = tryCatch(() => {
      throw { statusCode: 404 }
    }, onerror)
    assert.deepEqual(e4, left(new Error('Bad response: 404')))
  })

  it('getOrElse', () => {
    assert.equal(right(12).getOrElse(17), 12)
    assert.equal(left(12).getOrElse(17), 17)
  })

  it('getOrElseL', () => {
    assert.equal(right(12).getOrElseL(() => 17), 12)
    assert.equal(left(12).getOrElseL(() => 17), 17)
    assert.equal(left(12).getOrElseL((l: number) => l + 1), 13)
  })

  it('fromOption', () => {
    assert.deepEqual(fromOption('default')(none), left('default'))
    assert.deepEqual(fromOption('default')(some(1)), right(1))
  })

  it('fromNullable', () => {
    assert.deepEqual(fromNullable('default')(null), left('default'))
    assert.deepEqual(fromNullable('default')(undefined), left('default'))
    assert.deepEqual(fromNullable('default')(1), right(1))
  })

  it('getSetoid', () => {
    const equals = getSetoid(setoidString, setoidNumber).equals
    assert.strictEqual(equals(right(1), right(1)), true)
    assert.strictEqual(equals(right(1), right(2)), false)
    assert.strictEqual(equals(right(1), left('foo')), false)
    assert.strictEqual(equals(left('foo'), left('foo')), true)
    assert.strictEqual(equals(left('foo'), left('bar')), false)
    assert.strictEqual(equals(left('foo'), right(1)), false)
  })

  it('fromValidation', () => {
    assert.deepEqual(fromValidation(success(1)), right(1))
    assert.deepEqual(fromValidation(failure('a')), left('a'))
  })

  it('traverse', () => {
    assert.deepEqual(traverse(option, either)(left('foo'), a => (a >= 2 ? some(a) : none)), some(left('foo')))
    assert.deepEqual(traverse(option, either)(right(1), a => (a >= 2 ? some(a) : none)), none)
    assert.deepEqual(traverse(option, either)(right(3), a => (a >= 2 ? some(a) : none)), some(right(3)))
  })

  it('chainRec', () => {
    const chainRec = either.chainRec
    assert.deepEqual(chainRec(1, a => left<string, Either<number, number>>('foo')), left('foo'))
    assert.deepEqual(chainRec(1, a => right<string, Either<number, number>>(right(1))), right(1))
    assert.deepEqual(
      chainRec(1, a => {
        if (a < 5) {
          return right<string, Either<number, number>>(left(a + 1))
        } else {
          return right<string, Either<number, number>>(right(a))
        }
      }),
      right(5)
    )
  })

  it('fromOptionL', () => {
    assert.deepEqual(fromOptionL(() => 'default')(none), left('default'))
    assert.deepEqual(fromOptionL(() => 'default')(some(1)), right(1))
  })

  it('filterOrElse', () => {
    assert.deepEqual(right(12).filterOrElse(n => n > 10, -1), right(12))
    assert.deepEqual(right(7).filterOrElse(n => n > 10, -1), left(-1))
    assert.deepEqual(left(12).filterOrElse(n => n > 10, -1), left(12))
  })

  it('filterOrElseL', () => {
    assert.deepEqual(right(12).filterOrElseL(n => n > 10, () => -1), right(12))
    assert.deepEqual(right(7).filterOrElseL(n => n > 10, () => -1), left(-1))
    assert.deepEqual(left(12).filterOrElseL(n => n > 10, () => -1), left(12))
  })

  it('isLeft', () => {
    assert.strictEqual(right(1).isLeft(), false)
    assert.strictEqual(left(1).isLeft(), true)
    assert.strictEqual(isLeft(right(1)), false)
    assert.strictEqual(isLeft(left(1)), true)
  })

  it('isRight', () => {
    assert.strictEqual(right(1).isRight(), true)
    assert.strictEqual(left(1).isRight(), false)
    assert.strictEqual(isRight(right(1)), true)
    assert.strictEqual(isRight(left(1)), false)
  })

  it('alt', () => {
    assert.deepEqual(right<string, number>(1).alt(right<string, number>(2)), right<string, number>(1))
    assert.deepEqual(right<string, number>(1).alt(left<string, number>('foo')), right<string, number>(1))
    assert.deepEqual(left<string, number>('foo').alt(right<string, number>(1)), right<string, number>(1))
    assert.deepEqual(left<string, number>('foo').alt(left<string, number>('bar')), left<string, number>('bar'))
    assert.deepEqual(either.alt(right<string, number>(1), right<string, number>(2)), right<string, number>(1))
  })

  it('extend', () => {
    assert.deepEqual(right(1).extend(() => 2), right(2))
    assert.deepEqual(left('foo').extend(() => 2), left('foo'))
    assert.deepEqual(either.extend(right(1), () => 2), right(2))
  })

  it('reduce', () => {
    assert.deepEqual(right('bar').reduce('foo', (b, a) => b + a), 'foobar')
    assert.deepEqual(left('bar').reduce('foo', (b, a) => b + a), 'foo')
    assert.deepEqual(either.reduce(right('bar'), 'foo', (b, a) => b + a), 'foobar')
  })

  it('mapLeft', () => {
    const double = (n: number): number => n * 2
    assert.deepEqual(right<number, string>('bar').mapLeft(double), right('bar'))
    assert.deepEqual(left<number, string>(2).mapLeft(double), left(4))
  })

  it('toString', () => {
    assert.strictEqual(right('bar').toString(), 'right("bar")')
    assert.strictEqual(right('bar').inspect(), 'right("bar")')
    assert.strictEqual(left('bar').toString(), 'left("bar")')
    assert.strictEqual(left('bar').inspect(), 'left("bar")')
  })

  it('swap', () => {
    assert.deepEqual(right('bar').swap(), left('bar'))
    assert.deepEqual(left('bar').swap(), right('bar'))
  })
})
