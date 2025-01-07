import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';
import { Request, Response } from 'express';

interface JwtUserData {
  userId: number;
  username: string;
}

declare module 'express' {
  interface Request {
    user: JwtUserData,
  }
}

@Injectable()
export class AuthGuard implements CanActivate {

  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService, // 通过 constructor 注入依赖
  ) { }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const response: Response = context.switchToHttp().getResponse();

    const requireLogin = this.reflector.getAllAndOverride<boolean>('require-login', [
      context.getClass(),
      context.getHandler(),
    ]);

    if (!requireLogin) {
      return true;
    }

    const authorization = request.headers.authorization

    if (!authorization) {
      throw new UnauthorizedException('用户未登录');
    }

    try {
      const token = authorization.split(' ')[1];
      const data = this.jwtService.verify<JwtUserData>(token);

      // 将解析后的用户数据挂载到 request 对象上
      (request as any).user = {
        userId: data.userId,
        username: data.username,
      };

      response.header('token', this.jwtService.sign({
        userId: data.userId,
        username: data.username
      }, {
        expiresIn: '7d'
      }))


      return true;
    } catch (e) {
      throw new UnauthorizedException('token 失效，请重新登录');
    }
  }
}
