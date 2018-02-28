var express     = require("express"),
    router      = express.Router({mergeParams: true}),
    Campground  = require("../models/campground"),
    Comment     = require("../models/comment"),
    middleware  = require("../middleware");
  
// Comments NEW
router.get("/new", middleware.isLoggedIn, function(req, res){
    //find a campground by ID
    Campground.findById(req.params.id, function(err, campground){
        if (err) {
            console.log (err);
        } else {
            res.render("comments/new", {campground: campground});   
        }
    });
});

// Comments CREATE
router.post("/", middleware.isLoggedIn, function(req, res){
  //look up the campground using ID
   Campground.findById(req.params.id, function(err, campground){
       if (err) {
           console.log(err);
           res.redirect("/campgrounds");
       } else {
            //create new comment
            Comment.create(req.body.comment, function(err, comment) {
               if (err) {
                   req.flash("error", "Sorry, something went wrong");
                   console.log(err);
               } else {
                //add username and id to comment
                comment.author.id = req.user._id;
                comment.author.username = req.user.username;
                //save comment
                comment.save();
                //connect new comment to campground
                campground.comments.push(comment._id);
                campground.save();
                //redirect to campground show page
                req.flash("success", "Comment added");
                res.redirect("/campgrounds/" + campground._id);
               }
            });
       }
    });
});

// Comments EDIT
router.get("/:comment_id/edit", middleware.checkCommentOwnership, function(req, res){
    Campground.findById(req.params.id, function(err, foundCampground){
        if (err || !foundCampground){
            req.flash("error", "Campground not found");
            return res.redirect("back");
        }
        Comment.findById(req.params.comment_id, function(err, foundComment){
            if (err){
                res.redirect("back");
            } else {
                res.render("comments/edit", {campground_id: req.params.id, comment: foundComment});
            }
        });
    });
});

// Comments UPDATE
router.put("/:comment_id", middleware.checkCommentOwnership, function(req, res){
    Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, updatedComment){
       if (err){
           res.redirect("back");
       } else {
           res.redirect("/campgrounds/" + req.params.id);
       }
    });
});

// Comments DESTROY
router.delete("/:comment_id", middleware.checkCommentOwnership, function(req, res){
    Comment.findByIdAndRemove(req.params.comment_id, function(err){
        if (err){
            req.flash("error", "Comment not found");
            res.redirect("back");
        } else {
            req.flash("success", "Comment deleted");
            res.redirect("back");
        }
    });
});

module.exports = router;