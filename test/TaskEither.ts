import * as assert from 'assert'
import { left as eitherLeft, right as eitherRight } from '../src/Either'
import { IO } from '../src/IO'
import { Task, task } from '../src/Task'
import { TaskEither, fromIO, fromLeft, left, right, taskEither, taskify, tryCatch } from '../src/TaskEither'

describe('TaskEither', () => {
  it('ap', () => {
    const double = (n: number): number => n * 2
    const fab = taskEither.of(double)
    const fa = taskEither.of(1)
    return Promise.all([fa.ap(fab).run(), fab.ap_(fa).run(), taskEither.ap(fab, fa).run()]).then(([e1, e2, e3]) => {
      assert.deepEqual(e1, eitherRight(2))
      assert.deepEqual(e1, e2)
      assert.deepEqual(e1, e3)
    })
  })

  it('map', () => {
    const double = (n: number): number => n * 2
    return taskEither
      .map(taskEither.of(1), double)
      .run()
      .then(e => {
        assert.deepEqual(e, eitherRight(2))
      })
  })

  it('mapLeft', () => {
    const double = (n: number): number => n * 2
    const fa = fromLeft(1)
    return fa
      .mapLeft(double)
      .run()
      .then(e => {
        assert.deepEqual(e, eitherLeft(2))
      })
  })

  it('chain', () => {
    const te1 = taskEither.chain(
      taskEither.of<string, string>('foo'),
      a => (a.length > 2 ? taskEither.of<string, number>(a.length) : fromLeft<string, number>('foo'))
    )
    const te2 = taskEither.chain(
      taskEither.of<string, string>('a'),
      a => (a.length > 2 ? taskEither.of<string, number>(a.length) : fromLeft<string, number>('foo'))
    )
    return Promise.all([te1.run(), te2.run()]).then(([e1, e2]) => {
      assert.deepEqual(e1, eitherRight(3))
      assert.deepEqual(e2, eitherLeft('foo'))
    })
  })

  it('fold', () => {
    const f = (s: string): boolean => s.length > 2
    const g = (n: number): boolean => n > 2
    const te1 = taskEither.of<string, number>(1).fold(f, g)
    const te2 = fromLeft<string, number>('foo').fold(f, g)
    return Promise.all([te1.run(), te2.run()]).then(([b1, b2]) => {
      assert.strictEqual(b1, false)
      assert.strictEqual(b2, true)
    })
  })

  it('bimap', () => {
    const f = (s: string): number => s.length
    const g = (n: number): boolean => n > 2
    const teRight = taskEither.of<string, number>(1)
    const teLeft = fromLeft<string, number>('foo')
    return Promise.all([
      teRight.bimap(f, g).run(),
      teLeft.bimap(f, g).run(),
      taskEither.bimap(teRight, f, g).run()
    ]).then(([e1, e2, e3]) => {
      assert.deepEqual(e1, eitherRight(false))
      assert.deepEqual(e2, eitherLeft(3))
      assert.deepEqual(e1, e3)
    })
  })

  it('orElse', () => {
    const l = fromLeft<string, number>('foo')
    const r = taskEither.of<string, number>(1)
    const tl = l.orElse(l => taskEither.of<number, number>(l.length))
    const tr = r.orElse(() => taskEither.of<number, number>(2))
    return Promise.all([tl.run(), tr.run()]).then(([el, er]) => {
      assert.deepEqual(el, eitherRight(3))
      assert.deepEqual(er, eitherRight(1))
    })
  })

  it('left', () => {
    return left(task.of(1))
      .run()
      .then(e => {
        assert.deepEqual(e, eitherLeft(1))
      })
  })

  it('applySecond', () => {
    const log: Array<string> = []
    const append = (message: string): TaskEither<string, number> =>
      right(new Task(() => Promise.resolve(log.push(message))))
    return append('a')
      .applySecond(append('b'))
      .run()
      .then(e => {
        assert.deepEqual(e, eitherRight(2))
        assert.deepEqual(log, ['a', 'b'])
      })
  })

  it('tryCatch', () => {
    const ok = tryCatch(() => Promise.resolve(1), () => 'error')
    const ko = tryCatch(() => Promise.reject(undefined), () => 'error')
    return Promise.all([ok.run(), ko.run()]).then(([eok, eko]) => {
      assert.deepEqual(eok, eitherRight(1))
      assert.deepEqual(eko, eitherLeft('error'))
    })
  })

  it('fromIO', () => {
    const io = new IO(() => 1)
    const fa = fromIO(io)
    return fa.run().then(e => {
      assert.deepEqual(e, eitherRight(1))
    })
  })

  it('taskify', () => {
    const api1 = (path: string, callback: (err: Error | null, result?: string) => void): void => {
      callback(null, 'ok')
    }
    const api2 = (path: string, callback: (err: Error | null, result?: string) => void): void => {
      callback(new Error('ko'))
    }
    return Promise.all([taskify(api1)('foo').run(), taskify(api2)('foo').run()]).then(([e1, e2]) => {
      assert.deepEqual(e1, eitherRight('ok'))
      assert.deepEqual(e2, eitherLeft(new Error('ko')))
    })
  })
})
