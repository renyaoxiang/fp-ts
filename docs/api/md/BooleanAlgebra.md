MODULE [BooleanAlgebra](https://github.com/gcanti/fp-ts/blob/master/src/BooleanAlgebra.ts)

# BooleanAlgebra

_type class_

```ts
interface BooleanAlgebra<A> extends HeytingAlgebra<A> {}
```

Boolean algebras are Heyting algebras with the additional constraint that the law of the excluded middle is true
(equivalently, double-negation is true).

Instances should satisfy the following laws in addition to the `HeytingAlgebra` laws:

* Excluded middle: `a ∨ ¬a = 1`

Boolean algebras generalize classical logic: one is equivalent to "true" and zero is equivalent to "false".

# booleanAlgebraBoolean

_instance_

_since 1.4.0_

```ts
BooleanAlgebra<boolean>
```

# booleanAlgebraVoid

_instance_

_since 1.4.0_

```ts
BooleanAlgebra<void>
```

# getDualBooleanAlgebra

_function_

_since 1.4.0_

```ts
<A>(B: BooleanAlgebra<A>): BooleanAlgebra<A>
```

Every boolean algebras has a dual algebra, which involves reversing one/zero as well as join/meet.

# getFunctionBooleanAlgebra

_function_

_since 1.4.0_

```ts
<B>(B: BooleanAlgebra<B>) => <A = never>(): BooleanAlgebra<(a: A) => B>
```
