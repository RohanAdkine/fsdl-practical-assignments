module.exports = {
    ensureAuthenticated: function(req, res, next) {
        if (req.session.user || req.session.lawyer || req.session.admin) {
            return next();
        }
        res.redirect('/auth/login');
    },
    ensureUser: function(req, res, next) {
        if (req.session.user && req.session.user.role === 'user') {
            return next();
        }
        res.redirect('/auth/login');
    },
    ensureLawyer: function(req, res, next) {
        if (req.session.lawyer) {
            return next();
        }
        res.redirect('/auth/login');
    },
    ensureAdmin: function(req, res, next) {
        if (req.session.admin || (req.session.user && req.session.user.role === 'admin')) {
            return next();
        }
        res.redirect('/auth/login');
    },
    forwardAuthenticated: function(req, res, next) {
        if (!req.session.user && !req.session.lawyer && !req.session.admin) {
            return next();
        }
        if (req.session.admin) return res.redirect('/admin/dashboard');
        if (req.session.lawyer) return res.redirect('/lawyer/dashboard');
        res.redirect('/user/dashboard');
    }
};
