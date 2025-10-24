# Reddit API Integration Hook

Automatically fetches and integrates live Reddit data to enhance game authenticity.

## Trigger
- When a new Reddit post is displayed
- On subreddit guess submission
- Periodically for community stats updates

## Actions
1. **Live Subreddit Data**
   - Fetch current subscriber counts
   - Get active user statistics
   - Retrieve subreddit creation dates
   - Pull recent post activity

2. **Content Validation**
   - Verify post authenticity against Reddit archives
   - Check subreddit existence and activity
   - Validate historical accuracy of posts

3. **Dynamic Content**
   - Suggest new legendary posts based on trending content
   - Update difficulty ratings based on current subreddit popularity
   - Refresh community statistics in real-time

4. **Rate Limiting & Caching**
   - Implement intelligent caching to respect API limits
   - Queue requests to avoid rate limiting
   - Cache frequently accessed data locally

## Benefits
- Always up-to-date Reddit information
- Enhanced game authenticity
- Reduced manual content curation
- Automatic content freshness