# QR Code & Shared PIN System

## ✅ Current System (Updated)

### Single Shared PIN for All Guests

- **One QR code for everyone** - All invitations have the same QR code
- **One PIN for everyone** - All guests use the same PIN code to access the registry
- **No guest tracking** - There is no per-guest tracking or management needed
- **Simplified access** - Guests scan QR, enter shared PIN, view registry

## 🔐 Shared PIN System

### How It Works:

1. **Single PIN Generation**:
   - One PIN code is used for ALL guests
   - Default PIN: `WEDDING2024` (can be changed in .env file)
   - Environment variable: `SHARED_GUEST_PIN`
   - No unique codes per guest

2. **Display in Admin Panel**:
   - When clicking any QR code icon, you see the shared PIN
   - Same PIN shown for all guests
   - Large, bold display for easy sharing
   - Copy button for convenience

3. **Guest Usage Flow**:
   ```
   Guest → Scans QR code → Opens registry → Enters shared PIN → Access granted
   ```

## 📱 QR Code Usage

### What Prints on Invitations:
- **One QR code** for all invitations
- **One PIN code** shared with all guests
- Much simpler than unique codes per guest

### How to Share:
- Print QR code on all invitations
- Share the PIN via:
  - Printed on invitation
  - Email/SMS
  - Wedding website
  - Word of mouth
  - Any method you prefer!

## 🎯 Benefits

1. **Maximum Simplicity**:
   - Only ONE QR code to print
   - Only ONE PIN to share
   - No guest management required
   - No tracking complexity

2. **Easy Distribution**:
   - Batch print all invitations identically
   - No need to match specific codes to guests
   - Share PIN through any channel

3. **No Privacy Concerns**:
   - No per-guest tracking
   - All guests have equal access
   - Anonymous contributions still supported

## 🧪 Testing

### To Test in Admin Panel:
1. Go to http://localhost:3000/admin
2. Navigate to "Guest Management" tab (optional - can be removed)
3. Click any QR icon
4. You should see:
   - **Same QR code** (points to homepage)
   - **Same PIN code** for all (e.g., WEDDING2024)
   - Instructions explaining shared access

### Expected Behavior:
- ✅ QR code is identical for everyone
- ✅ PIN code is the same for all guests
- ✅ No per-guest unique codes
- ✅ Instructions mention shared PIN

## 📝 Technical Implementation

### File: `server.js`

**Lines 51-54 - Shared PIN Generation**:
```javascript
function generateGuestCode() {
    return process.env.SHARED_GUEST_PIN || 'WEDDING2024';
}
```
- Returns the same PIN for all guests
- Can be customized via environment variable
- Default is `WEDDING2024`

### File: `admin.html`

**Lines 2645-2682 - QR Code Modal**:
- QR data: `${window.location.origin}` (no guest code)
- Display shows "Shared PIN Code (same for ALL guests)"
- Instructions explain the shared access model
- Warning note about no guest tracking

### Environment Variable Setup:

To customize the shared PIN, add to your `.env` file:
```
SHARED_GUEST_PIN=YourCustomPin123
```

## ✨ Summary

**QR Code**: One for everyone ✅
**PIN Code**: One for everyone ✅
**Guest Tracking**: None ✅
**Guest Management**: Optional (can be removed) ✅
**Email Required**: No (optional) ✅
**Thank You Cards**: Removed ✅

**Flow**: Scan same QR → Enter same PIN → Access registry ✅

## 🔧 Configuration

### Changing the Shared PIN:

1. Open `.env` file
2. Add or update:
   ```
   SHARED_GUEST_PIN=MYNEWPIN
   ```
3. Restart the server
4. All guests will now use `MYNEWPIN`

### Disabling Guest Management:

Since guest tracking is not needed with a shared PIN system, the Guest Management tab in the admin panel can be removed or hidden. All guests have equal access with no individual tracking.
