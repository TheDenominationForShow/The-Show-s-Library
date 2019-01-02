const DBConfig=require('./DBConfig')
const mysql=require('mysql')

class UserDao {
    // create table users (username varchar(255), password varchar(255), role int);
    async matchUser(uname,upass) {
        return new Promise((resolve,reject)=>{
            let options=DBConfig.getIns().getConfig()
            options.host='localhost'
            options.database='showlib_session'
            let conn=mysql.createConnection(options)
            conn.connect()
            conn.query('select role as found from users where username=? and password=?',[uname,upass],(err,res)=>{
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
}

module.exports=UserDao