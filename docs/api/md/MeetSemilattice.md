MODULE [MeetSemilattice](https://github.com/gcanti/fp-ts/blob/master/src/MeetSemilattice.ts)

# MeetSemilattice

_type class_

```ts
interface MeetSemilattice<A> {
  meet: (x: A, y: A) => A
}
```

A meet-semilattice (or lower semilattice) is a semilattice whose operation is called "meet", and which can be thought
of as a greatest lower bound.

A `MeetSemilattice` must satisfy the following laws:

* Associativity: `a ∧ (b ∧ c) = (a ∧ b) ∧ c`
* Commutativity: `a ∧ b = b ∧ a`
* Idempotency: `a ∧ a = a`
