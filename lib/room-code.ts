import { randomBytes } from "node:crypto";

// 去除易混淆字符（0/O、1/I），房间号手动输入时不误读
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** 生成去歧义的房间号（默认 6 位） */
export function generateRoomCode(length = 6): string {
  const bytes = randomBytes(length);
  let code = "";
  for (let i = 0; i < length; i++) {
    code += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return code;
}
