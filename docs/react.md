# React, TypeScript & JavaScript — A Deep Dive

---

## Part 1: JavaScript Fundamentals

### Everything is an Object

JavaScript has one foundational truth: **everything is an object**, or behaves like one. Numbers, strings, functions,
arrays, classes — they all ultimately descend from `Object`.

```js
typeof {} // "object"
typeof [] // "object"
typeof function () {} // "function" (but instanceof Object === true)
typeof 42 // "number" (primitive, but auto-boxed to Number object)
```

Primitives (`string`, `number`, `boolean`, `null`, `undefined`, `symbol`, `bigint`) are the exception — they're not
objects — but JavaScript automatically "boxes" them into their object wrappers when you access properties on them:

```js
'hello'.toUpperCase() // JS temporarily wraps "hello" in a String object
```

---

### Functions Are Objects

Functions in JS are **first-class objects** — they can be assigned to variables, passed as arguments, and have
properties attached to them.

```js
function greet() {
  return 'hello'
}

greet instanceof Function // true
greet instanceof Object // true

// Functions can have properties like any object
greet.version = '1.0'
console.log(greet.version) // "1.0"
```

This is why you can pass functions as callbacks, store them in arrays, and return them from other functions. It's also
why React can accept both function components and class components — they're both just callable objects.

---

### Classes Are Just Functions

`class` syntax in JavaScript is **syntactic sugar** over constructor functions and prototypes. Under the hood, they
compile down to the same thing.

```js
// Modern class syntax:
class Dog {
  constructor(name) {
    this.name = name
  }

  bark() {
    console.log('woof')
  }
}

// Is identical to this older style:
function Dog(name) {
  this.name = name
}

Dog.prototype.bark = function () {
  console.log('woof')
}

// Proof:
typeof Dog // "function" — classes ARE functions
```

The `prototype` chain is how JavaScript does inheritance — when you call `dog.bark()`, JS looks up the chain: instance →
`Dog.prototype` → `Object.prototype`.

---

### `this` — The Most Confusing Part of JS

`this` refers to the object that **called** the function, not where the function was defined. This causes bugs when
passing methods as callbacks.

```js
class Timer {
  constructor() {
    this.count = 0
  }

  tick() {
    this.count++
  } // `this` works fine here
}

const t = new Timer()
setTimeout(t.tick, 1000) // ❌ `this` is undefined — tick lost its context
setTimeout(() => t.tick(), 1000) // ✅ arrow function preserves `this`
```

**Arrow functions** don't have their own `this` — they inherit it from the surrounding scope. This is why they're
preferred for callbacks and class methods in React.

---

### The Event Loop

JavaScript is **single-threaded** — it can only do one thing at a time. The event loop is how it handles async
operations without blocking:

```
Call Stack → runs sync code
     ↓
Web APIs → handles async (setTimeout, fetch, etc.)
     ↓
Callback Queue → waits for stack to be empty
     ↓
Event Loop → moves callbacks back to stack when ready
```

```js
console.log('1')
setTimeout(() => console.log('2'), 0) // async — goes to queue
console.log('3')

// Output: 1, 3, 2
// Even with 0ms delay, setTimeout is async and waits for stack to clear
```

---

### Async / Await and Promises

`async/await` is syntactic sugar over Promises. A `Promise` represents a value that will be available in the future.

```js
// Promise style:
fetch('/api/user')
  .then((res) => res.json())
  .then((data) => console.log(data))
  .catch((err) => console.error(err))

// Async/await style (same thing, cleaner):
async function getUser() {
  try {
    const res = await fetch('/api/user')
    const data = await res.json()
    console.log(data)
  } catch (err) {
    console.error(err)
  }
}
```

`async` functions always return a Promise, even if you return a plain value.

---

### Arrow Functions vs Function Declarations

```js
// Function declaration — hoisted, has own `this`
function getUser() {}

getUser() // ✅ callable before definition

// Arrow function — not hoisted, inherits `this`
const getUser = () => {}
getUser() // ❌ ReferenceError if called before declaration
```

For React components and utility functions the two are functionally equivalent — the choice is mostly style. Arrow
functions are preferred for callbacks; function declarations are conventional for top-level utilities and Next.js
exports.

---

## Part 2: TypeScript

TypeScript is JavaScript with a **type system layered on top**. It compiles down to plain JavaScript — the browser never
sees TypeScript.

---

### What TypeScript Adds

```ts
// JavaScript — no safety
function add(a, b) {
  return a + b
}

add('hello', 42) // runs, returns "hello42" — probably a bug

// TypeScript — caught at compile time
function add(a: number, b: number): number {
  return a + b
}

add('hello', 42) // ❌ Error: Argument of type 'string' is not assignable to 'number'
```

TypeScript catches bugs before runtime, makes refactoring safer, and provides autocomplete in editors.

---

### `interface` vs `type`

Both describe the shape of an object, but they have key differences:

```ts
// interface — extendable, mergeable, best for object shapes
interface User {
  name: string
  age: number
}

interface Admin extends User {
  role: string
}

// Declaration merging — only interfaces can do this
interface User {
  email: string
}

// User now has: name, age, email ✅

// type — more flexible, supports unions, tuples, primitives
type ID = string | number // union — impossible with interface
type Pair = [string, number] // tuple — impossible with interface
type User = {name: string} // object shape — works like interface

// type uses intersection instead of extends:
type Admin = User & {role: string}

// type CANNOT be merged:
type User = {email: string} // ❌ Duplicate identifier error
```

**Rule of thumb:** Use `interface` for component props and object shapes; use `type` for unions, tuples, or complex
compositions.

---

### Generics

Generics let you write reusable code that works with multiple types while remaining type-safe:

```ts
// Without generics — loses type info
function first(arr: any[]): any {
  return arr[0]
}

// With generics — type is preserved
function first<T>(arr: T[]): T {
  return arr[0]
}

const num = first([1, 2, 3]) // TypeScript knows: num is number
const str = first(['a', 'b']) // TypeScript knows: str is string
```

---

### Utility Types

TypeScript ships with built-in type transformers:

```ts
interface User {
  name: string
  age: number
  email: string
}

Partial<User> // all fields optional
Required<User> // all fields required
Pick<User, 'name'> // only { name: string }
Omit<User, 'email'> // everything except email
Readonly<User> // all fields immutable
Record<string, User> // { [key: string]: User }
```

These are heavily used in React for prop types — e.g., `Partial<ButtonProps>` for a component where all props are
optional.

---

## Part 3: React

React is a **UI library** built on one core idea: your UI is a function of your state.

```
UI = f(state)
```

When state changes, React re-runs your component function and figures out the minimal DOM updates needed.

---

### What React Actually Does

React never touches the real DOM directly. It maintains a **Virtual DOM** — a lightweight JavaScript object tree
representing the UI. When state changes:

1. React re-renders the component (calls the function again)
2. Compares new Virtual DOM to previous (called **diffing** or **reconciliation**)
3. Applies only the minimal changes to the real DOM (**patching**)

This is fast because DOM operations are expensive; JS object comparisons are cheap.

---

### JSX

JSX looks like HTML in JavaScript but it's neither — it's **syntactic sugar** for `React.createElement()` calls:

```jsx
// What you write:
const el = <div className="box">Hello</div>

// What it compiles to:
const el = React.createElement("div", {className: "box"}, "Hello")

// Which produces a plain JS object:
{
    type: "div",
        props
:
    {
        className: "box",
            children
    :
        "Hello"
    }
}
```

React reads these objects to build and update the DOM.

---

### Components — The Building Block

A component is any function that returns JSX. React identifies components by their capital letter.

```tsx
// Function component (modern standard)
function Button({label, onClick}: {label: string; onClick: () => void}) {
  return <button onClick={onClick}>{label}</button>
}

// Class component (legacy)
class Button extends React.Component<{label: string}> {
  render() {
    return <button>{this.props.label}</button>
  }
}
```

**Why both work:** React calls `Component(props)` for function components and `new Component(props).render()` for class
components. Both return JSX objects, which is all React needs. Since JavaScript classes are just functions with
prototypes, they're both "callable things that return JSX" at the engine level.

---

### The Component Lifecycle

Every component goes through: **mount → update → unmount**

```
Mount    → component appears in the DOM
Update   → state or props change, component re-renders
Unmount  → component is removed from the DOM
```

In function components, `useEffect` handles all lifecycle stages:

```tsx
useEffect(() => {
  // Runs after mount (and after updates if deps change)
  const subscription = subscribe()

  return () => {
    // Cleanup — runs before unmount (or before next effect)
    subscription.unsubscribe()
  }
}, [dependency]) // runs again whenever `dependency` changes
// [] = run once on mount only
// no array = run after every render
```

---

### Props vs State

```tsx
// Props — data passed IN from a parent. Read-only.
function Greeting({name}: {name: string}) {
  return <h1>Hello, {name}</h1>
}

// State — data owned BY the component. Triggers re-render when changed.
function Counter() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}
```

The key distinction: **props flow down** (parent → child), **state lives inside** the component.

---

### Hooks

Hooks are a **special category of function** — not a component, not a plain method. They let function components access
React features like state and lifecycle. They have strict rules: only call them at the top level of a component (not
inside conditions or loops), and only inside React functions.

```tsx
useState() // local component state
useEffect() // side effects & lifecycle
useRef() // reference a DOM element or persist a value without re-render
useContext() // consume a React Context
useMemo() // memoize an expensive calculation
useCallback() // memoize a function reference
useReducer() // complex state logic (like a mini Redux)
```

**Custom hooks** let you extract and reuse stateful logic:

```tsx
function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth)
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return width
}

// Reusable in any component:
function Layout() {
  const width = useWindowWidth()
  return <div>{width > 768 ? <Sidebar /> : null}</div>
}
```

---

### Context — Avoiding Prop Drilling

Passing props through many layers of components is called **prop drilling**. Context solves it by broadcasting data to
any component in the tree.

```tsx
// Create context
const ThemeContext = createContext<'light' | 'dark'>('light')

// Provide it high in the tree
function App() {
  return (
    <ThemeContext.Provider value="dark">
      <Layout />
    </ThemeContext.Provider>
  )
}

// Consume it anywhere below — no props needed
function Button() {
  const theme = useContext(ThemeContext)
  return <button className={theme}>Click</button>
}
```

---

### React's Different "Types" of Things

| Type                 | Returns          | Naming          | Purpose                       |
| -------------------- | ---------------- | --------------- | ----------------------------- |
| **Component**        | JSX              | Capitalized     | UI building block             |
| **Hook**             | Data / functions | `use` prefix    | Stateful logic                |
| **Event Handler**    | void / anything  | `handle` prefix | Responds to events            |
| **Utility Function** | Anything         | Anything        | Pure logic, no React rules    |
| **HOC**              | A component      | `with` prefix   | Wraps and enhances components |
| **Custom Hook**      | Data / functions | `use` prefix    | Reusable stateful logic       |
| **Context**          | —                | —               | Cross-tree data sharing       |
| **Ref**              | Mutable object   | —               | DOM access / stable values    |
| **Portal**           | —                | —               | Render outside DOM tree       |

---

### A Complete Component in Context

```tsx
// Types
interface ProfileProps {
  profile: Profile
  label: string // a prop, not a second parameter
}

// Component
export function ProfilePersonality({profile, label}: ProfileProps) {
  // Hook — stateful logic
  const [isExpanded, setIsExpanded] = useState(false)

  // Derived value — plain calculation, not a hook
  const mbtiType = label + '-MBTI'

  // Effect — side effect (lifecycle)
  useEffect(() => {
    document.title = `Profile: ${profile.name}`
    return () => {
      document.title = 'App'
    }
  }, [profile.name])

  // Event handler
  const handleToggle = () => setIsExpanded((prev) => !prev)

  // JSX — the UI
  return (
    <div>
      {mbtiType && <span>{mbtiType}</span>}
      <button onClick={handleToggle}>{isExpanded ? 'Show less' : 'Show more'}</button>
    </div>
  )
}
```

---

## The Big Picture

```
JavaScript
├── Everything is an object (or behaves like one)
├── Functions are first-class objects
├── Classes are functions with prototype chains
└── Async model: single-threaded + event loop

      ↓ adds

TypeScript
├── Static type checking at compile time
├── interfaces & types for describing shapes
├── Generics for reusable type-safe code
└── Compiles away — browser sees plain JS

      ↓ builds

React
├── UI = f(state) — components are functions of their data
├── Virtual DOM + diffing = efficient real DOM updates
├── JSX compiles to React.createElement() calls
├── Hooks give functions lifecycle + state (no class needed)
└── Props flow down, state lives inside, context broadcasts
```

The layering is intentional: TypeScript makes JavaScript safer; React gives JavaScript a model for building reactive
UIs. Understanding JS fundamentals (objects, functions, `this`, async) makes React's behaviour — re-renders, closures in
hooks, stale state bugs — much more predictable.
