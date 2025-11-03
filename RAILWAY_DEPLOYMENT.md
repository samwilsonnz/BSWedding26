# 🚂 Railway Deployment Guide for Wedding Registry

## Your Custom Domain: `bswedding26.com`

This guide will help you deploy your wedding registry to Railway and configure your custom domain.

---

## Step 1: Push to GitHub

1. Go to https://github.com/new
2. Create a new repository (can be private):
   - Name: `wedding-registry` or `bswedding26`
   - Description: "Samuel & Beatrice's Wedding Registry"
   - **DO NOT** initialize with README (we already have files)

3. Copy the repository URL (it will look like `https://github.com/YOUR_USERNAME/wedding-registry.git`)

4. In Terminal, run these commands:
   ```bash
   cd "/Volumes/Macintosh HD/Applications/Wedding Gifts Registry/wedding-registry"
   git remote add origin https://github.com/YOUR_USERNAME/wedding-registry.git
   git branch -M main
   git push -u origin main
   ```

---

## Step 2: Deploy to Railway

1. Go to https://railway.app/ and sign in with GitHub

2. Click "New Project"

3. Choose "Deploy from GitHub repo"

4. Select your `wedding-registry` repository

5. Railway will automatically detect it's a Node.js app

6. Click "Deploy"

---

## Step 3: Configure Environment Variables

After deployment starts, you need to add your environment variables:

1. In your Railway project, go to **Variables** tab

2. Add these variables (get them from your `.env` file):

```
SUPABASE_URL=https://ypxbekwomfqfokzfoasz.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
STRIPE_SECRET_KEY=your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here
ADMIN_CODE=SB2024ADMIN1
PORT=3000
NODE_ENV=production
```

3. Click "Deploy" to restart with new variables

---

## Step 4: Configure Custom Domain

### 4A: Add Domain in Railway

1. In your Railway project, go to **Settings** tab

2. Scroll to **Domains** section

3. Click "Add Custom Domain"

4. Enter: `bswedding26.com`

5. Railway will give you DNS records to add (usually a CNAME or A record)

---

### 4B: Update DNS Settings (Namecheap)

Since your domain is registered with Namecheap:

1. Go to https://www.namecheap.com/

2. Sign in to your account

3. Go to **Domain List**

4. Find `bswedding26.com` and click **Manage**

5. Go to **Advanced DNS** tab

6. Add the DNS records Railway provided:

   **Option A: CNAME Record (Most Common)**
   - Type: `CNAME Record`
   - Host: `@`
   - Value: `your-app.railway.app` (Railway will tell you this)
   - TTL: Automatic

   **Option B: A Record**
   - Type: `A Record`
   - Host: `@`
   - Value: `IP address from Railway`
   - TTL: Automatic

7. Add a WWW subdomain (optional but recommended):
   - Type: `CNAME Record`
   - Host: `www`
   - Value: `bswedding26.com`
   - TTL: Automatic

8. Click "Save All Changes"

---

## Step 5: Wait for DNS Propagation

- DNS changes can take 5-30 minutes (sometimes up to 48 hours)
- Check status at: https://www.whatsmydns.net/#CNAME/bswedding26.com
- Railway will automatically issue an SSL certificate when DNS is configured

---

## Step 6: Test Your Live Site

Once DNS propagates, visit:

- https://bswedding26.com
- https://www.bswedding26.com (if you added WWW)

### Test These Features:
1. ✅ Login with password: `Beatrice&Samuel2026`
2. ✅ Browse registry items
3. ✅ Admin panel: https://bswedding26.com/admin (code: `SB2024ADMIN1`)
4. ✅ Content Editor in admin
5. ✅ RSVP form
6. ✅ FAQ section

---

## Troubleshooting

### Site not loading?
- Check Railway deployment logs
- Verify environment variables are set correctly
- Make sure PORT=3000 is set

### Domain not working?
- Check DNS propagation: https://www.whatsmydns.net/
- Verify DNS records in Namecheap match Railway's instructions
- Try clearing your browser cache or use incognito mode

### Database errors?
- Make sure all Supabase environment variables are correct
- Check that CREATE_SITE_CONTENT_TABLE.sql was run in Supabase

---

## Important: Update Stripe Settings

After your site is live, update Stripe:

1. Go to https://dashboard.stripe.com/settings/checkout

2. Add your production domain to allowed domains:
   - `https://bswedding26.com`
   - `https://www.bswedding26.com`

---

## Post-Deployment Checklist

- [ ] Site loads at bswedding26.com
- [ ] SSL certificate is active (https://)
- [ ] Login works
- [ ] Admin panel accessible
- [ ] Stripe payments work
- [ ] RSVP form submits
- [ ] Content Editor saves changes
- [ ] QR code works
- [ ] Gallery uploads work

---

## Future Updates

To deploy updates:

1. Make changes to your code
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Description of changes"
   git push
   ```
3. Railway will automatically detect the push and redeploy!

---

## Support

- Railway Docs: https://docs.railway.app/
- Railway Discord: https://discord.gg/railway
- Supabase Docs: https://supabase.com/docs

---

🎉 **Your wedding registry will be live at bswedding26.com!** 🎉
