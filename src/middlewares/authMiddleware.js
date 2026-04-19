const jwt = require('jsonwebtoken');

// Middleware to verify the JWT on protected routes
const verifyToken = (req, res, next) => {
    try {
        // 1. Check if the Authorization header exists
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                data: null,
                message: 'Access denied. No token provided.'
            });
        }

        // 2. Extract the token (Format: "Bearer <token>")
        const token = authHeader.split(' ')[1];

        // 3. Verify the token using your secret key
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 4. Attach the decoded payload to the request object
        // This makes req.user.id, req.user.agency_id, and req.user.role available to all controllers!
        req.user = decoded;

        // 5. Pass control to the next middleware or controller
        next();
    } catch (error) {
        // Catch expired or tampered tokens
        return res.status(401).json({
            success: false,
            data: null,
            message: 'Invalid or expired token.'
        });
    }
};

// Middleware to strictly protect Admin-only routes (like adding new employees)
const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            data: null,
            message: 'Forbidden. Agency Admin access required.'
        });
    }
    next();
};

module.exports = {
    verifyToken,
    requireAdmin
};