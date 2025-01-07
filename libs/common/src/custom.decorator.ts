import { SetMetadata } from "@nestjs/common";
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from "express";


export const RequireLogin = () => SetMetadata('require-login', true);

export const UserInfo = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();

    if (!request.user) {
      return null; // 如果用户信息不存在，返回 null
    }

    // 如果 data 参数存在，返回用户对象的指定属性；否则返回整个用户对象
    return data ? request.user[data] : request.user;
  },
)