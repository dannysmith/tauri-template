# Bundle Optimization

Bundle size optimization for Tauri React applications.

## Built-in Optimizations

This app includes several optimizations out of the box:

### Rust Binary (20-30% size reduction)

**File**: `src-tauri/Cargo.toml`

```toml
[profile.release]
codegen-units = 1     # Better LLVM optimization
lto = true            # Link-time optimizations
opt-level = "s"       # Optimize for size
panic = "abort"       # No panic unwinding code
strip = true          # Remove debug symbols
```

### Tauri Build

**File**: `src-tauri/tauri.conf.json`

```json
{
  "build": {
    "removeUnusedCommands": true
  }
}
```

Removes Tauri commands not called from your frontend.

## Analyzing Bundle Size

```bash
npm run build:analyze   # Build and analyze

# Manual analysis
npm run build
du -sh dist/*           # Check output sizes
ls -lah dist/assets/    # Examine chunks
```

## When to Optimize Further

The built-in optimizations are sufficient for most apps. Consider more when:

- Built app > 10MB
- Initial load > 3 seconds
- Large dependencies you don't fully use

## Tree Shaking

### Import Optimization

```typescript
// ❌ Imports entire library
import * as icons from 'lucide-react'

// ✅ Import only what you need
import { Search, Settings, User } from 'lucide-react'

// ❌ Full lodash
import _ from 'lodash'

// ✅ Specific functions
import { debounce } from 'lodash-es'
```

### Date Libraries

```typescript
// ✅ Tree-shakeable imports
import { format } from 'date-fns/format'
import { parseISO } from 'date-fns/parseISO'

// Or use native API
new Intl.DateTimeFormat('en-US').format(date)
```

## Code Splitting

For apps with multiple routes/features:

```typescript
import { lazy, Suspense } from 'react'

const Dashboard = lazy(() => import('./Dashboard'))
const Settings = lazy(() => import('./Settings'))

// In component
<Suspense fallback={<div>Loading...</div>}>
  <Dashboard />
</Suspense>
```

### Manual Chunking (Advanced)

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
        },
      },
    },
  },
})
```

## Tauri-Specific Optimizations

### Remove Unused Plugins

```toml
# src-tauri/Cargo.toml - Comment out unused plugins
[dependencies]
# tauri-plugin-fs = "2"        # Remove if not used
```

### Minimize Capabilities

Only include permissions you use in `src-tauri/capabilities/desktop.json`.

## Common Issues

| Issue                    | Solution                                          |
| ------------------------ | ------------------------------------------------- |
| Large initial bundle     | Implement code splitting                          |
| Duplicate dependencies   | `npm ls react` then `npm dedupe`                  |
| Unused shadcn components | Remove from `src/components/ui/`                  |
| Heavy date library       | Use `date-fns` with tree shaking or native `Intl` |

## Measuring Impact

```bash
# Rust binary size
cd src-tauri && cargo build --release
ls -lah target/release/tauri-app

# Frontend bundle
npm run build && du -sh dist/
```

**Remember**: Measure before optimizing. Don't over-optimize prematurely.
