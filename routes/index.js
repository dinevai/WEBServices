const express = require("express"),
      router = express.Router(),
      passport = require("passport");

const User = require("../models/user");

router.get('/', (req, res) => {
   res.render("landing"); 
});

router.get("/adminLogin", (req, res) => {
   res.render("admin/adminLogin");
});

router.post("/adminLogin", passport.authenticate("local", {
        successRedirect : "/admin",
        failureRedirect : "/adminLogin",
    }), (req, res)=> {
});

router.get("/adminLogout", (req, res) => {
   req.logout();
   res.redirect("/");
});

router.get("/adminSignup", (req, res) => {
   res.render("signup");
});

router.post("/adminSignup", (req, res) => {
   if(req.body.adminCode == "Open Sesame") {
      
      const newAdmin = new User({
      username : req.body.username,
      email : req.body.email,
      isAdmin : true,
   });
   
   User.register(newAdmin, req.body.password, (err, user) =>{
      if(err) {
          req.flash("error", "Given info matches someone registered as User. Please provide different info for registering as Admin");
         return res.render("signup");
      }
      passport.authenticate("local")(req, res, function() {
         req.flash("success", "Hello, " + user.username + " Welcome to Admin Dashboard");
         res.redirect("/admin");
      });
   });
   } else {
      req.flash("error", "Secret word doesn't match!");
      return res.redirect("back");
   }
});

router.get("/userLogin", (req, res) => {
   res.render("user/userLogin");
});

router.post("/userLogin", passport.authenticate("local", {
        successRedirect : "/user/1",
        failureRedirect : "/userLogin",
    }), (req, res)=> {
});

router.get("/userLogout", (req, res) => {
   req.logout();
   res.redirect("/");
});

router.get("/signUp", (req, res) => {
   res.render("user/userSignup");
});

router.post("/signUp", (req, res) => {
   const newUser = new User({
      firstName : req.body.firstName,
      lastName : req.body.lastName,
      username : req.body.username,
      email : req.body.email,
      gender : req.body.gender,
      address : req.body.address,
   });
   
   User.register(newUser, req.body.password, (err, user) =>{
      if(err) {
         return res.render("user/userSignup");
      }
      passport.authenticate("local")(req, res, ()=> {
        
        res.redirect("/user/1");
      });
   });
});

module.exports = router;