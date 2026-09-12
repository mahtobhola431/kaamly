# The data layer

Every screen in the app reads through the functions in this folder. None of them import
from `src/data/` directly.

Right now these functions filter, sort and paginate the static dataset in `src/data/`.
They are all `async` and return exactly the shapes the API will return, so wiring the real
backend is a change **inside these files only** — no page, no component and no type
changes anywhere else.

For example, when `GET /workers` is live, this:

```ts
export async function searchWorkers(params: WorkerSearchParams): Promise<WorkerSearchResult> {
  // ... filter the static array
}
```

becomes this:

```ts
export async function searchWorkers(params: WorkerSearchParams): Promise<WorkerSearchResult> {
  return api.list<WorkerProfile>('/workers', { query: params });
}
```

Rules while the app is on static data:

1. Components never import from `src/data/`. They call a function from here.
2. These functions never return a shape the API cannot return.
3. Filtering and sorting is implemented for real, so the UI is exercised the way it will
   behave in production — an empty result really is empty, and pagination really paginates.
