# Stackline Full Stack Assessment — Bug Fixes

---

## Bug 1 — Subcategories fetch ignoring the selected category

**File:** `app/page.tsx`

When I looked at how subcategories were being fetched, I noticed the call to `/api/subcategories` had no query parameters at all. The API actually supports a `category` param to filter results, but it was never being passed. So no matter what category you picked, the dropdown was pulling in every subcategory across the entire dataset which was completely wrong.

**Fix:** I passed the selected category as a query param in the fetch call.

```ts
// Before
fetch(`/api/subcategories`)

// After
fetch(`/api/subcategories?category=${encodeURIComponent(selectedCategory)}`)
```

---

## Bug 2 — Subcategory selection persisting after switching categories

**File:** `app/page.tsx`

This one was a classic stale state issue. If you selected a subcategory under Category A and then switched to Category B, the old subcategory stayed in state. That stale value was then sent to the products API as a filter, which returned zero results since the subcategory doesn't belong to the new category. The `setSelectedSubCategory(undefined)` reset was only in the `else` branch (when category was cleared entirely), not when switching between categories.

**Fix:** I added `setSelectedSubCategory(undefined)` inside the `if (selectedCategory)` branch so it resets every time the category changes.

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

## Bug 3 — `useSearchParams()` used without a Suspense boundary

**File:** `app/product/page.tsx`

Next.js 14+ requires any client component calling `useSearchParams()` to be wrapped in a `<Suspense>` boundary. Without it, the page opts out of static rendering and Next.js throws a build-time error. The entire product page component was calling `useSearchParams()` with no Suspense wrapper anywhere.

**Fix:** I extracted the page content into a separate `ProductPageContent` component and wrapped it with `<Suspense>` in the default export.

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

## Bug 4 — `retailPrice` missing from the `Product` interface in `lib/products.ts`

**File:** `lib/products.ts`

Every product in `sample-products.json` has a `retailPrice` field, but it wasn't defined in the `Product` interface. This meant TypeScript had no awareness of the field anywhere the service was used, so accessing or displaying the price safely wasn't possible.

**Fix:** I added `retailPrice: number` to the interface.

```ts
export interface Product {
  ...
  retailPrice: number;
  ...
}
```

---

## Bug 5 — Home page `Product` interface missing several fields

**File:** `app/page.tsx`

The local `Product` interface on the home page only had 5 fields: `stacklineSku`, `title`, `categoryName`, `subCategoryName`, and `imageUrls`. Fields like `featureBullets`, `retailerSku`, and `retailPrice` were all missing. Since products get serialized via `JSON.stringify` and passed to the detail page, TypeScript had no type-level awareness of those fields on the home page side which is a real gap with `strict: true` in `tsconfig.json`.

**Fix:** I added all three missing fields to match the full shape returned by the API.

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

## Bug 6 — Crash risk on `product.featureBullets.length` with no null guard

**File:** `app/product/page.tsx`

The detail page was accessing `product.featureBullets.length` directly. If `featureBullets` were ever undefined (TypeScript's strict mode can't fully prevent when data comes from `JSON.parse`), this would throw a runtime error and crash the page. The field was non-optional in the interface, but data parsed from a URL query param is inherently unsafe.

**Fix:** I added optional chaining so it fails gracefully instead of crashing.

```tsx
// Before
{product.featureBullets.length > 0 && (

// After
{product.featureBullets?.length > 0 && (
```

---

## Bug 7 — No debounce on the search input

**File:** `app/page.tsx`

Every single keystroke in the search box was triggering a `useEffect` that immediately fired a fetch to `/api/products`. Typing a 10-character query would fire 10 sequential API requests, with each one potentially creating inconsistent render states. Bad for performance, bad for UX.

**Fix:** I introduced a `debouncedSearch` state that only updates 300ms after the user stops typing. The products fetch effect now depends on `debouncedSearch` instead of `search` directly.

```ts
const [debouncedSearch, setDebouncedSearch] = useState("");

useEffect(() => {
  const timer = setTimeout(() => setDebouncedSearch(search), 300);
  return () => clearTimeout(timer);
}, [search]);
```

---

## Bug 8 — `retailPrice` never displayed on the product detail page

**File:** `app/product/page.tsx`

The price was there in the data as it was in `sample-products.json`, it survived the API response, it was serialized into the URL, but it was never actually rendered on screen. The detail page showed the SKU, category, and feature bullets, but no price. For a product detail page, that's a pretty glaring gap.

**Fix:** I added `retailPrice` to the detail page's `Product` interface and rendered it below the SKU.

```tsx
{product.retailPrice && (
  <p className="text-2xl font-semibold mt-2">${product.retailPrice.toFixed(2)}</p>
)}
```

---

## Extra Observation — Hydration mismatch from browser extensions

**File:** `app/layout.tsx`

The app was throwing a React hydration warning in development. After digging into it, the issue was with the browser extensions (Grammarly and a YouTube ads blocker) injecting attributes like `data-gr-ext-installed` directly into the `<html>` and `<body>` tags before React could hydrate. React detected a mismatch between the server-rendered HTML and the client DOM.

This isn't actually a code bug, just the extensions messing with the DOM. The standard fix in Next.js is `suppressHydrationWarning` on both tags.

```tsx
<html lang="en" suppressHydrationWarning>
  <body ... suppressHydrationWarning>
```