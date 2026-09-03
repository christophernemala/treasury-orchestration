import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { store } from '../store/memoryStore.js';
import type { Role } from '../models.js';
import { accessForRole, type Permission } from '../modules/access/policy.js';
const challenges=new Map<string,{userId:string;expires:number}>();
const secret=process.env.JWT_SECRET||crypto.randomBytes(32).toString('hex');
export async function startLogin(email:string,password:string){const user=store.state.users.find(u=>u.email.toLowerCase()===email.toLowerCase());if(!user||!(await bcrypt.compare(password,user.passwordHash)))return null;const challengeId=crypto.randomUUID();challenges.set(challengeId,{userId:user.id,expires:Date.now()+5*60_000});return {challengeId,devOtp:process.env.NODE_ENV==='production'?undefined:(process.env.DEV_OTP||'246810')}}
export function verifyOtp(challengeId:string,otp:string){const challenge=challenges.get(challengeId);if(!challenge||challenge.expires<Date.now()||otp!==(process.env.DEV_OTP||'246810'))return null;challenges.delete(challengeId);const user=store.state.users.find(u=>u.id===challenge.userId)!;const access=accessForRole(user.role);const claims={sub:user.id,role:user.role,email:user.email,...access};const token=jwt.sign(claims,secret,{expiresIn:'8h'});return {token,user:{id:user.id,email:user.email,name:user.name,role:user.role,onboarded:user.onboarded,...access}}}
export function verifyToken(token:string){return jwt.verify(token,secret) as {sub:string;role:Role;email:string;permissions?:Permission[];legalEntityIds?:string[]}}
