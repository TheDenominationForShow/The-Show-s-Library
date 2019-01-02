const express=require('express')
const session=require('express-session')
const MySQLStore=require('express-mysql-session')(session)

// cookie-parser is no longer need to play with express-session.
// See https://github.com/expressjs/session 
const cookieParser=require('cookie-parser')
const bodyParser=require('body-parser')
const fs=require('fs')

const DBConfig=require('./DBConfig')
const UserDao=require('./userDao')

let dbOption=DBConfig.getIns().getConfig()
dbOption.host='localhost'
dbOption.port='3306'
dbOption.database='showlib_session'
dbOption.checkExpirationInterval=60000 // 1 min
dbOption.expiration=3600000 // 1 hour
dbOption.connectionLimit=1
dbOption.schema={
    tableName:'sessions',
    columnNames:{
        session_id:'session_id',
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
        let loginOK=await (new UserDao).matchUser(name,pass)
        if(loginOK) {
            req.session.username=name
            res.send({code:0,msg:"success"})
        } else {
            res.send({code:-1,msg:"Username or password not match."})
        }
    } catch (e) {
        console.log("Exception: " + e)
    } finally {
        res.end()
    }
})
app.get("/isLogin",(req,res)=>{
    if(req.session.username) {
        res.send({code:0,msg:"success",result:`login as ${req.session.username}`})
    } else {
        res.send({code:0,msg:"success",result:"not login"})
    }
    res.end()
})

app.listen(8088)