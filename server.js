const express=require("express");
const expressSession=require("express-session");
const cookieParser=require("cookie-parser");
const {OAuthClient}=require("vk-auth-library");
require("dotenv").config();

const app=express();
app.set("port",process.env.PORT||3000);
const port=app.get("port");

app.set("secret",process.env.SECRET||"secret_passcode");

app.use(express.static("public"));
app.use(express.urlencoded({
    extended:false
}));
app.use(express.json());

//Add Session Related middlewares
app.use(cookieParser(app.get("secret")));

app.use(expressSession({
    secret:app.get("secret"),
    cookie:{
        maxAge:4000000
    },
    saveUninitialized:false,
    resave:false 
}));

//Login Page
app.get("/auth/vk",(req,res)=>{
    
    const code=req.query.code;
    if (!code) {
       res.send(`code query string should be provided`);
    }
    const client_id=process.env.VK_CLIENT_ID;
    const client_secret=process.env.VK_CLIENT_SECRET;
    const redirect_uri=process.env.VK_REDIRECT_URI;
    const client=OAuthClient(client_id,client_secret,redirect_uri);
    client.verifyUserData(code).then(result=>{
        const {user_id,access_token,user}=result;
        req.session.access_token=access_token;
        req.session.user_id=user_id;
        req.session.user=JSON.stringify(user);
        res.cookie("vkAuth","vk").send(`Dear ${user.first_name}; You logined successfully, now you can navigate all page <a href='/'>Home</a>`);
    }).catch(err=>res.send("Something is wrong"));

});

//Middlewares that check user login and then allow to forward in case of lohin authenticated
app.use((req,res,next)=>{
    if (req.session.user) {
        req.user=JSON.parse(req.session.user);
        next();
    }
    else {
        res.status(401).send("Please login first from <a href='/'>login page</a>");   
    }
     
})

app.get("/sensitive",(req,res)=>{
    res.send(`Sensitive Information is placed Here,Dear ${req.user.first_name}` );
});

app.get("/auth/signout",(req,res)=>{res.clearCookie("vkAuth").send("You logged In successfully")});

app.get("*",(req,res)=>{res.json(req.user)});




const server=app.listen(port,()=>{
    console.log(`Server Started at http://localhost:${port}`);
});
