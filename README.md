# Stackline Full Stack Assignment

## Getting Started

```bash
yarn install
yarn dev
```

---

## Bug Fixes

### Bug 1 — Subcategories fetch ignoring the selected category

**File:** `app/page.tsx`

When a category was selected, the app fetched subcategories from `/api/subcategories` with no query parameters. The API supports a `category` param to filter subcategories, but it was never passed. This meant the subcategory dropdown always showed all subcategories across every category, which was completely wrong behavior.

**Fix:** Passed the selected category as a query param in the fetch call.

```ts
// Before
fetch(`/api/subcategories`)

// After
fetch(`/api/subcategories?category=${encodeURIComponent(selectedCategory)}`)
```

---

### Bug 2 — Subcategory selection persisting after switching categories

**File:** `app/page.tsx`

When a user selected a subcategory under Category A, then switched to Category B, the previously selected subcategory remained in state. That stale subcategory was then sent to the products API as a filter, resulting in no products being returned (since the subcategory doesn't belong to the new category). The `setSelectedSubCategory(undefined)` reset only existed in the `else` branch (when category was cleared entirely), not when switching between categories.

**Fix:** Added `setSelectedSubCategory(undefined)` inside the `if (selectedCategory)` branch, so it resets every time the category changes.

```ts
useEffect(() => {
  if (selectedCategory) {
    setSelectedSubCategory(undefined); // reset before fetching new subcategories
    fetch(`/api/subcategories?category=${encodeURIComponent(selectedCategory)}`)
      ...
  } else {
    setSubCategories([]);
    setSelectedSubCategory(undefined);
  }
}, [selectedCategory]);
```

---

### Bug 3 — `useSearchParams()` used without a Suspense boundary

**File:** `app/product/page.tsx`

Next.js 14+ requires any client component that calls `useSearchParams()` to be wrapped in a `<Suspense>` boundary. Without it, the page opts out of static rendering and Next.js throws a build-time error. The entire product page component was directly calling `useSearchParams()` with no Suspense wrapper.

**Fix:** Extracted the page content into a separate `ProductPageContent` component and wrapped it with `<Suspense>` in the default export.

```tsx
function ProductPageContent() {
  const searchParams = useSearchParams();
  // ... rest of the page
}

export default function ProductPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProductPageContent />
    </Suspense>
  );
}
```

---

### Bug 4 — `retailPrice` missing from the `Product` interface in `lib/products.ts`

**File:** `lib/products.ts`

The `Product` interface didn't include `retailPrice`, even though every product in `sample-products.json` has it. This meant TypeScript had no knowledge of the field anywhere the service was used, making it impossible to access or display the price safely.

**Fix:** Added `retailPrice: number` to the interface.

```ts
export interface Product {
  ...
  retailPrice: number;
  ...
}
```

---

### Bug 5 — Home page `Product` interface missing several fields

**File:** `app/page.tsx`

The local `Product` interface in the home page only defined 5 fields: `stacklineSku`, `title`, `categoryName`, `subCategoryName`, and `imageUrls`. Fields like `featureBullets`, `retailerSku`, and `retailPrice` were absent. Since products are serialized via `JSON.stringify` and passed to the detail page, TypeScript had no type-level awareness of these fields on the home page side. With `strict: true` in `tsconfig.json`, this is a real type gap.

**Fix:** Added all three missing fields to the home page `Product` interface to match the full shape returned by the API.

```ts
interface Product {
  stacklineSku: string;
  title: string;
  categoryName: string;
  subCategoryName: string;
  imageUrls: string[];
  featureBullets: string[];
  retailerSku: string;
  retailPrice: number;
}
```

---

### Bug 6 — Crash risk on `product.featureBullets.length` with no null guard

**File:** `app/product/page.tsx`

The detail page accessed `product.featureBullets.length` directly. If `featureBullets` were ever undefined (which TypeScript's strict mode can't fully prevent when data comes from `JSON.parse`), this would throw a runtime error and crash the page. The field was non-optional in the interface, but data parsed from a URL query param is inherently unsafe.

**Fix:** Added optional chaining so it fails gracefully.

```tsx
// Before
{product.featureBullets.length > 0 && (

// After
{product.featureBullets?.length > 0 && (
```

---

### Bug 7 — No debounce on the search input

**File:** `app/page.tsx`

Every single keystroke in the search box triggered a `useEffect` that immediately fired a fetch to `/api/products`. Typing a 10-character query would send 10 sequential API requests, with each one potentially cancelling the previous render in inconsistent ways. This is a performance and UX problem.

**Fix:** Introduced a `debouncedSearch` state that only updates 300ms after the user stops typing. The products fetch effect depends on `debouncedSearch` instead of `search`.

```ts
const [debouncedSearch, setDebouncedSearch] = useState("");

useEffect(() => {
  const timer = setTimeout(() => setDebouncedSearch(search), 300);
  return () => clearTimeout(timer);
}, [search]);
```

---

### Bug 8 — `retailPrice` never displayed on the product detail page

**File:** `app/product/page.tsx`

The price data was present in every product from `sample-products.json`, survived the API response, and was serialized into the URL — but it was never rendered anywhere. The detail page showed the SKU, category, and features, but no price. This is a functional gap on what is supposed to be a product detail page.

**Fix:** Added `retailPrice` to the product detail page's `Product` interface and rendered it below the SKU.

```tsx
{product.retailPrice && (
  <p className="text-2xl font-semibold mt-2">${product.retailPrice.toFixed(2)}</p>
)}
```

---

### Bonus — Hydration mismatch from browser extensions

**File:** `app/layout.tsx`

The app was throwing a React hydration warning because browser extensions (Grammarly, a YouTube ads blocker) were injecting attributes like `data-gr-ext-installed` and `speedupyoutubeads` directly into the `<html>` and `<body>` tags before React could hydrate. React detected a mismatch between the server-rendered HTML and the client DOM.

This isn't a code bug — it's the extensions messing with the DOM. The standard fix in Next.js is `suppressHydrationWarning` on both tags.

```tsx
<html lang="en" suppressHydrationWarning>
  <body ... suppressHydrationWarning>
```
