import * as tokenRepository from "../repository/token.repository.js"
import * as userService from "../service/user.service.js"
import * as userRepository from "../repository/user.repository.js"
import AppError from "../errors/api.errors.js";
import {compare} from "bcrypt"
import {generateTokens} from "../tokens/JwtGenerating.js";
import jwt from "jsonwebtoken";
import type {TokenPayload, RefreshTokenPayload} from "../types/JwtTokens.type.js"
import type {CreateUserDto} from "../dto/user.dto.js";
export function authErrorHandler(err: any):never {
    if (err.code === "SQLITE_CONSTRAINT") {
        if(err.message.includes("NOT NULL")){
            const field = err.message.split(": ")[2];
            throw new AppError( 400, "BAD_REQUEST", `Field ${field} is required`)
        }
        if(err.message.includes("UNIQUE")){
            const field = err.message.split(": ")[2];
            throw new AppError( 409, "CONFLICT", `That email already exists`)
        }
        if(err.message.includes("FOREIGN KEY")){
            const field = err.message.split(": ")[2];
            throw new AppError( 409, "CONFLICT", `User is used and cannot be deleted`)
        }
    }
    if (err.code === "SQLITE_ERROR") {
        throw new AppError(500, "INTERNAL_ERROR", "Internal server error");
    }
    if (err.code === "SQLITE_CONSTRAINT_NOTNULL") {
        throw new AppError(400, "BAD_REQUEST", "Missing required fields");
    }
    if (err.code === "SQLITE_CONSTRAINT_UNIQUE" && err.message.includes("email")) {
        throw new AppError(409, "CONFLICT", "User with that email already exist");
    }
    if (err.code === "SQLITE_CONSTRAINT_PRIMARYKEY") throw new AppError(409, "CONFLICT", "Primary key conflict");
    if (err.code === "SQLITE_CONSTRAINT_FOREIGNKEY") {
        throw new AppError(409, "CONFLICT", "Foreign key constraint failed");
    }
    if (err.code === "SQLITE_BUSY" || err.code === "SQLITE_LOCKED") {
        throw new AppError(503, "SERVER_ERROR", "Database busy, try again later");
    }
    throw new AppError(500, "SERVER_ERROR", "Internal server error");
}

export async function register(payload:CreateUserDto) {
    const user = await userService.addUser(payload);
    if (!user) throw new AppError(500, "SERVER_ERROR", "Registration failed");
    let {accessToken ,refreshToken} = generateTokens(user.id, user.role);
    await tokenRepository.saveRefreshToken(user.id, refreshToken);
    return {user, accessToken, refreshToken };
}

export async function login (email: string, password: string) {
    if (!email || !password) throw new AppError(400, "BAD_REQUEST", "Email and password are required");
    const user = await userRepository.getUserByEmail(email);
    if (!user) throw new AppError(401, "UNAUTHORIZED", "Invalid password or email");
    const hashPass = user.password;
    let isMatch = false;
    try{
        isMatch = await compare(password, hashPass);
    }catch (err: any) {
        throw new AppError(500, "SERVER_ERROR", "Internal authentication failure");
    }
    if (!isMatch) throw new AppError(401, "UNAUTHORIZED", "Invalid password or email");
    let {accessToken ,refreshToken} = generateTokens(user.id, user.role);
    await tokenRepository.saveRefreshToken(user.id, refreshToken);
    return {user, accessToken, refreshToken };
}
export async function refresh(token: string) {
    const tokenDb = await tokenRepository.getRefreshTokenByToken(token);
    if (!tokenDb) throw new AppError(401, "NOT_FOUND", "Token not found");

    if (tokenDb.revoked_at) throw new AppError(403, "FORBIDDEN", "Token is revoked");

    if (new Date(tokenDb.expires_at) < new Date()) throw new AppError(403, "FORBIDDEN", "Token is expired");

    let payload;
    try{
        payload = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET!) as RefreshTokenPayload;
    }catch (err: any) {
        throw new AppError(401, "UNAUTHORIZED", "Token is invalid or expired");
    }
    const user = await userRepository.getUserById(payload.userId);

    if (!user) throw new AppError(404, "NOT_FOUND", "User with that id not found");

    let {accessToken ,refreshToken} = generateTokens(user.id, user.role);
    await tokenRepository.revokeRefreshToken(token)
    await tokenRepository.saveRefreshToken(user.id, refreshToken);

    return {accessToken, refreshToken};
}
export async function logout(accessToken: string | undefined , refreshToken: string | undefined) {
    if (!accessToken || !refreshToken) throw new AppError(400, "BAD_REQUEST", "Token is required");
    let jwtToken;
    try{
        jwtToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET!) as TokenPayload;
    }catch (err: any) {
        throw new AppError(401, "UNAUTHORIZED", "Invalid token or expired");
    }
    if (!jwtToken ||!jwtToken.jti || !jwtToken.exp) throw new AppError(400, "BAD_REQUEST", "Invalid token");

    const existing =  await tokenRepository.revokeRefreshToken(refreshToken);
    if (!existing) throw new AppError(401, "UNAUTHORIZED", "Invalid token or already revoked");
    await tokenRepository.blacklistAccessToken(jwtToken.jti, jwtToken.exp)
    return {message: "Logged out successfully"};
}