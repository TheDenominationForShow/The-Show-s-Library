const DBConfig=require('./DBConfig')
const mysql=require('mysql')

class BookDao {
    newBook(bookid,realname) {
        return new Promise((resolve,reject)=>{
            let options=DBConfig.getIns().getConfig()
            let conn=mysql.createConnection(options)
            conn.connect()
            conn.query("insert into books values (?,?)",[bookid,realname],(err,res)=>{
                if(err) return reject(err)
                else return resolve()
            })
        })
    }
}