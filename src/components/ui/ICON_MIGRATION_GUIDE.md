# Icon Migration Guide: Lucide to Tabler (via Iconify)

This project uses **Tabler icons** via Iconify for a consistent enterprise SaaS look.

## Usage

```tsx
import { AppIcon } from '@/components/ui/app-icon';

// Basic usage
<AppIcon name="dashboard" />

// With size and className
<AppIcon name="users" size={20} className="text-primary" />

// With accessibility
<AppIcon name="settings" title="Settings" decorative={false} />
```

## Icon Mapping Reference

### Dashboard & Navigation
| Name | Tabler Icon |
|------|-------------|
| dashboard | tabler:layout-dashboard |
| home | tabler:home |
| menu | tabler:menu-2 |
| search | tabler:search |
| settings | tabler:settings |

### Users & Contacts
| Name | Tabler Icon |
|------|-------------|
| users | tabler:users |
| user | tabler:user |
| user-plus | tabler:user-plus |
| team | tabler:users-group |
| contacts | tabler:address-book |

### Communication
| Name | Tabler Icon |
|------|-------------|
| mail | tabler:mail |
| message | tabler:message |
| phone | tabler:phone |
| send | tabler:send |

### Business & CRM
| Name | Tabler Icon |
|------|-------------|
| pipeline | tabler:git-branch |
| deal | tabler:receipt |
| target | tabler:target |
| trophy | tabler:trophy |
| dollar | tabler:currency-dollar |

### Calendar & Time
| Name | Tabler Icon |
|------|-------------|
| calendar | tabler:calendar |
| clock | tabler:clock |
| schedule | tabler:calendar-time |

### Tasks & Productivity
| Name | Tabler Icon |
|------|-------------|
| task | tabler:checkbox |
| tasks | tabler:list-check |
| check | tabler:check |
| check-circle | tabler:circle-check |

### Charts & Analytics
| Name | Tabler Icon |
|------|-------------|
| chart | tabler:chart-bar |
| trending-up | tabler:trending-up |
| trending-down | tabler:trending-down |
| analytics | tabler:chart-dots |

### AI & Tech
| Name | Tabler Icon |
|------|-------------|
| sparkles | tabler:sparkles |
| ai | tabler:brain |
| magic | tabler:wand |
| bolt | tabler:bolt |

### Actions
| Name | Tabler Icon |
|------|-------------|
| plus | tabler:plus |
| edit | tabler:pencil |
| delete | tabler:trash |
| copy | tabler:copy |
| refresh | tabler:refresh |

### Arrows & Navigation
| Name | Tabler Icon |
|------|-------------|
| arrow-right | tabler:arrow-right |
| arrow-up-right | tabler:arrow-up-right |
| chevron-right | tabler:chevron-right |
| external-link | tabler:external-link |

### Status & Alerts
| Name | Tabler Icon |
|------|-------------|
| success | tabler:circle-check |
| warning | tabler:alert-triangle |
| error | tabler:circle-x |
| info | tabler:info-circle |
| help | tabler:help-circle |
| alert | tabler:alert-circle |

## Migration Checklist

When migrating from lucide-react:

1. Replace import:
   ```tsx
   // Before
   import { Users, Mail, Settings } from 'lucide-react';
   
   // After
   import { AppIcon } from '@/components/ui/app-icon';
   ```

2. Replace component usage:
   ```tsx
   // Before
   <Users className="h-5 w-5 text-primary" />
   
   // After
   <AppIcon name="users" size={20} className="text-primary" />
   ```

3. Size conversion:
   - `h-3 w-3` → `size={12}`
   - `h-4 w-4` → `size={16}`
   - `h-5 w-5` → `size={20}`
   - `h-6 w-6` → `size={24}`

## Benefits

- **Consistent visual language**: All icons from the same family
- **Better performance**: Iconify loads icons on-demand
- **Easier maintenance**: Single source of truth for icon mapping
- **Accessibility**: Built-in aria attributes
