# Content Validator Hook

This hook automatically validates Reddit post content for accuracy and appropriateness.

## Trigger
- When MYSTERY_POSTS array is modified
- Before deployment

## Actions
1. **Historical Accuracy Check**
   - Verify post dates against Reddit's launch timeline
   - Cross-reference subreddit creation dates
   - Validate upvote counts against known records

2. **Content Appropriateness**
   - Scan for offensive content
   - Ensure compliance with Reddit's content policy
   - Check for copyright issues

3. **Difficulty Balancing**
   - Analyze guess difficulty based on post popularity
   - Ensure even distribution across difficulty levels
   - Suggest new posts to fill gaps

## Benefits
- Maintains content quality standards
- Prevents deployment of problematic content
- Ensures balanced gameplay experience
- Saves hours of manual content review