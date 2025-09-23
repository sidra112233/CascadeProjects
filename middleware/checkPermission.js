module.exports = function(page, action) {
    return async function(req, res, next) {
        const agent = req.agent; // Assume agent info is attached to req (e.g., after login)
        if (!agent) return res.status(401).json({ error: 'Unauthorized' });

        if (agent.access_level === 'full') return next();
        if (agent.access_level === 'view' && action === 'view') return next();
        if (agent.access_level === 'edit' && ['view', 'edit', 'add'].includes(action)) return next();

        if (agent.access_level === 'custom') {
            const perms = agent.permissions ? JSON.parse(agent.permissions) : {};
            if (perms[page] && perms[page][action]) return next();
        }

        return res.status(403).json({ error: 'Permission denied' });
    };
};