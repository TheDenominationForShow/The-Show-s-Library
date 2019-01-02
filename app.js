const express=require('express')
const session=require('express-session')
const MySQLStore=require('express-mysql-session')(session)
const multer=require('multer')

// cookie-parser is no longer need to play with express-session.
// See https://github.com/expressjs/session 
const cookieParser=require('cookie-parser')
const bodyParser=require('body-parser')
const fs=require('fs')

const DBConfig=require('./DBConfig')
const UserDao=require('./userDao')
const PermissionManager=require('./PermissionManager')

let dbOption=DBConfig.getIns().getConfig()
dbOption.checkExpirationInterval=60000 // 1 min
dbOption.expiration=3600000 // 1 hour
dbOption.connectionLimit=1

dbOption.schema={
    tableName:'sessions',
    columnNames:{
        session_id:'session_id', // primary key
        expires:'expires',
        data:'data'
    }
}

let sessionStorage=new MySQLStore(dbOption)

let app=express()
//app.use(cookieParser())
app.use(bodyParser.urlencoded({extended:true})) // why extended?
app.use(session({
    secret:'TheShowsLibrary-Secret',
    name:'TheShowsLibrary',
    cookie:{maxAge:60000},
    store: sessionStorage,
    resave:false,
    saveUninitialized:false
}))

app.use(express.static('static'))
app.post('/login',async (req,res)=>{
    try {
        let sess=req.session
        let name=req.body.uname
        let pass=req.body.upass
        let loginRet=await (new UserDao).matchUser(name,pass)
        if(loginRet.success) {
            req.session.username=name
            req.session.role=loginRet.role
            res.send({code:0,msg:"success"})
        } else {
            res.send({code:-2,msg:"Username or password mismatch."})
        }
    } catch (e) {
        console.log("Exception: " + e)
        res.send({code:-1,msg:"server internal error."})
    } finally {
        res.end()
    }
})
app.post("/logout",(req,res)=>{
    if(req.session.username) {
        req.session.username=undefined
        res.send({code:0,msg:"success"})
    } else {
        res.send({code:-1,msg:"not login"})
    }
    res.end()
})
app.post("/isLogin",(req,res)=>{
    if(req.session.username) {
        res.send({code:0,msg:"success",isonline:true,username:req.session.username})
    } else {
        res.send({code:0,msg:"success",isonline:false})
    }
    res.end()
})
app.post("/register",async (req,res)=>{
    if(req.session.username) {
        res.send({code:-1,msg:"Operation not allowed."})
    } else {
        if(req.body.uname && req.body.upass) {
            if(req.body.upass.length>=6) {
                try {
                    await (new UserDao).addUser(req.body.uname,req.body.upass,6)
                    res.send({code:0,msg:"success"})
                } catch (e) {
                    res.send({code:-3,msg:"server internal error."})
                }
            } else {
                res.send({code:-2,msg:"password too short."})
            }
        } else {
            res.send({code:-1,msg:"username or password shouldn't be empty."})
        }
    }

    res.end()
})

let upload=multer({
    storage:multer.diskStorage({
        destination: 'static/uploads',
        filename:(req,file,cb)=>{
            cb(null,file.originalname) // It's NOT file.filename
        }
    }),
    fileFilter:(req,file,cb)=>{
        if(req.session.username 
            && PermissionManager.getIns().isAllowed(req.session.role,"allow-file-upload")) {
                console.log("file accepted.")
                cb(null,true)
        } else {
            console.log("file rejected.")
            cb(null,false)
        }
    }
})

// This post handler will only be called after multer's fileFilter.
// If the file is rejected, req.file will be undefined (or null?)
app.post("/upload",upload.single('upload_pdf'),(req,res)=>{
    if(req.file) {
        res.send({code:0,msg:"success"})
    } else {
        res.send({code:-1,msg:"Failed to upload."})
    }

    res.end()
})

app.listen(8088)