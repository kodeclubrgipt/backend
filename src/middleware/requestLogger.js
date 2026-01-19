const requestLogger = (req, res, next) => {
    const start = Date.now();
    const { method, originalUrl } = req;

    // Skip OPTIONS requests (CORS preflight checks) - simple users don't need to see these
    if (method === 'OPTIONS') {
        return next();
    }

    // Map Routes to Human Readable Actions
    const getActionDescription = (method, url) => {
        // Admin Routes
        if (url.includes('/api/admin/users')) {
            if (method === 'GET') return '👥 Admin is fetching the list of users';
            if (method === 'POST') return '➕ Admin is adding new users';
        }
        if (url.includes('/api/admin/quizzes')) {
            if (method === 'GET') return '📚 Admin is fetching the list of quizzes';
            if (method === 'POST') return '🛠️ Admin is creating a new quiz';
        }

        // Stats & Dashboard
        if (url.includes('/api/stats/dashboard')) return '📊 Loading Admin Dashboard Statistics';
        if (url.includes('/api/leaderboard')) return '🏆 Viewing Leaderboard';

        // Quiz Routes
        if (url.includes('/api/quiz')) {
            if (url.includes('/submit') && method === 'POST') return '📝 User is submitting a quiz attempt';
            if (method === 'GET' && url.match(/\/api\/quiz\/[a-zA-Z0-9]+$/)) return '📖 User is viewing a specific quiz';
            if (method === 'GET') return '🧐 User is browsing available quizzes';
        }

        // Auth Routes
        if (url.includes('/api/auth/google')) return '🔐 OAuth: Redirecting to Google Login';
        if (url.includes('/api/auth/callback')) return '🔙 OAuth: Returned from Google Login';
        if (url.includes('/api/user/me')) return '👤 Fetching current user profile';

        // Default Fallback
        return `${method} request to ${url}`;
    };

    const description = getActionDescription(method, originalUrl);

    // Listen for the response to finish
    res.on('finish', () => {
        const duration = Date.now() - start;
        const { statusCode } = res;

        // Determine Status String
        let statusText = 'Success';
        let icon = '✅';

        if (statusCode === 304) {
            statusText = 'Unchanged (Cached)';
            icon = '⚡';
        } else if (statusCode >= 400 && statusCode < 500) {
            statusText = `Client Error (${statusCode})`;
            icon = '⚠️';
        } else if (statusCode >= 500) {
            statusText = `Server Error (${statusCode})`;
            icon = '❌';
        }

        // Format: "✅ Admin is fetching users... (Success - 12ms)"
        console.log(`${icon} ${description}... (${statusText} in ${duration}ms)`);
    });

    next();
};

module.exports = requestLogger;
