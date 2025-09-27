const express = require('express');
const app = express();
const mongoose = require('mongoose');
const Listing = require("./models/listing.js");
const path = require('path');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const {listingSchema} = require("./schema.js");

app.use(methodOverride("_method"));
app.use(express.urlencoded({ extended: true })); // Middleware for form data
app.set("view engine","ejs");
app.set("views",path.join(__dirname,"/views"));
app.engine("ejs",ejsMate)
app.use(express.static(path.join(__dirname,"/public")));




const MONGO_URL= 'mongodb://127.0.0.1:27017/wanderlust';

main()
    .then(()=>{
        console.log("connected to DB");
    }).catch(err => console.log(err));

    async function main() {
        await mongoose.connect(MONGO_URL);
}

app.get("/",(req,res)=>{
    res.send("This is root");
});

const validateListing = (req,res,next)=>{
    let {error} = listingSchema.validate(req.body);
        if(error){
            let errMsg = error.details.map((el)=>el.message).join(",")
            throw new ExpressError(404,errMsg);
        }else{
            next();
        }
}

// app.get("/testListing",async(req,res)=>{
//     let sampleListing = new Listing({
//         title:"My New Villa",
//         description:"By the beach",
//         price:1200,
//         location:"Calangute,Goa",
//         country:"India"
//     });
//     await sampleListing.save();
//     console.log("sample was saved");
//     res.send("successful testing");
// });

//Index Route
app.get("/listings",wrapAsync(async(req,res)=>{
    const allListings = await Listing.find({});
    res.render("listings/index.ejs",{allListings });
}));

//new route
app.get("/listings/new",async(req,res)=>{
    // let {id} = req.params;
    // const listing = await Listing.findById(id); 
    res.render("listings/new.ejs");
});


//Show Route
app.get("/listings/:id",wrapAsync(async(req,res)=>{
    let {id} = req.params;
    const listing = await Listing.findById(id); 
    res.render("listings/show.ejs",{listing});
}));

//Create route
app.post("/listings",validateListing,
    wrapAsync(async(req,res)=>{
    // let{title,description,image,price,country,location} = req.body;
    // let listing = req.body.listing;
    // new Listing[listing];
        let result = listingSchema.validate(req.body);
        console.log(result);
        if(result.error){
            throw new ExpressError(404,result.error);
        }
        const newListing = new Listing(req.body.listing); //new instance created
        await newListing.save()
        res.redirect("/listings");
}));

//edit route
app.get("/listings/:id/edit",wrapAsync(async(req,res)=>{
    let {id} = req.params;
    const listing = await Listing.findById(id); 
    res.render("listings/edit.ejs",{listing});
}));


//update route
app.put("/listings/:id",validateListing, wrapAsync(async (req, res) => {
    let { id } = req.params;
    await Listing.findByIdAndUpdate(id, { ...req.body.listing });  // reconstructing
    res.redirect(`/listings/${id}`);
}));


//delete route
app.delete("/listings/:id",wrapAsync(async(req,res)=>{
    let {id} = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);  
    console.log(deletedListing);
    res.redirect("/listings");
}));

// app.all("*", (req, res, next) => {
//     next(new ExpressError(404, "Page Not Found"));
// });

//custom middleware
app.use((err,req,res,next)=>{
    let{statusCode=500,message = "Something went wrong!"} = err;
    // res.status(statusCode).send(message);
    res.status(statusCode).render("error.ejs",{message,err});
});


app.listen(8080,()=>{
    console.log("Server is running on port 8080");
})