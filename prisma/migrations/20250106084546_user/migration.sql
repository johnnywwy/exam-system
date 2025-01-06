-- 创建表 user 并添加注释
CREATE TABLE `user` (
    `id` INTEGER NOT NULL AUTO_INCREMENT COMMENT '用户主键', 
    `username` VARCHAR(50) NOT NULL COMMENT '用户名',
    `password` VARCHAR(50) NOT NULL COMMENT '密码',
    `email` VARCHAR(50) NOT NULL COMMENT '邮箱',
    `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
    `update_time` DATETIME(3) NOT NULL COMMENT '更新时间',

    UNIQUE INDEX `user_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
COMMENT='用户表'; -- 表注释
