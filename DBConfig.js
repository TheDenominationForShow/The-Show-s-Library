const fs=require('fs')

class DBConfig
{
    constructor() {
        this.userJSON=JSON.parse(fs.readFileSync('db_config.json'))
    }

    static getIns() {
        if(!DBConfig.instance) {
            DBConfig.instance=new DBConfig()
        }

        return DBConfig.instance
    }

    getConfig() {
        return this.userJSON
    }
}

module.exports=DBConfig