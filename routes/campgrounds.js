// CAMPGROUND ROUTES

var express     = require("express"),
    router      = express.Router(),
    Campground  = require("../models/campground"),
    middleware  = require("../middleware"); //if it's a link to a directory and the file inside is named "index", then the system will automatically import that file
    
//"INDEX" ROUTE - show all campgrounds
router.get("/", function(req, res){
    Campground.find({}, function(err, allCampgrounds){
        if (err) {
            console.log(err);
        } else {
            res.render("campgrounds/index", {campgrounds: allCampgrounds});
        }
    });
});

//"CREATE" ROUTE - add new campground to database
router.post("/", middleware.isLoggedIn, function(req, res){
    //get data from form and add to the "campgrounds" array
    var name = req.body.name;
    var img = req.body.image;
    var description = req.body.description;
    var price = req.body.price;
    var author = {
        id: req.user._id,
        username: req.user.username
    };
    var newCampground = {name: name, image: img, description: description, price: price, author: author};
    Campground.create(newCampground, function(err, newlyCreated){
        if (err){
            console.log(err);
        } else {
            //redirect the user back to "/campgrounds"
            res.redirect("/campgrounds"); //redirect is a GET request, so therefore it goes to "app.get("/campgrounds")" 
        }
    });
});

//"NEW" ROUTE - display a form to create new campground
router.get("/new", middleware.isLoggedIn, function(req, res){
   res.render("campgrounds/new"); 
});

//"SHOW" ROUTE  - show info about a particular chosen element
router.get("/:id", function(req, res){
    //find the campgrounds with provided ID
    Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampround){
       if (err || !foundCampround){
           req.flash("error", "Campground not found");
           res.redirect("back");
       } else {
           //render the show template with that campground
           res.render("campgrounds/show", {campground: foundCampround});
           console.log(foundCampround);
       }
    });
});

//"EDIT" ROUTE - edit the previously-created campground
router.get("/:id/edit", middleware.checkCampgroundOwnership, function(req, res){
    Campground.findById(req.params.id, function(err, foundCampround){
        if (err){
            req.flash("error", "Camground doesn't exist");
            res.redirect("/campgrounds");
        } else {
            res.render("campgrounds/edit", {campground: foundCampround});
        }
    });
});

//"UPDATE" ROUTE
router.put("/:id", middleware.checkCampgroundOwnership, function(req, res){
    //find and update the correct campground
    Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, updatedCampground){
        if (err){
            req.flash("error", "Camground doesn't exist");
            res.redirect("/campgrounds");
        } else {
            //redirect to the show page
            res.redirect("/campgrounds/" + req.params.id);
        }
    });
});

//"DESTROY" ROUTE
router.delete("/:id", middleware.checkCampgroundOwnership, function(req, res){
    Campground.findByIdAndRemove(req.params.id, function(err){
        if (err){
            req.flash("error", "Camground doesn't exist");
            res.redirect("/campgrounds");
        } else {
            req.flash("success", "Campground deleted");
            res.redirect("/campgrounds");
        }
    });
});

module.exports = router;