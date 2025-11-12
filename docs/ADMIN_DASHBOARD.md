# Admin Dashboard Documentation

## Overview

The Admin Dashboard provides a comprehensive overview of your real estate platform with analytics, monitoring, and quick access to all administrative tools.

## Features

### 1. Main Dashboard (`/admin/dashboard`)

A modern, comprehensive dashboard with real-time analytics and insights:

#### Key Performance Indicators (KPIs)
- **Total Leads**: Track all leads with trend analysis
- **Page Views**: 7-day traffic overview with daily averages
- **Conversion Rate**: Views-to-leads conversion tracking
- **Estimated Revenue**: Pipeline value based on lead scoring

#### Lead Pipeline Tracking
- Visual pipeline stages: New → Contacted → Qualified → Converted
- Real-time lead status updates
- CRM integration status
- Lead scoring and prioritization

#### System Health Monitoring
- **Database Status**: Connection and performance
- **API Status**: Uptime and response times
- **Error Tracking**: Real-time error monitoring with severity levels

#### Content Analytics
- Top performing blog posts (7-day view)
- Content statistics (posts, properties, users)
- Publishing metrics

#### API Usage & Performance
- API request tracking
- Average response times
- System uptime statistics

### 2. Lead Management (`/admin/leads`)

Comprehensive lead tracking and management system:

#### Features
- Complete lead information display
- Lead scoring system (0-100)
- CRM status tracking
- Agent assignment tracking
- Contact information management
- Location-based filtering

#### Lead Metrics
- Total leads count
- Average lead score
- High-value leads (score ≥ 70)
- Qualified leads ready for conversion

### 3. Error Logs (`/admin/errors`)

Centralized error monitoring and alerting:

#### Features
- Real-time error tracking
- Severity categorization (Critical, Error, Warning, Info)
- Stack trace viewing
- Source/endpoint tracking
- Time-based filtering

#### Error Metrics
- Total error count
- Critical errors
- Warning counts

### 4. Analytics Functions

SQL functions for advanced analytics:

#### `posts_with_most_views(days)`
Returns top-performing posts by view count

```sql
SELECT * FROM posts_with_most_views(7); -- Last 7 days
```

#### `views_by_day(days)`
Returns daily page view statistics

```sql
SELECT * FROM views_by_day(30); -- Last 30 days
```

## Database Schema

### New Tables

#### `errors` Table
```sql
CREATE TABLE errors (
  id UUID PRIMARY KEY,
  created_at TIMESTAMPTZ,
  severity TEXT,
  level TEXT,
  message TEXT,
  error_message TEXT,
  stack TEXT,
  source TEXT,
  endpoint TEXT,
  metadata JSONB
);
```

## Navigation

### Sidebar Structure

**Navigation Section:**
- Dashboard (highlighted) - Main analytics hub
- Overview - Content dashboard
- Properties - Property management
- Blog Posts - Content management
- Landing Pages - Landing page editor

**Analytics & Tools:**
- Leads - Lead management system
- Performance - Analytics dashboard
- SEO Monitor - SEO health checks
- Error Logs - System error tracking
- Discovery - Content discovery tools
- Bulk Operations - Mass content updates

**System:**
- Settings - Platform configuration

## Color Scheme

The dashboard uses the existing Crown Coastal design system:

- **Primary**: Orange gradient (`#f19840` to `#ed7f1e`)
- **Accent**: Emerald (`#34d399` to `#10b981`)
- **Success**: Green (`#10b981`)
- **Warning**: Yellow (`#f59e0b`)
- **Error**: Red (`#ef4444`)
- **Neutral**: Slate grays

## Analytics Metrics

### Website Performance
- Total page views (7-day, 24-hour, 30-day)
- Average views per day
- Traffic trends

### Lead Metrics
- Total leads
- New leads (24h, 7d)
- Lead conversion rate
- Pipeline distribution
- Lead scoring statistics

### ROI Reporting
- Estimated revenue from pipeline
- Average lead value
- Conversion rates
- Pipeline value tracking

### User Analytics
- Total users
- Newsletter subscribers
- User engagement

## Usage

### Accessing the Dashboard

1. Navigate to `/admin/dashboard`
2. View real-time analytics
3. Click on any metric for detailed views
4. Use quick actions for common tasks

### Quick Actions

From any admin page:
- **New Post**: Create a new blog post
- **Properties**: Manage property listings
- **Analytics**: View detailed analytics
- **SEO Monitor**: Check SEO health
- **Leads**: Manage customer leads

### Error Monitoring

1. Navigate to `/admin/errors`
2. View recent errors
3. Filter by severity
4. Review stack traces
5. Track resolution

### Lead Management

1. Navigate to `/admin/leads`
2. View all leads with scores
3. Filter by status, score, or location
4. Export lead data
5. Track CRM integration status

## API Endpoints

### Admin Metrics
- `GET /api/admin/metrics` - System metrics
- `GET /api/admin/errors` - Error logs

### Analytics
- View tracking via `page_views` table
- Lead analytics via `leads` table
- Post performance via SQL functions

## Best Practices

1. **Monitor Daily**: Check dashboard daily for trends
2. **Error Review**: Review critical errors immediately
3. **Lead Follow-up**: Check new leads within 24 hours
4. **Performance**: Monitor conversion rates weekly
5. **Content**: Review top-performing posts monthly

## Future Enhancements

Planned improvements:
- Real-time WebSocket updates
- Advanced filtering and search
- Custom date range selection
- Export functionality (CSV, PDF)
- Email alerts for critical errors
- Lead assignment automation
- Performance benchmarking
- A/B test results integration

## Troubleshooting

### Dashboard Not Loading
- Check Supabase connection
- Verify database migrations are run
- Check browser console for errors

### Missing Data
- Ensure analytics functions are created
- Run migration: `20250915_analytics_functions.sql`
- Verify table permissions

### Performance Issues
- Check database indexes
- Review query optimization
- Monitor server resources

## Support

For issues or questions:
1. Check error logs in `/admin/errors`
2. Review database connection
3. Verify environment variables
4. Check server logs

---

**Last Updated**: November 12, 2025
**Version**: 1.0.0
