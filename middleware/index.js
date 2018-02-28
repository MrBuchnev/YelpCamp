// ALL MIDDLEWARE GOES HERE

var Campground = require("../models/campground");
var Comment = require("../models/comment");
var middlewareObject = {};

middlewareObject.checkCampgroundOwnership = function(req, res, next){
    if (req.isAuthenticated()){
        Campground.findById(req.params.id, function(err, foundCampround){
            if (err || !foundCampround){
                req.flash("error", "Camground doesn't exist");
                res.redirect("back");
            } else {
                // does user own the campground
                if (foundCampround.author.id.equals(req.user._id)){  //"foundCampground.author.id" is an mongoose object, while "req.user._id" is a String. Mongoose has a function .equals(), which can compare those two values.
                    next();
                } else {
                    req.flash("error", "You don't have permission to do that");
                    res.redirect("back");
                }
            }
        });
    } else {
        req.flash("error", "You need to be logged in to do that");
        res.redirect("back");
    }
};

middlewareObject.checkCommentOwnership = function(req, res, next){
    if (req.isAuthenticated()){
        Comment.findById(req.params.comment_id, function(err, foundComment){
            if (err || !foundComment){
                req.flash("error", "Comment not found");
                res.redirect("back");
            } else {
                // does user own the comment?
                if (foundComment.author.id.equals(req.user._id)){  //"foundCampground.author.id" is an mongoose object, while "req.user._id" is a String. Mongoose has a function .equals(), which can compare those two values.
                    next();
                } else {
                    req.flash("error", "You don't have permission to do that");
                    res.redirect("back");
                }
            }
        });
    } else {
        req.flash("error", "You need to be logged in to do that");
        res.redirect("back");
    }
};

middlewareObject.isLoggedIn = function (req, res, next){
    if (req.isAuthenticated()){
        return next();
    }
    req.flash("error", "You need to be logged in to do that");
    res.redirect("/login");
};

module.exports = middlewareObject;