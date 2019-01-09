const fs=require('fs')

class DBConfig
{
    constructor() {
        //this.userJSON=JSON.parse(fs.readFileSync('config/database.json'))
    }

    static getIns() {
        if(!DBConfig.instance) {
            DBConfig.instance=new DBConfig()
        }

        return DBConfig.instance
    }

    getConfig() {
        return JSON.parse("{}")
        //this.userJSON
    }
}

module.exports=DBConfig