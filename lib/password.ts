import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/**
 * 房间密码的加盐哈希（scrypt）。返回 "salt:hash" 十六进制形式。
 * 同步版即可——房间密码为低频操作，避免引入异步包装。
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

/** 校验密码是否匹配已存哈希（恒定时间比较，防时序攻击） */
export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return (
    candidate.length === expected.length && timingSafeEqual(candidate, expected)
  );
}
