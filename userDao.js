const DBConfig=require('./DBConfig')
const mysql=require('mysql')

class UserDao {
    matchUser(uname,upass) {
        return new Promise((resolve,reject)=>{
            let options=DBConfig.getIns().getConfig()
            let conn=mysql.createConnection(options)
            conn.connect()
            conn.query('select role from users where username=? and password=?',[uname,upass],(err,res)=>{
                if(err) return reject(err)
                else if(res.length==1) {
                    return resolve({success:true,role:res[0].role})
                } else {
                    return resolve({success:false})
                }
            })
            conn.end()
        })
    }

    addUser(uname,upass,role) {
        return new Promise((resolve,reject)=>{
            let options=DBConfig.getIns().getConfig()
            let conn=mysql.createConnection(options)
            conn.connect()
            conn.query('insert into users values (?,?,?)',[uname,upass,role],(err,res)=>{
                if(err) return reject(err)
                return resolve()
            })
            conn.end()
        })
    }
}

module.exports=UserDao