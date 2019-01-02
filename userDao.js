const DBConfig=require('./DBConfig')
const mysql=require('mysql')

class UserDao {
    async matchUser(uname,upass) {
        return new Promise((resolve,reject)=>{
            let options=DBConfig.getIns().getConfig()
            options.host='localhost'
            options.database='showlib_session'
            let conn=mysql.createConnection(options)
            conn.connect()
            conn.query('select count(username) as found from users where username=? and password=?',[uname,upass],(err,res)=>{
                if(err) return reject(err) 
                else if(res[0].found==1) {
                    return resolve(true)
                } else {
                    return resolve(false)
                }
            })
            conn.end()
        })
    }
}

module.exports=UserDao