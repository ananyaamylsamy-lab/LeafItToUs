// Protect routes requiring authentication
export const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
};

// Attach current user to request if authenticated
export const getCurrentUser = async (req, res, next) => {
  if (req.session && req.session.userId) {
    req.user = {
      _id: req.session.userId,
      username: req.session.username,
    };
  }
  next();
};