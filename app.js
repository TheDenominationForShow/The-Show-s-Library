const express=require('express')
const session=require('express-session')
const MySQLStore=require('express-mysql-session')(session)
const cookieParser=require('cookie-parser')
const bodyParser=require('body-parser')
const fs=require('fs')

let dbOption=JSON.parse(fs.readFileSync('db_config.json'))
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
app.use(cookieParser())
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
app.post('/login',(req,res)=>{
    let name=req.body.uname
    let pass=req.body.upass
    console.log(`name: ${name} pass: ${pass}`)

    res.send({code:-1,msg:"Still WIP"})
    res.end()
})

app.listen(8088)