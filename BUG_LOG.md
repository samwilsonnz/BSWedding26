# Wedding Registry Bug Log

## Testing Date: December 30, 2025

---

## CRITICAL FIXES APPLIED

### FIX-001: Content Security Policy (CSP) Blocking All CDN Resources
**Status:** FIXED
**Severity:** Critical
**File:** `server.js:95-129`

**Issue:** CSP was blocking:
- Font Awesome icons (cdnjs.cloudflare.com)
- SortableJS for drag-drop (cdn.jsdelivr.net)
- Confetti animation (cdn.jsdelivr.net)
- QR Scanner (unpkg.com)
- Inline event handlers (onclick)

**Fix Applied:** Updated helmet CSP configuration to allow all required CDNs and inline handlers.

---

### FIX-002: RSVP Form Always Sends "Yes"
**Status:** FIXED
**File:** `public/enhancements.js:70`

**Issue:** Radio button selection always returned "yes" regardless of choice.

**Fix:**
```javascript
// Before: document.getElementById('rsvpAttending').value
// After:
attending: document.querySelector('input[name="attending"]:checked')?.value || ''
```

---

### FIX-003: Guest Code Generator Too Long
**Status:** FIXED
**File:** `server.js:170`

**Issue:** Returning "WEDDING2024" (too long for VARCHAR(10) column)

**Fix:** Generate unique 6-character alphanumeric codes.

---

### FIX-004: Admin RSVPs Not Loading (401 Error)
**Status:** FIXED
**File:** `public/admin.html:3601`

**Issue:** Missing Authorization header in loadRSVPs fetch call.

**Fix:** Added `headers: { 'Authorization': \`Bearer \${this.adminToken}\` }`

---

### FIX-005: Service Worker Failing to Cache CDN Assets
**Status:** FIXED
**File:** `public/sw.js:6-13`

**Issue:** SW trying to fetch CDN assets which CSP was blocking.

**Fix:** Removed external CDN URLs from precache list - they handle their own caching.

---

### FIX-006: Thank Yous Refresh Button Not Working
**Status:** FIXED
**File:** `public/admin.html:1796, 4121`

**Issue:** `onclick="loadThankYous()"` blocked by CSP.

**Fix:** Changed to use event listener with ID.

---

## REQUIRES SUPABASE DATABASE FIX

### DB-001: Content Editor Save Fails
**Status:** NEEDS SUPABASE FIX

**Issue:** RLS policy blocks updates to `site_content` table.

**Fix:** Run `FIX_ALL_RLS_POLICIES.sql` in Supabase SQL Editor.

---

### DB-002: Thank You Messages Missing Columns
**Status:** NEEDS SUPABASE FIX

**Issue:** `contributions` table missing `thank_you_sent` and `thank_you_sent_at` columns.

**Fix:** Run `FIX_ALL_RLS_POLICIES.sql` in Supabase SQL Editor.

---

## WORKING FEATURES

### Main Site
- [x] Guest login with password
- [x] Registry items display (7 items)
- [x] Dual image display
- [x] Filter by category
- [x] Favorites (star button)
- [x] RSVP form submission
- [x] Mobile navigation
- [x] PWA install
- [x] All CSS/JS loading correctly

### Admin Panel
- [x] Login/logout
- [x] Registry items (view/edit/delete/reorder)
- [x] Guests (view/add/edit/delete)
- [x] RSVPs (view/delete)
- [x] Contributions report
- [x] Analytics dashboard
- [ ] Content editor (needs DB fix)
- [ ] Thank you messages (needs DB fix)

---

## Files Modified

| File | Changes |
|------|---------|
| `server.js` | CSP policy fix, guest code generator |
| `public/admin.html` | RSVPs auth, thank yous button |
| `public/enhancements.js` | RSVP radio fix |
| `public/sw.js` | Removed CDN caching |

---

## To Complete Setup

1. **Run SQL Fix in Supabase:**
   ```sql
   -- Copy contents of FIX_ALL_RLS_POLICIES.sql
   -- Run in Supabase Dashboard > SQL Editor
   ```

2. **Clear Browser Cache:**
   - Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
   - Or clear service worker in DevTools > Application > Service Workers

3. **Test All Features:**
   - Login with: `Beatrice&Samuel2026`
   - Admin code from `.env` file
