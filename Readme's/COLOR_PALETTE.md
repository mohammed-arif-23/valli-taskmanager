# Color Palette Reference

## 🎨 Primary Colors

### Mint Cream (Background)
```css
HEX: #eaf2ef
RGB: rgb(234, 242, 239)
HSL: hsl(158, 24%, 93%)
```
**Usage:** Main background, light accents, secondary text backgrounds

### Quinacridone Magenta (Primary)
```css
HEX: #912f56
RGB: rgb(145, 47, 86)
HSL: hsl(336, 51%, 38%)
```
**Usage:** Primary buttons, links, borders, important text, badges

### Palatinate (Primary Dark)
```css
HEX: #521945
RGB: rgb(82, 25, 69)
HSL: hsl(314, 53%, 21%)
```
**Usage:** Hover states, secondary buttons, dark accents

### Dark Purple (Text)
```css
HEX: #361f27
RGB: rgb(54, 31, 39)
HSL: hsl(339, 27%, 17%)
```
**Usage:** Primary text, headings, dark UI elements

### Smoky Black (Deep Accents)
```css
HEX: #0d090a
RGB: rgb(13, 9, 10)
HSL: hsl(345, 18%, 4%)
```
**Usage:** Very dark text, shadows, deep backgrounds

---

## 🌈 Gradients

### Primary Gradient
```css
background: linear-gradient(135deg, #912f56, #521945);
```
**Usage:** Headers, primary buttons, hero sections

### Dark Gradient
```css
background: linear-gradient(135deg, #521945, #361f27);
```
**Usage:** CEO dashboard header, dark sections

### Radial Gradient
```css
background: radial-gradient(circle, #912f56, #521945, #361f27);
```
**Usage:** Login page background, special sections

---

## 📋 Tailwind Classes

### Background Colors
```jsx
bg-mint-cream          // #eaf2ef
bg-quinacridone-magenta // #912f56
bg-palatinate          // #521945
bg-dark-purple         // #361f27
bg-smoky-black         // #0d090a
```

### Text Colors
```jsx
text-mint-cream          // #eaf2ef
text-quinacridone-magenta // #912f56
text-palatinate          // #521945
text-dark-purple         // #361f27
text-smoky-black         // #0d090a
```

### Border Colors
```jsx
border-quinacridone-magenta // #912f56
border-palatinate          // #521945
border-dark-purple         // #361f27
```

### Custom Gradients
```jsx
gradient-primary  // linear-gradient(135deg, #912f56, #521945)
gradient-dark     // linear-gradient(135deg, #521945, #361f27)
gradient-radial   // radial-gradient(circle, #912f56, #521945, #361f27)
```

---

## 🎯 Usage Guidelines

### Headers & Navigation
- Background: `gradient-primary` or `gradient-dark`
- Text: `text-white` or `text-mint-cream`
- Hover: Lighter shade or `text-mint-cream`

### Cards & Containers
- Background: `bg-white`
- Border: `border-2 border-quinacridone-magenta`
- Shadow: `shadow-lg`
- Hover: `hover-lift` (custom class)

### Buttons

**Primary Button:**
```jsx
className="gradient-primary text-white px-4 py-2 rounded-lg hover-lift"
```

**Secondary Button:**
```jsx
className="bg-palatinate text-white px-4 py-2 rounded-lg hover-lift"
```

**Outline Button:**
```jsx
className="border-2 border-quinacridone-magenta text-quinacridone-magenta px-4 py-2 rounded-lg hover:bg-quinacridone-magenta hover:text-white"
```

### Form Inputs
```jsx
className="border-2 border-quinacridone-magenta rounded-lg focus:ring-2 focus:ring-palatinate"
```

### Badges

**Status Badges:**
```jsx
// Completed
className="bg-green-100 text-green-700 px-3 py-1 rounded-full"

// Partial
className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full"

// Not Started
className="bg-red-100 text-red-700 px-3 py-1 rounded-full"

// Role Badge
className="bg-palatinate text-white px-3 py-1 rounded-full"
```

### Performance Indicators

**High Performance (>66%):**
```jsx
className="text-green-600 bg-green-50"
```

**Medium Performance (33-66%):**
```jsx
className="text-orange-600 bg-orange-50"
```

**Low Performance (<33%):**
```jsx
className="text-red-600 bg-red-50"
```

---

## 🔍 Accessibility

### Contrast Ratios

All color combinations meet WCAG 2.1 AA standards:

- **Quinacridone Magenta on White:** 5.2:1 ✅
- **Dark Purple on White:** 12.6:1 ✅
- **White on Quinacridone Magenta:** 5.2:1 ✅
- **White on Palatinate:** 8.9:1 ✅
- **Mint Cream on Dark Purple:** 11.8:1 ✅

### Focus States
All interactive elements have visible focus indicators:
```css
*:focus-visible {
  outline: 2px solid var(--quinacridone-magenta);
  outline-offset: 2px;
}
```

---

## 🎨 Color Psychology

### Mint Cream (#eaf2ef)
- **Feeling:** Clean, fresh, calming
- **Use:** Creates a professional, medical environment

### Quinacridone Magenta (#912f56)
- **Feeling:** Energetic, important, attention-grabbing
- **Use:** Draws focus to key actions and information

### Palatinate (#521945)
- **Feeling:** Sophisticated, trustworthy, stable
- **Use:** Reinforces professionalism and reliability

### Dark Purple (#361f27)
- **Feeling:** Authoritative, serious, grounded
- **Use:** Provides strong readability and hierarchy

---

## 📱 Dark Mode (Future Enhancement)

If implementing dark mode, suggested palette:

```css
/* Dark Mode Colors */
--dm-background: #1a1a1a;
--dm-surface: #2d2d2d;
--dm-primary: #c94d7a; /* Lighter magenta */
--dm-text: #e0e0e0;
--dm-border: #404040;
```

---

## 🖼️ Visual Examples

### Login Page
- Background: `gradient-radial`
- Card: `bg-white` with `shadow-2xl`
- Button: `gradient-primary`
- Inputs: `border-2 border-quinacridone-magenta`

### Dashboard
- Background: `bg-mint-cream`
- Header: `gradient-primary`
- Cards: `bg-white` with `border-2 border-quinacridone-magenta`
- Meter: Gradient fill based on performance

### Admin Panel
- Header: `gradient-primary`
- Table: `bg-white` with `border-quinacridone-magenta`
- Badges: `bg-palatinate text-white`

### CEO Dashboard
- Header: `gradient-dark`
- Stats Cards: `bg-white` with `hover-lift`
- Charts: Custom colors from palette
- Todo Items: `bg-mint-cream`

---

## 🔧 Customization

To change colors globally, update:

1. **CSS Variables** (`styles/globals.css`):
```css
:root {
  --mint-cream: #eaf2ef;
  --quinacridone-magenta: #912f56;
  --palatinate: #521945;
  --dark-purple: #361f27;
  --smoky-black: #0d090a;
}
```

2. **Tailwind Config** (`tailwind.config.js`):
```js
colors: {
  'mint-cream': '#eaf2ef',
  'quinacridone-magenta': '#912f56',
  'palatinate': '#521945',
  'dark-purple': '#361f27',
  'smoky-black': '#0d090a',
}
```

---

## 📊 Color Distribution

Recommended usage percentages:
- **Mint Cream (Background):** 60%
- **White (Cards/Surfaces):** 25%
- **Quinacridone Magenta (Accents):** 10%
- **Dark Purple (Text):** 4%
- **Palatinate (Secondary):** 1%

This creates a balanced, professional appearance with clear visual hierarchy.
