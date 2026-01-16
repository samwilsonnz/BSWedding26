# Group RSVP Functionality - Test Guide

## ✅ Changes Implemented

### 1. **Group RSVP for Already-RSVPed Guests**
- **Before**: If a guest had already RSVPed, they were immediately taken to the registry, with no option to RSVP for family members
- **After**: If a guest has RSVPed but family members haven't, they can now RSVP for those family members

### 2. **Updated Logic Flow**
```javascript
// OLD LOGIC (index.html line 5872)
if (result.guest.hasRsvped) {
    // Skip RSVP form entirely
    setTimeout(() => this.showAlreadyRsvped(result.guest), 300);
}

// NEW LOGIC
const hasUnrsvpedMembers = result.familyMembers?.some(m => !m.hasRsvped) || false;
const allRsvped = result.guest.hasRsvped && !hasUnrsvpedMembers;

if (allRsvped) {
    // Only skip if EVERYONE has RSVPed
    setTimeout(() => this.showAlreadyRsvped(result.guest), 300);
} else {
    // Show RSVP form if anyone still needs to RSVP
    setTimeout(() => this.showRsvpForm(result.guest, result.familyMembers), 300);
}
```

### 3. **Server-Side Protection**
- Added `skipMainGuestUpdate` flag to prevent overwriting existing RSVP
- Server only updates main guest if they haven't already RSVPed
- Family member updates are processed independently

### 4. **Email Notifications**
- Main guest only receives confirmation email if they just RSVPed (not on family-only updates)
- Family members receive individual confirmation emails
- Couple receives notifications for each person who RSVPs

## 🧪 Testing Instructions

### Test Scenario 1: Main Guest RSVPs for Entire Family
1. Start the server: `npm start` or `node server.js`
2. Visit http://localhost:12000 (or deployed URL)
3. Click "RSVP" button
4. Enter password: `Beatrice&Samuel2026`
5. Enter a guest name (e.g., "Ann Wilson")
6. Fill out RSVP for main guest
7. Fill out RSVP options for family members (John, George, Thomas, James)
8. Submit
9. **Expected**: All family members marked as RSVPed, emails sent to each person who provided an email

### Test Scenario 2: Family Member RSVPs After Main Guest
**Setup**: First, complete Test Scenario 1 with only Ann Wilson RSVPing (leave family blank)

1. Go through login flow again
2. Enter "John Wilson" (Ann's family member)
3. **Expected**: Shows message "You haven't RSVPed yet. Please let us know if you can make it."
4. John fills out his RSVP
5. John can also RSVP for other family members (George, Thomas, James) who haven't responded
6. Submit
7. **Expected**:
   - John's RSVP is recorded
   - Other family members' RSVPs are recorded
   - Ann's RSVP remains unchanged
   - Email notifications sent for new RSVPs only

### Test Scenario 3: Already Fully RSVPed Family
**Setup**: Complete Test Scenario 1 with all family members

1. Go through login flow again
2. Enter "Ann Wilson"
3. **Expected**: Shows "You've already RSVPed" message and goes straight to registry
4. No RSVP form is shown because everyone already responded

### Test Scenario 4: Mixed Family Status
**Setup**: Ann and John have RSVPed, George/Thomas/James have not

1. Login as "George Wilson"
2. **Expected**:
   - Message shows "You haven't RSVPed yet"
   - Can RSVP for self
   - Can RSVP for Thomas and James
   - Ann and John show as "(Already RSVPed)" with badges

## 📧 Email Testing

### Verify Emails Are Sent
1. Check environment variables are set:
   ```bash
   node scripts/verify-email-config.js
   ```

2. Expected output:
   ```
   ✅ RESEND_API_KEY: Set
   ✅ NOTIFICATION_EMAIL: samwilsonnz1@gmail.com
   ✅ SITE_URL: https://bswedding26.com
   ✅ WEDDING_PASSWORD: Set
   ```

3. After submitting an RSVP, check `samwilsonnz1@gmail.com` for:
   - **Guest confirmation email**: Contains registry link and password
   - **Couple notification email**: Shows who RSVPed and their response

### Email Types
1. **Guest Confirmation** (`sendGuestRsvpConfirmation`)
   - Sent to: Guest's email address
   - Subject: "RSVP Confirmed - Sam & Beatrice's Wedding"
   - Contains: Website link, password, personalized message

2. **Couple Notification** (`sendRsvpNotification`)
   - Sent to: samwilsonnz1@gmail.com
   - Subject: "📋 New RSVP: [Name] - [Status]"
   - Contains: Guest details, attendance status, dietary restrictions, message

## 🔍 Database Verification

After testing, verify in Supabase:

```sql
-- Check all RSVPs for a family group
SELECT name, has_rsvped, rsvp_response, rsvp_by, rsvp_date
FROM guest_list
WHERE family_group = 'wilson_ann'
ORDER BY rsvp_date;
```

Expected columns:
- `has_rsvped`: true/false
- `rsvp_response`: 'yes', 'no', or 'maybe'
- `rsvp_by`: Name of person who submitted the RSVP
- `rsvp_date`: Timestamp of RSVP submission

## ✨ User Experience Improvements

### For Guests Who Already RSVPed
- See their existing response at the top
- Can RSVP for family members who haven't responded
- Main RSVP fields are hidden (no accidental overwrites)

### For Families
- One person can RSVP for the whole group
- Each person can provide their own email for confirmation
- Everyone knows who else has RSVPed

### For Sam & Beatrice
- Receive email for each RSVP submission
- Can track who RSVPed on behalf of whom
- All data visible in admin dashboard

## 🚨 Known Limitations

1. **No Edit Functionality**: Once someone RSVPs, they cannot change their response through the UI (would need to contact Sam/Beatrice)
2. **Email Requirement**: Optional emails, but recommended for confirmations
3. **API Rate Limits**: Resend has rate limits on free tier (100 emails/day)

## 📝 Files Modified

1. **public/index.html**
   - Line 5863-5878: Updated guest lookup logic
   - Line 5893-5960: Enhanced `showRsvpForm()` to handle already-RSVPed guests
   - Line 5989-6048: Modified `submitRsvp()` to support skip flag

2. **server.js**
   - Line 2102-2147: Added `skipMainGuestUpdate` flag handling
   - Line 2188-2218: Enhanced notification logic for family RSVPs

## ✅ Testing Checklist

- [ ] Main guest can RSVP for entire family
- [ ] Family member can RSVP after main guest
- [ ] All family members RSVPed → skip RSVP form
- [ ] Already-RSVPed guest sees their status
- [ ] Email configuration is correct
- [ ] Guest confirmation emails are sent
- [ ] Couple notification emails are sent
- [ ] Multiple family members can provide emails
- [ ] Database records all RSVPs correctly
- [ ] RSVP stats update correctly on homepage

## 🎉 Success Criteria

✅ Anyone in a family group can RSVP for members who haven't responded
✅ Guests who already RSVPed can help complete family RSVPs
✅ Email notifications work for all RSVP submissions
✅ No data loss or overwrites of existing RSVPs
✅ Clear UI feedback for all scenarios
