const requireAuth = (req, res, next) => {
    if (req.session && req.session.user) {
        return next();
    } else {
        return res.redirect('/login');
    }
};

const requireRole = (roles) => {
    return (req, res, next) => {
        if (req.session && req.session.user && roles.includes(req.session.user.role)) {
            return next();
        } else {
            return res.status(403).json({ 
                error: 'Access denied. Insufficient permissions.'
            });
        }
    };
};

const redirectIfAuthenticated = (req, res, next) => {
    if (req.session && req.session.user) {
        return res.redirect('/dashboard');
    } else {
        return next();
    }
};

module.exports = {
    requireAuth,
    requireRole,
    redirectIfAuthenticated
};
