const express=require('express')
const session=require('express-session')
const MySQLStore=require('express-mysql-session')(session)
const multer=require('multer')
const crypto=require('crypto')
const uuid=require('uuid/v4') // Random uuid

// cookie-parser is no longer need to play with express-session.
// See https://github.com/expressjs/session 
const cookieParser=require('cookie-parser')
const bodyParser=require('body-parser')
const fs=require('fs')
const path=require('path')
const promisify=require('util').promisify

const DBConfig=require('./DBConfig')
const UserDao=require('./userDao')
const BookDao=require('./bookDao')
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
    cookie:{maxAge:300000}, // 5 min
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

function getFileHash(filepath) {
    return new Promise((resolve,reject)=>{
        let stream=fs.createReadStream(filepath)
        // Algorithm changed to sha256 to avoid sha-1 collision.
        let hash=crypto.createHash('sha256')
        stream.on('data',(data)=>{
            hash.update(data)
        })
        stream.on('end',()=>{
            resolve(hash.digest('hex'))
        })
    })
}

let upload=multer({
    storage:multer.diskStorage({
        destination: "temp",
        filename:(req,file,cb)=>{
            let this_id=uuid()
            console.log(`${file.originalname} --upload--> ${this_id}`)
            cb(null,this_id) // Do not use file.filename, it is undefined.
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
app.post("/upload",upload.single('upload_pdf'),async (req,res)=>{
    if(req.file) {
        try {
            let hash=await getFileHash(req.file.path)
            // TODO
            // This will overwrite the existing same hash named file on disk.
            // But, with the same hash value, these two files are the same. Right?
            await promisify(fs.rename)(req.file.path,path.join("objects",hash))
            console.log(`${req.file.filename} -> ${hash} (Original name: ${req.file.originalname})`)

            await (new BookDao).newBook(hash,req.file.originalname)
            res.send({code:0,msg:"success",fileid:hash})
        } catch (e) {
            console.log(`Upload Exception: ${e.toString()}`)
            res.send({code:-2,msg:"server internal error"})
        }
    } else {
        res.send({code:-1,msg:"Failed to upload."})
    }

    res.end()
})

// TODO
// This api is still under developing.
app.post("/download",(req,res)=>{
    if(req.body.fileid && req.session.username && 
        PermissionManager.getIns().isAllowed(req.session.role,"allow-file-download") ) {
        let filename=path.join(__dirname,"static","uploads",req.body.fileid)
        fs.exists(filename,(isExists)=>{
            if(isExists) res.sendFile(filename)
            else res.status(404).end("Sorry, the requested file is not on this server.")
        })
    } else {
        res.status(403).end("Sorry, login is required to download this file.")
    }
})

async function CleanDanglingObject() {
    let files=await promisify(fs.readdir)("objects")
    let barr=await (new BookDao).listBookID()

    return new Promise((resolve,reject)=>{
        let total=0
        let done=0
        let errArr=new Array

        // JS for is synchronous, so total/done would work. (?)
        // foreach val in files: if !(val in barr) delete it
        for(let i=0;i<files.length;i++) {
            // Use indexOf instead of findIndex (or call with a compare function!)
            if(barr.indexOf(files[i])<0) {
                ++total
                console.log(`Removing object: ${files[i]}...`)
                fs.unlink(path.join("objects",files[i]),(err)=>{
                    if(err) {
                        errArr.push(err.toString())
                    }

                    ++done

                    if(done==total) {
                        if(errArr.length==0) {
                            resolve(total)
                        } else {
                            reject({total:total,errs:errArr})
                        }
                    }
                })
            }
        }

        console.log(`total: ${total} done: ${done}`) // done is expected to be 0.
        if(total==0) {
            return resolve(0)
        }
    })
}

// TODO,WIP
// Admin API
app.post("/cleanobj",async (req,res)=>{
    if(req.session.username && 
        PermissionManager.getIns().isAllowed(req.session.role,"allow-object-clean") ) {
        console.log("Performing object cleaning...")
        try {
            let total=await CleanDanglingObject()
            res.send({code:0,msg:"success",total:total})
        } catch (e) {
            if(e.total && e.errs) {
                res.send({code:-2,msg:"server runtime error",total:e.total,errs:e.errs})
            } else {
                res.send({code:-2,msg:"general error",err:e.toString()})
                console.log(e)
            }
        }
    } else {
        res.send({code:-1,msg:"Permission denied"})
    }

    res.end()
})

app.listen(8088,async ()=>{
    console.log("server started.")
    await promisify(fs.mkdir)("objects",{recursive:true})
})