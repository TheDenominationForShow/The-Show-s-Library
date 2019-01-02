const fs=require('fs')

class PermissionManager {
    constructor() {
        this.permJSON=JSON.parse(fs.readFileSync('config/permissions.json'))
    }

    static getIns() {
        if(!PermissionManager.instance) {
            PermissionManager.instance=new PermissionManager()
        }

        return PermissionManager.instance
    }

    isAllowed(role,permission) {
        return (this.permJSON[role] && this.permJSON[role][permission])
    }
}

module.exports=PermissionManager