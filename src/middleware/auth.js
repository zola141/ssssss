export const authTokens = new Map();

export const requireAuth = (req, res, next) => {
  const token = req.query.token || req.headers.authorization?.replace("Bearer ", "");
  if (token && authTokens.has(token)) {
    req.user = authTokens.get(token);
    next();
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
};

export const corsMiddleware = (req, res, next) => {
  const origin = req.headers.origin || req.headers.host;
  res.header("Access-Control-Allow-Origin", origin || "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
};
