const express = require("express");
const mongoose=require('mongoose')
const request =require('request')
const app = express();
require("dotenv").config();
const bcrypt = require("bcrypt");
const _=require('lodash')
const payStack=require('./config/paystack')
const User = require("./models/user");
const {initializePayment, verifyPayment} = require('./config/paystack')(request);
const CheckOut=require("./models/checkOutDetails")
const Payment=require("./models/payment")
const paystack=require('paystack')('secret_key')
const port = process.env.PORT || 8080;

mongoose
    .connect(process.env.MONGOURL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then((result) => {
        app.listen(
            process.env.PORT,
            console.log(`server listening on http://localhost:${port}`)
        );
    })
    .catch((err) => console.log(err.message));
    // MIDDLEWARES
app.set("view engine","ejs")
app.use(express.json());
// GET REQUEST FOR HOME PAGE
app.get("/", (req, res) => {
    res.render('index')
});
app.post("/signup", async (req, res) => {
    const { username, password, role } = req.body;
    const hashpwd = await bcrypt.hash(password, 12);
    if (!username && !password && !role) {
        console.log(`Please make sure to fill in the details`);
    } else {
        const userObj = new User({
            username,
            password: hashpwd,
            role,
        });
        await userObj.save();
        res.send(`User saved successfully...`).status(200);
        res.end
    }
});
// POST REQUEST FOR THE LOGIN
app.post("/login", async(req, res) => {
    const {username,password}=req.body
    const usrLogin=await User.findOne({username});
   if(!usrLogin){
    return res.status(404).send(`no such user`);  
   }
   const isMatch=await bcrypt.compare(password,usrLogin.password)
   console.log(isMatch);
   if(!isMatch){
    return res.status(404).send(`wrong username and password`);
   }
   res.send(`loged in successfully as ${usrLogin.username}`)
});

// POST REQUEST FOR CHECKOUT
app.post('/checkout',async(req,res)=>{
    const {email,address,name,location}=req.body
    try {
        if(!email||!address||!name||!location){
            res.status(404).send(`fill the form`);
            res.end()
        }
        const checkOutObj=new CheckOut({
            email,
            address,
            name,
            location
        })
        await checkOutObj.save();
        res.status(200).send(`chekout made....`)
        res.end()
    } catch (error) {
        if(error.name==="ValidationError"){
            // let errors={}
            console.log(error);
        }
    }
})
// PAYSTACK API CONNECT
app.post('/paystack/pay',(req,res)=>{
    const form=_.pick(req.body['email','amount','firstname','lastname'])
    form.metadata={
        fullname:form.firstname + form.lastname
    }
    form.amount*=100;
    initializePayment(form, (error, body)=>{
        if(error){
            //handle errors
            console.log(error);
            return res.redirect('/error')
            return;
        }
        response = JSON.parse(body);
        console.log(response);
        console.log(response.data.authorization_url);

        res.redirect(response.data.authorization_url)
        // res.redirect('/')
    });
})

app.get('/paystack/callback', (req,res) => {
    const ref = req.query.reference;
    verifyPayment(ref, (error,body)=>{
        if(error){
            //handle errors appropriately
            console.log(error)
            return res.redirect('/error');
        }
        response = JSON.parse(body);        

        const data = _.at(response.data, ['reference', 'amount','customer.email', 'metadata.full_name']);

        [reference, amount, email, full_name] =  data;
        
        newPayment = {reference, amount, email, full_name}

        const pay = new Payment(newPayment)

        pay.save().then((donor)=>{
            if(!donor){
                return res.redirect('/error');
            }
            res.redirect('/receipt/'+pay._id);
        }).catch((e)=>{
            res.redirect('/error');
        })
    })
})
// app.listen(port, console.log(`server listening on http://localhost:${port}`));
