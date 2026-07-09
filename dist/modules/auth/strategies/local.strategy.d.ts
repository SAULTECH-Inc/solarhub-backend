import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';
declare const LocalStrategy_base: new (...args: any[]) => Strategy;
export declare class LocalStrategy extends LocalStrategy_base {
    private auth;
    constructor(auth: AuthService);
    validate(email: string, password: string): Promise<import("../../users/user.entity").User>;
}
export {};
