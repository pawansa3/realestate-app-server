const { User } = require("./../models/user");

let auth = (req, res, next) => {
    let token = req.cookies.auth;
    User.findByToken(token, (err, user) => {
        if (err) throw err;
        if (!user) return res.json({ error: true });

        req.token = token;
        req.user = user;
        next();
    });
};

let verifyToken = (req, res, next) => {
    const token = req.headers['authorization'].split(' ')[1];
    console.log("bearer token", token)
    User.findByToken(token, (err, user) => {
        if (err) throw err;
        if (!user) return res.status(403).json({ error: "Unauthorized!" });

        req.token = token;
        req.user = user;
        next();
    })

}

module.exports = { auth, verifyToken };