# Wedding Registry V2 - Comprehensive Improvement Specification

**Project:** Sam & Beatrice Wedding Registry
**Timeline:** Before invites go out
**Status:** Specification Phase
**Last Updated:** 30 December 2025

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [UI/UX Enhancements](#uiux-enhancements)
3. [New Features](#new-features)
4. [Mobile Experience](#mobile-experience)
5. [Registry Item Guidelines](#registry-item-guidelines)
6. [Technical Implementation Notes](#technical-implementation-notes)
7. [Priority Matrix](#priority-matrix)

---

## Executive Summary

This specification outlines improvements to the wedding registry across four key areas:

| Area | Key Changes |
|------|-------------|
| **UI/UX** | Finish coded features, visual refresh (keep navy), micro-interactions, accessibility |
| **Features** | Live price tracking, thank you messages, notifications, group gifting enhancements |
| **Mobile** | Bottom navigation, performance optimization |
| **Content** | Price point strategy, compelling descriptions, quality photos |

**Critical Constraint:** Navy is the wedding colour - all visual changes must preserve and complement the navy theme.

---

## UI/UX Enhancements

### 1. Complete Existing Coded Features

The following features have JavaScript in `enhancements.js` but need HTML/CSS integration:

#### 1.1 Parallax Scrolling Effect
- **Status:** JS ready, CSS needed
- **Location:** Hero section and section backgrounds
- **Implementation:**
  ```css
  .parallax-section {
    background-attachment: fixed;
    background-position: center;
    background-repeat: no-repeat;
    background-size: cover;
  }
  ```
- **Acceptance Criteria:**
  - Smooth parallax on desktop (disable on mobile for performance)
  - Subtle effect that doesn't distract from content
  - Works with navy colour scheme

#### 1.2 Mobile Bottom Navigation
- **Status:** JS ready in `enhancements.js`
- **Sections to include:** Home, Registry, RSVP, Gallery, FAQ
- **Design:**
  - Fixed to bottom of viewport
  - Navy background with white/gold icons
  - Active state indicator
  - Hide on scroll down, show on scroll up
- **Implementation Details:**
  ```html
  <nav class="mobile-bottom-nav">
    <a href="#hero" class="nav-item active">
      <i class="fas fa-home"></i>
      <span>Home</span>
    </a>
    <!-- ... other items -->
  </nav>
  ```

#### 1.3 Featured Items Section
- **Purpose:** Highlight priority items or couple's favorites
- **Placement:** Above main registry grid
- **Display:** Horizontal scrollable carousel on mobile, 3-column grid on desktop
- **Criteria for featuring:** Items marked as priority or manually selected

#### 1.4 "Almost Funded" Section
- **Purpose:** Encourage completion of nearly-funded items
- **Criteria:** Items at 70%+ funding
- **Display:** Similar to featured items, with progress bars prominently shown
- **Copy:** "Help us complete these!" or "So close!"

### 2. Visual Refresh (Navy Theme)

**Maintain:**
- Primary navy: `#1a365d` (current)
- Accent gold/beige: existing palette

**Enhance:**
- Add subtle gradients to navy sections
- Improve contrast for readability
- Modernize button styles (rounded corners, subtle shadows)
- Refine typography hierarchy

**Colour Palette Expansion:**
```css
:root {
  --navy-dark: #0f2744;
  --navy-primary: #1a365d;
  --navy-light: #2d4a6f;
  --gold-accent: #d4a574;
  --cream-bg: #faf8f5;
  --text-primary: #1a1a1a;
  --text-secondary: #4a4a4a;
  --success-green: #48bb78;
  --error-red: #e53e3e;
}
```

### 3. Micro-Interactions

#### 3.1 Button Animations
- Subtle scale on hover (1.02)
- Ripple effect on click
- Loading spinner inside button during async operations

#### 3.2 Loading States
- Skeleton loaders for registry items during fetch
- Shimmer effect on loading cards
- Progress indicators for contributions

#### 3.3 Toast Notifications
- Position: Bottom-right on desktop, bottom-center on mobile
- Types: Success (green), Error (red), Info (navy)
- Auto-dismiss after 4 seconds
- Swipe to dismiss on mobile

#### 3.4 Haptic Feedback (Mobile)
- Light haptic on button taps
- Success haptic on contribution completion
- Subtle haptic on navigation

#### 3.5 Celebration Animations
- Confetti burst when item reaches 100% funded
- Gentle pulse animation on newly funded items
- Success checkmark animation after contribution

### 4. Accessibility Improvements

#### 4.1 Keyboard Navigation
- All interactive elements focusable
- Visible focus indicators (navy outline)
- Skip-to-content link
- Logical tab order

#### 4.2 Screen Reader Support
- ARIA labels on all buttons and links
- ARIA live regions for dynamic content (contribution updates)
- Alt text on all images
- Form labels properly associated

#### 4.3 Visual Accessibility
- Minimum contrast ratio 4.5:1 for text
- Don't rely on colour alone for information
- Resize-friendly (works at 200% zoom)
- Reduced motion option respecting `prefers-reduced-motion`

---

## New Features

### 1. Live Price Tracking from NZ Retailers

**Overview:** Automatically fetch and display current prices from linked NZ retailers.

**Supported Retailers:**
- Briscoes (primary)
- Farmers (primary)
- Noel Leeming
- Other NZ retailers as needed

**Technical Approach:**
1. **Server-side scraping** (to avoid CORS issues)
2. **Caching:** Cache prices for 24 hours to reduce requests
3. **Fallback:** Show "Price may vary" if scraping fails

**Database Changes:**
```sql
ALTER TABLE registry_items ADD COLUMN scraped_price DECIMAL(10,2);
ALTER TABLE registry_items ADD COLUMN price_last_updated TIMESTAMP;
ALTER TABLE registry_items ADD COLUMN price_source VARCHAR(100);
```

**API Endpoint:**
```
POST /api/admin/refresh-prices
GET /api/items/:id/current-price
```

**UI Display:**
- Show retailer price next to target amount
- "Current price at Briscoes: $89.99"
- Visual indicator if price has changed significantly

**Implementation Notes:**
- Use Puppeteer or Cheerio for scraping
- Implement rate limiting to avoid being blocked
- Consider using a price tracking service as backup

### 2. Manual Thank You Message System

**Overview:** Generate personalized thank you message drafts for each contributor.

**Flow:**
1. Contribution comes in
2. System generates draft thank you message
3. Admin reviews in dashboard
4. Admin can edit and send manually (copy to clipboard or email)

**Draft Template (Personal Touch Focus):**
```
Dear [Guest Name],

Thank you so much for your generous contribution toward our [Item Name].

[If message left: "Your lovely message - '[their message]' - truly touched our hearts."]

We're so grateful to have you as part of our journey, and can't wait to celebrate with you on March 14th, 2026.

With love,
Sam & Beatrice
```

**Database Changes:**
```sql
CREATE TABLE thank_you_messages (
  id SERIAL PRIMARY KEY,
  contribution_id INTEGER REFERENCES contributions(id),
  guest_name VARCHAR(255),
  guest_email VARCHAR(255),
  item_name VARCHAR(255),
  contribution_amount DECIMAL(10,2),
  guest_message TEXT,
  draft_message TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- pending, sent, skipped
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Admin UI:**
- Tab in admin dashboard: "Thank You Messages"
- List of pending thank yous with draft preview
- Edit button to customize
- "Copy to Clipboard" button
- "Mark as Sent" button
- Bulk actions for efficiency

### 3. Notification System

#### 3.1 Admin Dashboard Live Feed
- Real-time contribution feed on admin page
- WebSocket or Server-Sent Events (SSE)
- Shows: Guest name, item, amount, time
- Sound notification option (toggleable)

**Implementation:**
```javascript
// Server-side: SSE endpoint
app.get('/api/admin/live-feed', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  // Send events when contributions come in
});
```

#### 3.2 Email Alerts
- Send email to Sam & Beatrice when contribution received
- Email includes: Guest name, item, amount, message (if any)
- Configurable: On/off toggle in admin settings

**Email Service Options:**
- Resend (recommended - simple API)
- SendGrid
- Postmark

**Email Template:**
```
Subject: New contribution from [Guest Name]!

[Guest Name] just contributed $[Amount] toward [Item Name].

[If message: "They said: '[message]'"]

View in admin dashboard: [link]
```

### 4. Group Gifting Enhancements

**Current State:** Multiple people can contribute to one item, tracked in contributions table.

**Enhancements:**

#### 4.1 Contributor Count Display
- Show "X people have contributed" on each item card
- Update in real-time as contributions come in

#### 4.2 Optional Name Display
- During contribution, checkbox: "Show my name on this gift"
- If checked, name appears in contributor list on item
- Display: "Contributed by: Sarah, Mike, and 3 others"

**Database Changes:**
```sql
ALTER TABLE contributions ADD COLUMN show_name BOOLEAN DEFAULT false;
```

#### 4.3 Progress Celebration (Confetti at 100%)
- When item reaches 100% funded:
  - Confetti animation on the page
  - Item card gets "Fully Funded!" badge
  - Toast notification: "Amazing! [Item] is fully funded!"
- Use canvas-confetti library

**Implementation:**
```javascript
import confetti from 'canvas-confetti';

function celebrateFunding(itemName) {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 }
  });
  showToast(`${itemName} is fully funded!`, 'success');
}
```

---

## Mobile Experience

### 1. Bottom Navigation Bar

**Design Specifications:**
- Height: 60px
- Background: Navy (`#1a365d`)
- Icons: White, 24px
- Labels: White, 10px, below icons
- Active indicator: Gold underline or background highlight

**Sections:**
| Icon | Label | Target |
|------|-------|--------|
| Home | Home | #hero |
| Gift | Gifts | #registry |
| Note | RSVP | Opens RSVP modal |
| Camera | Photos | #gallery |
| Question | FAQ | #faq |

**Behavior:**
- Fixed position at bottom
- Z-index above all content
- Hides when scrolling down, shows when scrolling up
- Smooth transition (300ms)

### 2. Performance Optimization

#### 2.1 Image Optimization
- Compress all images (target: <200KB each)
- Use WebP format with JPEG fallback
- Implement responsive images (`srcset`)
- Lazy load images below the fold

**Implementation:**
```html
<img
  src="image-small.webp"
  srcset="image-small.webp 400w, image-medium.webp 800w, image-large.webp 1200w"
  sizes="(max-width: 600px) 400px, (max-width: 1200px) 800px, 1200px"
  loading="lazy"
  alt="Item description"
/>
```

#### 2.2 Lazy Loading
- Lazy load registry items below fold
- Intersection Observer for triggering loads
- Skeleton loaders while loading

#### 2.3 Bundle Optimization
- Minify CSS and JS for production
- Consider code splitting if bundle grows
- Defer non-critical scripts

**Target Metrics:**
- First Contentful Paint: <1.5s
- Largest Contentful Paint: <2.5s
- Time to Interactive: <3s

---

## Registry Item Guidelines

### 1. Category Balance

**Recommended Categories:**
| Category | % of Items | Examples |
|----------|------------|----------|
| Kitchen | 25-30% | Cookware, appliances, utensils |
| Home | 25-30% | Bedding, towels, decor |
| Experiences | 15-20% | Honeymoon activities, date nights |
| Honeymoon Fund | 10-15% | Flights, accommodation, activities |
| Garden/Outdoor | 5-10% | BBQ, outdoor furniture |
| Other | 5-10% | Miscellaneous, unique items |

### 2. Price Point Strategy

**Recommended Distribution:**
| Price Range | % of Items | Purpose |
|-------------|------------|---------|
| $20-50 | 20% | Easy gifts for casual guests |
| $50-100 | 30% | Sweet spot for most guests |
| $100-200 | 25% | Generous individual gifts |
| $200-500 | 15% | Group gifts or close family |
| $500+ | 10% | Major items, collective contributions |

**Tips:**
- Every price point should have compelling options
- Higher-priced items should be group-gift friendly
- Include a few "quick win" items under $30

### 3. Item Descriptions

**Structure:**
1. **Hook:** Why this item is special to you
2. **Use case:** How you'll use it in your new life together
3. **Personal touch:** A story or dream associated with it

**Example:**
> **KitchenAid Stand Mixer**
>
> Beatrice has dreamed of making fresh pasta together on Sunday evenings. This mixer will be the heart of our kitchen - from birthday cakes to homemade bread. We can't wait to create delicious memories with it!

### 4. Photo Quality

**Requirements:**
- Minimum 800x800px resolution
- Clean, white or neutral background preferred
- Consistent style across items
- Show item in use if possible (lifestyle shots)

---

## Technical Implementation Notes

### Dependencies to Add

```json
{
  "dependencies": {
    "canvas-confetti": "^1.9.0",
    "cheerio": "^1.0.0-rc.12",
    "resend": "^2.0.0"
  }
}
```

### Environment Variables to Add

```env
# Email notifications
RESEND_API_KEY=re_xxxxxxxxx
NOTIFICATION_EMAIL=sam.beatrice@example.com

# Price scraping
ENABLE_PRICE_SCRAPING=true
PRICE_CACHE_HOURS=24
```

### Database Migrations Summary

1. `thank_you_messages` table
2. `contributions.show_name` column
3. `registry_items.scraped_price` column
4. `registry_items.price_last_updated` column
5. `registry_items.price_source` column

### API Endpoints Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/admin/live-feed` | SSE for real-time contributions |
| POST | `/api/admin/refresh-prices` | Trigger price refresh |
| GET | `/api/items/:id/current-price` | Get scraped price |
| GET | `/api/admin/thank-you-messages` | List pending thank yous |
| PUT | `/api/admin/thank-you-messages/:id` | Update message status |
| POST | `/api/admin/send-notification-email` | Test email notification |

---

## Priority Matrix

### P0 - Must Have (Before Invites)
1. Mobile bottom navigation
2. Complete "Almost Funded" section
3. Contributor count display on items
4. Toast notifications for contributions
5. Basic accessibility (focus states, ARIA labels)

### P1 - Should Have
1. Thank you message system
2. Email notifications for contributions
3. Confetti celebration at 100% funded
4. Image lazy loading
5. Visual refresh (subtle)

### P2 - Nice to Have
1. Live price tracking
2. Admin live feed (real-time)
3. Parallax effects
4. Full accessibility audit
5. PWA capabilities

### P3 - Future Consideration
1. SMS notifications
2. Multiple retailer price comparison
3. Guest wishlist/favorites
4. Advanced analytics dashboard

---

## Implementation Order

**Phase 1: Core Mobile & UX (Priority)**
1. Mobile bottom navigation
2. Toast notification system
3. Contributor count display
4. Almost Funded section
5. Basic accessibility fixes

**Phase 2: Engagement Features**
1. Confetti celebration
2. Thank you message drafts
3. Email notifications
4. Featured items section

**Phase 3: Polish & Advanced**
1. Live price tracking
2. Admin live feed
3. Visual refresh
4. Performance optimization
5. Full accessibility

---

## Appendix: Quick Reference

### Key Files
- `server.js` - Main backend (1,481 lines)
- `public/index.html` - Main frontend (3,636 lines)
- `public/admin.html` - Admin dashboard (3,059 lines)
- `public/enhancements.js` - Feature enhancements

### Existing Partially-Implemented Features
- Parallax: JS in enhancements.js, needs CSS
- Mobile nav: JS ready, needs HTML/CSS
- Featured items: JS ready, needs HTML/CSS
- Guest book: LocalStorage-based, working

### Current Tech Stack
- Backend: Node.js + Express
- Database: Supabase (PostgreSQL)
- Payments: Stripe (LIVE mode)
- Auth: Universal guest password + QR codes
- Admin: Code-based authentication

---

*This specification is a living document. Update as decisions are made and features are implemented.*
