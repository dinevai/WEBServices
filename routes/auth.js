const express = require("express"),
      router = express.Router(),
      passport = require('passport');

const authController = require('../controllers/auth');

const User = require("../models/user");

router.get('/', authController.getLandingPage);

router.get("/auth/admin-login", authController.getAdminLoginPage)

router.post("/auth/admin-login", passport.authenticate("local", {
        successRedirect : "/admin",
        failureRedirect : "/auth/admin-login",
    }), (req, res)=> {
});

router.get("/auth/admin-logout", authController.getAdminLogout);

router.get("/auth/admin-signup", authController.getAdminSignUp);

router.post("/auth/admin-signup", authController.postAdminSignUp);

router.get("/auth/user-login", authController.getUserLoginPage);

router.post("/auth/user-login", passport.authenticate("local", {
        successRedirect : "/user/1",
        failureRedirect : "/auth/user-login",
    }), (req, res)=> {
});

router.get("/auth/user-logout", authController.getUserLogout);

router.get("/auth/user-signUp", authController.getUserSignUp);

router.post("/auth/user-signup", authController.postUserSignUp);

module.exports = router;