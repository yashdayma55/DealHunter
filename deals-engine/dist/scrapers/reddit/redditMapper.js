/**
 * Extract Android package ID from URLs such as:
 * https://play.google.com/store/apps/details?id=com.example.app
 */
function extractAndroidPackage(url) {
    if (!url)
        return null;
    const match = url.match(/id=([a-zA-Z0-9._]+)/);
    return match ? match[1] : null;
}
/**
 * Extract iOS App Store ID from URLs such as:
 * https://apps.apple.com/us/app/app-name/id123456789
 */
function extractIosPackage(url) {
    if (!url)
        return null;
    const match = url.match(/\/id(\d+)/);
    return match ? `ios-${match[1]}` : null;
}
/**
 * Main mapping function: Reddit → Deal + Package UID
 */
export function mapRedditToDeal(post) {
    const url = post.url;
    // Try extracting Android package
    let package_uid = extractAndroidPackage(url);
    // Try extracting IOS package
    if (!package_uid) {
        package_uid = extractIosPackage(url);
    }
    // If still nothing, try using the POST TEXT (selftext)
    if (!package_uid && post.selftext) {
        package_uid = extractAndroidPackage(post.selftext) || extractIosPackage(post.selftext);
    }
    return {
        title: post.title,
        description: null,
        price_before: null,
        price_after: null,
        currency: null,
        discount_type: null,
        discount_value: null,
        url,
        referral_code: null,
        score_at_scrape: post.ups,
        posted_utc: new Date(post.created_utc * 1000).toISOString(),
        expiry_date: null,
        // 🔥 NEW FIELD: return package_uid so your main scraper can use it
        package_uid,
    };
}
