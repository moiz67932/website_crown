# Admin Dashboard Quick Start Guide

## 🚀 Getting Started

### First Time Setup

1. **Run Database Migrations**
   ```bash
   # In Supabase SQL Editor, run:
   supabase-admin-tables.sql
   ```

2. **Access Admin Dashboard**
   ```
   http://localhost:3000/admin
   ```

---

## 📋 Page Directory

### Content Management

#### **Properties** (`/admin/properties`)
- View all properties from Trestle API
- Search and filter properties
- Sync properties with Trestle
- Edit property details
- Export properties to CSV

**Quick Actions:**
- Click "Sync Properties" to update from Trestle API
- Use search bar to find specific properties
- Click pencil icon to edit property details

---

#### **Landing Pages** (`/admin/landing`)
- Manage 3000+ SEO landing pages
- Create custom landing pages
- Edit page content and meta tags

**Quick Actions:**
- Click "Generate Pages" to create landing pages for all cities
- Click "Create Manual" to create a custom page
- Edit any page to update content

**Page Types Available:**
- Homes for Sale
- Condos for Sale
- Luxury Homes
- Homes with Pool
- Homes Under $500k
- Homes Over $1M

---

#### **Blog Posts** (`/admin/posts`)
- Create and manage blog posts
- AI-powered content generation
- SEO optimization

**Quick Actions:**
- Click "+ New Blog Post" in sidebar
- Use Discovery page to find topics
- Generate posts automatically

---

### Analytics & Tools

#### **SEO Monitor** (`/admin/seo`)
- Track page performance
- Monitor Google rankings
- Check page speed scores
- Identify SEO issues

**Metrics Tracked:**
- Google rank position
- Page views
- Bounce rate
- Page speed score
- Schema markup status
- Mobile-friendly status

---

#### **Bulk Operations** (`/admin/bulk`)
Perform mass updates efficiently:

**Properties Tab:**
- Generate AI descriptions for all properties
- Update property photos
- Sync all properties at once
- Export to CSV
- Generate meta tags
- Archive old sold properties

**Blog Posts Tab:**
- Generate multiple blog posts
- Update featured images
- Generate meta descriptions
- Add internal links
- Delete old drafts

**Landing Pages Tab:**
- Generate 3000+ pages at once
- Update city descriptions
- Generate FAQs
- Update hero images
- Generate sitemaps
- Update schema markup

---

#### **Analytics** (`/admin/analytics`)
- View website performance
- Track user behavior
- Monitor conversions
- View traffic sources

---

#### **Leads** (`/admin/leads`)
- Manage all leads
- Track lead status
- Follow-up reminders
- Lead scoring

---

### System

#### **Settings** (`/admin/settings`)
Configure your platform:

**General Settings:**
- Site name and description
- Contact information

**API Integrations:**
- Trestle API credentials
- OpenAI API key
- Google Maps API key

**SEO Settings:**
- Default meta tags
- Google Analytics ID
- Search Console settings

**Email Settings:**
- Email provider (SendGrid/Mailgun)
- Notification preferences

**Automation:**
- Auto-sync properties (daily/weekly)
- Auto-generate blog posts
- Set posting frequency

**Security:**
- Two-factor authentication
- Password policies
- Session timeout

---

## 🎯 Common Workflows

### Workflow 1: Initial Setup (3000+ Landing Pages)

1. Go to `/admin/landing`
2. Click "Generate Pages" button
3. Wait for generation to complete
4. Pages are created for all cities automatically
5. View in `/admin/seo` to track performance

**Result:** 3000+ SEO-optimized landing pages created!

---

### Workflow 2: Property Management

1. Go to `/admin/properties`
2. Click "Sync Properties" to get latest from Trestle
3. Go to `/admin/bulk`
4. Click "Generate AI Descriptions" for all properties
5. Click "Generate Meta Tags" for SEO

**Result:** All properties have AI descriptions and SEO!

---

### Workflow 3: Content Marketing

1. Go to `/admin/discover`
2. Enter city (e.g., "Orange")
3. Click "Suggest" to get topic ideas
4. Click "Generate Draft" on any topic
5. Edit and publish the post

**Result:** SEO-optimized blog post published!

---

### Workflow 4: SEO Optimization

1. Go to `/admin/seo`
2. Check "Show only pages with issues"
3. Review issues for each page
4. Go to specific pages to fix issues
5. Re-check SEO metrics

**Result:** All pages optimized for search engines!

---

## 🔍 Search & Filter Tips

### Properties
- **By Address:** Type street address
- **By City:** Type city name
- **By ZIP:** Type ZIP code
- **By Status:** Use status dropdown
- **By Type:** Use type dropdown

### Landing Pages
- **By City:** Type city name
- **By URL:** Type part of the slug
- **By Type:** Use page type dropdown

### SEO Monitor
- **Issues Only:** Check the "Show only pages with issues" box
- **Sort by:** Click column headers to sort

---

## ⚡ Performance Tips

1. **Use Bulk Operations** for mass updates instead of one-by-one
2. **Schedule syncs** during off-peak hours
3. **Generate content** in batches (e.g., 50 posts at a time)
4. **Monitor SEO** weekly to catch issues early
5. **Export data** regularly for backups

---

## 🛠️ Troubleshooting

### Issue: "Properties not syncing"
**Solution:** 
1. Check Trestle API credentials in Settings
2. Verify API key is valid
3. Check Error Logs page for details

### Issue: "Landing pages not generating"
**Solution:**
1. Ensure properties exist in database
2. Check for unique city/type combinations
3. View browser console for errors

### Issue: "Slow performance"
**Solution:**
1. Use filters to reduce data displayed
2. Clear browser cache
3. Check Database performance in Supabase

### Issue: "SEO metrics not showing"
**Solution:**
1. Run database migration for `seo_metrics` table
2. Wait for data collection (24-48 hours)
3. Check Google Analytics integration

---

## 📊 Key Metrics to Monitor

### Daily
- [ ] New leads count
- [ ] Property sync status
- [ ] Error logs
- [ ] Traffic overview

### Weekly
- [ ] SEO performance
- [ ] Blog post engagement
- [ ] Landing page views
- [ ] Lead conversion rate

### Monthly
- [ ] Total properties
- [ ] Content published
- [ ] SEO rankings
- [ ] Overall traffic growth

---

## 🎨 UI Tips

- **Stats Cards:** Click to navigate to detailed view
- **Search Boxes:** Type and auto-filter results
- **Action Buttons:** Hover to see tooltips
- **Status Badges:** Green = Active, Orange = Pending, Purple = Sold
- **Icons:** Eye = View, Pencil = Edit, Trash = Delete

---

## 🔐 Security Best Practices

1. **Change default passwords** immediately
2. **Enable 2FA** in Settings
3. **Keep API keys secure** (never share publicly)
4. **Review access logs** regularly in Error Logs
5. **Backup data** weekly using Export functions

---

## 📞 Need Help?

### Documentation
- Review `ADMIN_DASHBOARD_COMPLETE.md` for technical details
- Check Milestone PDFs for requirements
- Review API documentation in code

### Quick Links
- Overview Dashboard: `/admin`
- Main Dashboard: `/admin/dashboard`
- Settings: `/admin/settings`
- Error Logs: `/admin/errors`

---

## ✅ Daily Checklist

**Morning (5 min):**
- [ ] Check Overview Dashboard
- [ ] Review new leads
- [ ] Check error logs

**Midday (10 min):**
- [ ] Monitor traffic in Analytics
- [ ] Review SEO alerts
- [ ] Check content calendar

**Evening (5 min):**
- [ ] Sync properties if needed
- [ ] Schedule next day's posts
- [ ] Review daily stats

---

## 🎯 Success Metrics

### Week 1 Goals
- [ ] 3000+ landing pages created
- [ ] All properties have descriptions
- [ ] 10+ blog posts published
- [ ] SEO monitor set up

### Month 1 Goals
- [ ] 100+ blog posts
- [ ] All pages indexed by Google
- [ ] 90+ page speed scores
- [ ] Lead pipeline established

---

**Happy Managing! 🚀**

For technical support, refer to the codebase or contact the development team.
