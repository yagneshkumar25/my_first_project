
const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];

    console.log("AUTH REQUEST RECEIVED");
    console.log("AUTH HEADER PRESENT:", Boolean(authHeader));

    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        console.log("AUTH FAILED: TOKEN MISSING");
        return res.status(401).json({
            message: "Access denied. Token required."
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        console.log("AUTH SUCCESS - USER ID:", decoded.id);

        req.user = decoded;
        next();

    } catch (error) {
        console.log("AUTH FAILED:", error.message);

        return res.status(403).json({
            message: "Invalid or expired token"
        });
    }
};

module.exports = authenticateToken;
