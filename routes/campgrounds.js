// CAMPGROUND ROUTES

var express     = require("express"),
    router      = express.Router(),
    Campground  = require("../models/campground"),
    middleware  = require("../middleware"), //if it's a link to a directory and the file inside is named "index", then the system will automatically import that file
    NodeGeocoder = require('node-geocoder');
 
//GOOGLE MAPS
var options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null
};
 
var geocoder = NodeGeocoder(options);

//IMAGE UPLOAD
// --MULTER CONFIG
var multer = require('multer');
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter})

// --CLOUDINARY CONFIG
var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'dtcexfxb6', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

//"INDEX" ROUTE - show all campgrounds
router.get("/", function(req, res){
    Campground.find({}, function(err, allCampgrounds){
        if (err) {
            console.log(err);
        } else {
            res.render("campgrounds/index", {campgrounds: allCampgrounds, page: "campgrounds"});
        }
    });
});

//"CREATE" ROUTE - add new campground to database
router.post("/", middleware.isLoggedIn, upload.single('image'), function(req, res){
    // geocoder config
    geocoder.geocode(req.body.campground.location, function (err, data) {
        if (err || !data.length) {
            req.flash('error', 'Invalid address');
            return res.redirect('back');
        }
        req.body.campground.lat = data[0].latitude;
        req.body.campground.lng = data[0].longitude;
        req.body.campground.location = data[0].formattedAddress;
            
        //cloudinary config
        cloudinary.v2.uploader.upload(req.file.path, function(err, result) {
            if (err) {
                req.flash("error", err.message);
                return res.redirect("back");
            }
            // add cloudinary url for the image to the campground object under image property
            req.body.campground.image = result.secure_url;
            // add image's public id to the 'campground' object
            req.body.campground.imageId = result.public_id;
            // add author to campground
            req.body.campground.author = {
                id: req.user._id,
                username: req.user.username
            };  

        // Create a new campground and save to DB
        Campground.create(req.body.campground, function(err, campground){
            if(err){
                 req.flash('failure', err.message);
                 return res.redirect('back');
            } 
            //redirect back to campgrounds page
            res.redirect('/campgrounds/' + campground.id);
        });
        });
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
router.put("/:id", middleware.checkCampgroundOwnership, upload.single("image"), function(req, res){
    Campground.findById(req.params.id, async function(err, campground){
        if (err) {
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            if (req.file) {
                try {
                    // geocoder.geocode(req.body.location, function (err, data) {
                    //     if (err || !data.length) {
                    //         req.flash('error', err.message);
                    //         return res.redirect('back');
                    //     }
                    //     req.body.campground.lat = data[0].latitude;
                    //     req.body.campground.lng = data[0].longitude;
                    //     req.body.campground.location = data[0].formattedAddress;
                    //     console.log("stage 1: " + req.body.campground.lat + " || " + req.body.campground.lng);
                    // });
                    await cloudinary.v2.uploader.destroy(campground.imageId); 
                    var result = await cloudinary.v2.uploader.upload(req.file.path);
                    campground.imageId = result.public_id;
                    campground.image = result.secure_url;
                } catch (err) {
                    req.flash("error", err.message);
                    res.redirect("back");
                }
            }
            geocoder.geocode(req.body.campground.location, function (err, data) {
                if (err || !data.length) {
                    req.flash('error', err.message);
                    console.log(req.body.campground.location + " || " + data);
                    return res.redirect('back');
                }
                campground.lat = data[0].latitude;
                campground.lng = data[0].longitude;
                campground.location = data[0].formattedAddress;
                
                campground.name = req.body.campground.name;
                campground.description = req.body.campground.description;
                campground.cost = req.body.campground.cost;
                campground.save();
                console.log("stage 2: " + campground.lat + " || " + campground.lng);
                req.flash("success","Successfully Updated!");
                res.redirect("/campgrounds/" + campground._id);
            });
        }
    });
});
    
//     geocoder.geocode(req.body.location, function (err, data) {
//         if (err || !data.length) {
//           req.flash('error', 'Invalid address');
//           return res.redirect('back');
//         }
//         req.body.campground.lat = data[0].latitude;
//         req.body.campground.lng = data[0].longitude;
//         req.body.campground.location = data[0].formattedAddress;
        
        
        
//         Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, campground){
//             if(err){
//                 req.flash("error", err.message);
//                 res.redirect("back");
//             } else {
//                 req.flash("success","Successfully Updated!");
//                 res.redirect("/campgrounds/" + campground._id);
//             }
//         });
//     });
// // });

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