// ROOT ROUTE, SIGNUP AND LOGIN ROUTES

var express     = require("express"),
    router      = express.Router(),
    passport    = require("passport"),
    User        = require("../models/user"),
    middleware  = require("../middleware");
  
//root route
router.get("/", function(req, res){
    res.render("landing");
});

//register form route
router.get("/register", function(req, res){
   res.render("register", {page: "register"}); 
});

//handle signup logic
router.post("/register", function(req, res){
    var newUser = new User({username: req.body.username});
    User.register(newUser, req.body.password, function(err, user){
        if(err){
            console.log(err);
            return res.render("register", {error: err.message});
        }
        passport.authenticate("local")(req, res, function(){
            req.flash("success", "Hi, " + user.username + "! Welcome to YelpCamp!");
            res.redirect("/campgrounds");
        });
    });
});

//login route
router.get("/login", function(req, res){
   res.render("login", {page: "login", message: req.flash("error")}); 
});

//handle login logic
router.post("/login", passport.authenticate("local", 
    {
        successRedirect: "/campgrounds",
        failureRedirect: "/login" 
    }), function(req, res){
});

//logout route
router.get("/logout", function(req, res){
    req.logout();
    req.flash("error", "You are logged out!");
    res.redirect("/campgrounds");
});

module.exports = router;