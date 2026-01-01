# Mobile-First Design Guidelines

## ALWAYS Apply These Rules

All UI components, pages, dialogs, and forms in this project MUST follow mobile-first responsive design principles.

## Core Principles

### 1. Start Small, Scale Up
- Design for mobile (320px-480px) first
- Add breakpoints for larger screens using `sm:`, `md:`, `lg:`, `xl:`
- Never design desktop-first and try to shrink down

### 2. Spacing & Sizing
- Use smaller values for mobile, larger for desktop
- Example: `p-3 sm:p-4 md:p-6` (not `p-6 sm:p-4`)
- Example: `space-y-3 sm:space-y-4`
- Example: `h-9 sm:h-10` for inputs/buttons

### 3. Typography
- Mobile: `text-xs`, `text-sm`, `text-base`
- Desktop: Scale up with `sm:text-sm`, `sm:text-base`, `sm:text-lg`
- Labels: `text-xs font-medium`

### 4. Dialogs & Modals
- Width: `w-[calc(100%-2rem)] max-w-[420px] sm:max-w-[480px]`
- Padding: `p-4 sm:p-6`
- Always add `rounded-xl` for modern look
- Content should not overflow on mobile

### 5. Forms
- Stack fields vertically on mobile
- Use `flex-col sm:flex-row` for button groups
- Inputs: `h-9 sm:h-10 text-sm`
- Tight spacing: `space-y-1.5` for label-to-input

### 6. Grids & Layouts
- Single column on mobile: `grid grid-cols-1`
- Expand on larger screens: `sm:grid-cols-2 lg:grid-cols-3`
- Use `gap-3 sm:gap-4` for grid gaps

### 7. Cards
- Padding: `p-3 sm:p-4`
- Compact content on mobile
- Icons: `w-4 h-4` or `w-5 h-5` (not larger)

### 8. Tables
- Convert to card/list view on mobile when possible
- Use horizontal scroll only as last resort
- Hide non-essential columns on mobile

### 9. Buttons
- Full width on mobile: `w-full sm:w-auto`
- Stack vertically: `flex-col-reverse sm:flex-row`
- Height: `h-9 sm:h-10`

### 10. Touch Targets
- Minimum 44px touch target for interactive elements
- Adequate spacing between clickable items

## Example Pattern

```tsx
// ✅ CORRECT - Mobile First
<div className="p-3 sm:p-4 md:p-6">
  <h1 className="text-lg sm:text-xl font-semibold">Title</h1>
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
    <Input className="h-9 sm:h-10 text-sm" />
  </div>
  <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
    <Button className="w-full sm:flex-1 h-9 sm:h-10">Cancel</Button>
    <Button className="w-full sm:flex-1 h-9 sm:h-10">Submit</Button>
  </div>
</div>

// ❌ WRONG - Desktop First
<div className="p-6 sm:p-4">
  <h1 className="text-xl sm:text-lg">Title</h1>
  <div className="grid grid-cols-2 sm:grid-cols-1">
    <Input className="h-10" />
  </div>
</div>
```

## Dialog Template

```tsx
<DialogContent className="w-[calc(100%-2rem)] max-w-[420px] sm:max-w-[480px] p-4 sm:p-6 rounded-xl">
  <DialogHeader className="space-y-1 pb-2">
    <DialogTitle className="text-base sm:text-lg">Title</DialogTitle>
    <DialogDescription className="text-xs sm:text-sm">Description</DialogDescription>
  </DialogHeader>
  {/* Content */}
</DialogContent>
```

## Remember
- Test on 375px width (iPhone SE) as baseline
- Ensure no horizontal overflow
- Touch-friendly spacing
- Readable text without zooming
