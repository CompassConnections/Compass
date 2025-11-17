# Next.js

But how does page rendering work with Next.js?

### Terminology

- SSR: server-side rendering (Edge or Lambda)
- SSG: static site generation
  - ISR: incremental static regeneration

### DOM

Document Object Model: The in-browser tree of HTML elements representing the page.

### Client

The user's environment, the browser. The front-end is the code running in that environment.
On Compass, it can be any browser (Chrome, Firefox, etc.).

### Server

Any remote infrastructure, i.e., not running in the user's environment / OS. The back-end is the code that runs in that environment.
On Compass, there are two servers:
- Web server: hosted on Vercel at `compassmeet.com`, which mostly provides the web pages to the client. That's the server we are talking about in the rest of the document.
- Core server: hosted on Google Cloud at `api.compassmeet.com`, a server with more resources and permissions to update the database. It's in charge of any operation related to non-web data (i.e., no HTML or CSS) such as accounts, profiles, messages, and votes.

---
### React

React is a client-side UI library.  
Its core job: create and update a **virtual DOM**, then reconcile that with the **real DOM** in the browser.  
React itself **does not** define routing, data fetching conventions, or server rendering (it allows it, but doesn’t provide a full system).

**Key behavior:**

- React components run on the **client** by default.
- React can be rendered on the **server** (via frameworks like Next.js), but this requires additional tooling.
- React uses a Virtual DOM to compute minimal changes, then applies them to the real DOM.

---
### Hydration

When a framework pre-renders HTML on the server, the browser receives static markup (HTML, JS and CSS). React then runs on the client and attaches event listeners and internal state to that markup.  
Hydration bridges static HTML (build time) and interactive React behavior (run time).

You only need hydration if you have server-rendered HTML that must become interactive.

---

React re-renders a component **whenever its state or props change**. Hooks don’t cause re-renders by themselves — **their returned values changing** does.

### React re-renders when:

1. **A state updater runs**
    - `setState(...)` from `useState`
    - `dispatch(...)` from `useReducer`
        
2. **Parent props change**
    - Any parent re-render that produces new props for the child
    
3. **Context value changes**
    - When a context provider updates its value, all consumers re-render
        
4. **External stores change** (in React 18+ “use sync external store” pattern)
    - `useSyncExternalStore`
    - Custom store hooks subscribing to something (auth store, Zustand, Redux, etc.)
        
5. **Server → Client hydration mismatch forces a re-render**
    - Rare; usually an error condition

Re-rendering **does NOT happen** simply because:

- You called the component function manually
- A hook _exists_
- A ref changed (`useRef`)
- An effect ran (`useEffect`)
- A variable changed outside React state

---

# Difference Between Re-rendering and Hydration

## Hydration

- Happens **once**, right after the server-rendered HTML loads in the browser.
- React attaches event listeners and internal state structures to the existing DOM.
- Restores component tree in memory but does _not_ replace DOM unless mismatched.

Hydration is **startup initialization**.

## Re-rendering

- Happens **after hydration**, repeatedly, whenever React thinks the UI must update.
- Reconciliation compares new virtual DOM to old and mutates the real DOM minimally.

### Important distinction:

- Variables inside components do **not** persist across renders.
- Only state, context, memoized values, refs, and hooks preserve information.


---
### Next.js: What it adds

Next.js is a React framework that controls **where** code runs (server vs client), **when** it runs (build vs request time), and how HTML is generated. It adds routing, rendering strategies, data fetching conventions, and server infrastructure.

Next.js introduces:

- Server Components vs Client Components
- Route-based rendering
- Built-in server rendering pipelines
- Build-time optimizations

---

### Client vs Server in Next.js

**Server Components:**

- Render **on the server**, never shipped to the client.
- Can safely access databases, filesystem, secrets.
- Output is serialized to HTML + a data format React uses to assemble the UI.

**Client Components (`"use client"`):**

- Render **in the browser**.
- Shipped to the client as JS bundles.
- Needed for interactivity (state, events, effects).

Notes:

- You can mix Server and Client components; the boundary matters for bundle size and where code executes.
- Only Client Components hydrate.

---

### Build-Time vs Run-Time

#### Build-Time (during `next build`)

- The compiler analyzes the app, identifies server boundaries, optimizes routing.
- Static pages (SSG) are rendered to final HTML.
- Partial data may be pre-fetched if using static data functions.
- Bundles for client components are built.

#### Run-Time

- Server Components for SSR are executed on each request.
- Serverless or edge functions run as needed.
- Client Components hydrate and run effects in the browser.

---

### Rendering Strategies

#### SSR (Server-Side Rendering)

- Used a webpage or API endpoint (to get server-side data like build ID).
- Generated on **every request**.
- Good for dynamic data that must be fresh.
- Initial load: server renders HTML → client hydrates.
- Runs server logic each time a user requests the page.

Can be dynamic or edge.
###### λ (Dynamic)

- **Server-rendered on demand using Node.js**
- Each request hits a Node.js server (or serverless function)
- Full access to Node APIs, filesystem, secrets, DB connections
- Typical use: **SSR pages with dynamic data** not suitable for edge
- Latency depends on server location

###### ℇ (Edge Runtime)

- **Server-rendered on demand using Edge Runtime**
- Runs on global edge nodes (CDN locations)
- Faster response due to geographic proximity
- Limited APIs: no filesystem, limited Node.js modules, mostly fetch and standard web APIs
- Typical use: **low-latency SSR or ISR at the edge**

#### SSG (Static Site Generation)

- HTML is generated **at build time**.
- Served as static files.
- Zero server cost at request time.
- Best for data that changes rarely.

#### ISR (Incremental Static Regeneration)

- A hybrid of SSG + scheduled revalidation.
- Page is generated at build, then regenerated **in the background** after a specified interval.
- Allows static pages with reasonably fresh content without full rebuilds.

Example behavior:

- First request after the revalidation window triggers a background regeneration.
- Users keep seeing the old page until the new one is ready, then updates swap in.

There are components that:

- Run once **on the server** to generate HTML (SSR phase)
- Then run again **in the browser** for hydration (client phase)

---

### What Runs Where: Quick Table

| Task / Code                | Build Time | Server Run Time  | Client Run Time |
| -------------------------- | ---------- | ---------------- | --------------- |
| Pre-rendering SSG pages    | Yes        | No               | No              |
| ISR regeneration           | No         | Yes (background) | No              |
| SSR rendering              | No         | Yes              | No              |
| React event handling       | No         | No               | Yes             |
| `useEffect`                | No         | No               | Yes             |
| Server Component rendering | No         | Yes              | No              |
| Client Component hydration | No         | No               | Yes             |

---

# 1. Component Type Detection

## A. **Client Component (App Router)**

A component is a **Client Component** if:

- The file begins with `"use client"`, or
- It uses **client-only hooks** (`useState`, `useEffect`, `useRef`, etc.), or
- It references **browser APIs** (`window`, `document`, `localStorage`, etc.), or
- It uses **client navigation** (`Router.replace`, `useRouter`), or
- It uses **interactive JSX handlers**: `onClick`, `onSubmit`, etc.

**Implications:**

- Runs **only in browser**
- **Hydrates** on the client
- **No SSR** of its data
- May receive HTML shell from server, but logic/data loads on client

Client Components = browser-only, hydrated, interactive.

---

## B. **Server Component (App Router)**

A component is a **Server Component** if:

- No `"use client"`
- No client hooks
- No browser APIs
- No interactive handlers
- Uses server-only capabilities (DB queries, file system, server fetch, secrets)

**Implications:**

- Runs on **server at build time** (if static) and/or **server at request time**
- **No hydration** for the server part
- Can output HTML directly
- Can trigger SSG / SSR / ISR depending on cache mode or revalidate

---

# 3. Rendering Strategy (Pages Router Rules)

In the **Pages Router**, rendering is dictated entirely by which data-fetching function you export.

Below are the functions and exactly what they imply.

---

# 4. `getServerSideProps` — What It Does and What It Implies

```js
export async function getServerSideProps(context) { ... }
```

### What it does:

- Runs **on the server for every request**.
- Provides props to the page component.
- Has access to:
    - database
    - filesystem
    - environment variables
    - cookies, headers, auth context

### What it implies:

- The page is **SSR** (Server-Side Rendered).
- HTML is generated **on each request**.
- **No SSG** or ISR possible.
- The page is never static.

### Rendering outcome:

- **SSR HTML** + hydration for any client-side React in the page.

---

# 5. `getStaticProps` — What It Does and What It Implies

```js
export async function getStaticProps(context) { ... }
```

### What it does:

- Runs **once at build time**.
- Fetches data needed for static generation.
- Provides props to the component.

### What it implies:

- The page is **SSG** (Static Site Generated).
- The output is static HTML + static JSON.
- Zero server rendering at request time.

### Rendering outcome:

- **Purely static HTML** served from CDN.
- Hydration if component includes client logic (but no server execution).

### When ISR occurs:

- If you return `{ revalidate: N }` from `getStaticProps`, the page becomes **ISR**.

Example ISR config:

```js
export async function getStaticProps() {
  return {
    props: { ... },
    revalidate: 60 // seconds
  }
}
```

---

# 6. `getStaticPaths` — What It Does and What It Implies

Used for **dynamic SSG pages** (e.g., `[id].js`).

```js
export async function getStaticPaths() { ... }
```

### What it does:

- Runs **at build time**.
- Tells Next.js which dynamic routes to pre-render.
- Works together with `getStaticProps`.

### What it implies:

- Page is **SSG** or **ISR** depending on `getStaticProps`.
- The routing structure is fixed at build time unless fallback mode is used.

### Fallback modes define run-time:

- `fallback: false` → Only pages listed exist; 404 for others
- `fallback: true` → Generate pages at runtime, then cache them as static
- `fallback: "blocking"` → Block until server generates static page

Fallback generation effectively behaves like **ISR** for pages not pre-rendered.

---

# 7. Summary Table (Pages Router)

| Export               | When It Runs         | Rendering Model                        | Triggered By                |
| -------------------- | -------------------- | -------------------------------------- | --------------------------- |
| `getServerSideProps` | On **every request** | **SSR**                                | Always dynamic              |
| `getStaticProps`     | **Build time**       | **SSG** (or **ISR** with `revalidate`) | No runtime server           |
| `getStaticPaths`     | **Build time**       | **SSG** for dynamic routes             | Works with `getStaticProps` |

---

# 8. Combining Rules: How to Infer Rendering from Code

### If you see `getServerSideProps`:

- The page is always **SSR**
- Component receives props from server
- Component itself is a normal React component rendered server-side then hydrated
- No client data loading unless the component explicitly fetches in browser

### If you see `getStaticProps`:

- The page is **SSG** or **ISR**
- Only runs again during revalidation
- Component is static unless you add client-side fetching

### If you see `getStaticPaths`:

- The file uses dynamic **SSG** or **ISR**
- Builds static versions of dynamic routes

### If you see `"use client"`:

- Entire file is **client-rendered**
- Data in this component does **not** SSR
- Even if the page uses SSG/SSR, this component runs only in browser

### If you see hooks (`useState`, `useEffect`, etc.):

- The component must be **client-side**
- It must hydrate
- It cannot participate in server rendering logic
- SSG/SSR/ISR still occurs for the page shell, but the logic inside this component runs only in browser

### If you see server-side code (DB queries, secrets):

- Component must be **Server Component** (App Router) or handled inside `getServerSideProps`/`getStaticProps`

---

### How to Think About It When Architecting

1. **Default to Server Components** whenever no browser interactivity is needed.  
    Reduces bundle size and avoids unnecessary hydration.
    
2. **Use Client Components** only where interaction happens (buttons, forms, animations, local state).
    
3. **Choose a rendering model based on data volatility**:
    - Rarely changing: SSG
    - Somewhat changing and OK with slightly stale: ISR
    - Must always be fresh or personalized: SSR
        
4. **Remember:** Hydration cost scales with the amount of Client Components. Keep them narrow.
    
5. **Consider caching**:  
    Next.js can automatically cache server component results; knowing what is cached impacts performance heavily.


### Backend vs Frontend on Next.js

| Term         | True Meaning                                                             | Might Confuse People Because…                                               |
| ------------ | ------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| **Frontend** | Code that executes in the user’s environment (browser, WebView)          | SSR code _belongs to frontend logic_ but executes on server                 |
| **Backend**  | Code that executes on remote infrastructure (server, VM, cloud function) | Some “backend-like” behavior can occur in browser via caching or local APIs |

### Downtime

To simulate downtime **you need the error to happen at runtime, not at build time**. That means the page must be **server-rendered**, not statically generated.