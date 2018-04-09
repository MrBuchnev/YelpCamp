// ROOT ROUTE, SIGNUP AND LOGIN ROUTES

var express     = require("express"),
    router      = express.Router(),
    passport    = require("passport"),
    User        = require("../models/user"),
    Campground  = require("../models/campground"),
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
    var newUser = new User({
            username: req.body.username, 
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            avatar: req.body.avatar,
            bio: req.body.bio
        });
    if (req.body.adminCode === "secretcode"){
        newUser.isAdmin = true;
    }
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
    req.flash("success", "You are logged out!");
    res.redirect("/campgrounds");
});

//USERS
//view route
router.get("/users/:id", function(req, res){
   User.findById(req.params.id, function(err, foundUser){
       if (err){
           req.flash("error", "Something went wrong");
           return res.redirect("/");
       }
       Campground.find().where("author.id").equals(foundUser.id).exec(function(err, campgrounds){
          if (err){
              console.log(err);
              return res.redirect("/");
          } 
          res.render("users/show", {user: foundUser, campgrounds: campgrounds});
       });
       
   });
});

//user edit route
router.get("/users/:id/edit", function(req, res){
   User.findById(req.params.id, function(err, foundUser){
        if (err || !foundUser){
            req.flash("error", "User not found");
            return res.redirect("back");
        }
        res.render("users/edit", {user: foundUser});
    }); 
});


module.exports = router;