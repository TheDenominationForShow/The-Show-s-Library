# The Show's Library 开发者文档

## 数据库

### config/database.json

此文件应包含一个格式如下的json:

```json
{
    "user":"MySQL数据库用户名",
    "password":"用户登录密码",
    "host":"localhost",
    "port":3306,
    "database":"数据库名称"
}
```

这个文件不会被git跟踪，请不要在项目的任何其他位置填写数据库用户名和密码。

### 建表语句

```sql
create table sessions (session_id varchar(255) primary key,expires int,data varchar(255));

create table users (username varchar(255) primary key, password varchar(255), role int);
```

## 权限控制

根据`users`表中`role`字段控制:

    0 超级管理员
    1 管理员 (日常管理建议等级)
    2~4 受限管理员
    5 普通用户 (新用户注册默认等级)
    6 受限用户

### config/permissions.json

`allow-file-upload` 允许文件上传