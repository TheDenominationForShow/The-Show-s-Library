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
            conn.end()
        })
    }

    listBookID() {
        return new Promise((resolve,reject)=>{
            let options=DBConfig.getIns().getConfig()
            let conn=mysql.createConnection(options)
            conn.connect()
            conn.query("select bookid from books",(err,res)=>{
                if(err) return reject(err)
                else
                {
                    // res has length and can be indexed... just like an Array, yes? but...
                    let arr=new Array
                    for(let i=0;i<res.length;i++) {
                        arr.push(res[i].bookid)
                    }
                    return resolve(arr)
                }
            })
            conn.end()
        })
    }
}

module.exports=BookDao