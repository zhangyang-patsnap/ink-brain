import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import path from "node:path";
import { atomicJson, readJson } from "./store.mjs";

export function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  return { salt, hash: scryptSync(password, salt, 64).toString("hex") };
}
export async function createAuth({ dir, origin, initialPassword, allowSetup }) {
  const file = path.join(dir, "owner.json");
  let owner = await readJson(file, null);
  if (!owner && initialPassword) {
    if (initialPassword.length < 6 || initialPassword.length > 256)
      throw new Error("ADMIN_PASSWORD 长度应为 6–256 个字符");
    owner = hashPassword(initialPassword);
    await atomicJson(file, owner);
  }
  if (!owner && !allowSetup)
    throw new Error("远程运行前必须通过 ADMIN_PASSWORD 配置初始密码");
  const sessions = new Map(),
    attempts = new Map();
  const secure = new URL(origin).protocol === "https:";
  const cookieName = secure ? "__Host-inkbrain" : "inkbrain-session";
  const attrs = `Path=/; HttpOnly; SameSite=Strict${secure ? "; Secure" : ""}`;
  const prune = () => {
    const now = Date.now();
    for (const [key, s] of sessions) if (s.expires < now) sessions.delete(key);
    for (const [key, a] of attempts) if (a.until < now) attempts.delete(key);
  };
  function session(req) {
    prune();
    const cookie = (req.headers.cookie ?? "")
      .split(";")
      .map((s) => s.trim())
      .find((s) => s.startsWith(cookieName + "="));
    return cookie
      ? sessions.get(cookie.slice(cookieName.length + 1))
      : undefined;
  }
  function trusted(req, res, next) {
    if (
      req.headers.origin !== origin ||
      (req.headers["sec-fetch-site"] &&
        !["same-origin", "none"].includes(req.headers["sec-fetch-site"]))
    )
      return res
        .status(403)
        .json({ error: "请求来源不可信，请从后台页面操作" });
    next();
  }
  function requireAuth(req, res, next) {
    req.ownerSession = session(req);
    if (!req.ownerSession) return res.status(401).json({ error: "请先登录" });
    next();
  }
  function csrf(req, res, next) {
    if (req.headers["x-csrf-token"] !== req.ownerSession?.csrf)
      return res.status(403).json({ error: "会话校验失败，请刷新后重试" });
    next();
  }
  function issue(res) {
    const token = randomBytes(32).toString("hex");
    const data = {
      token,
      csrf: randomBytes(32).toString("hex"),
      expires: Date.now() + 8 * 3600000,
    };
    sessions.set(token, data);
    res.setHeader(
      "Set-Cookie",
      `${cookieName}=${token}; ${attrs}; Max-Age=28800`,
    );
    return { authenticated: true, csrf: data.csrf };
  }
  return {
    trusted,
    requireAuth,
    csrf,
    session,
    configured: () => !!owner,
    async setup(req, res) {
      if (owner || !allowSetup)
        return res.status(403).json({ error: "初始化已关闭" });
      const password = req.body?.password;
      if (
        typeof password !== "string" ||
        password.length < 6 ||
        password.length > 256
      )
        return res.status(400).json({ error: "密码长度应为 6–256 个字符" });
      // Set in memory before awaiting disk so two setup requests cannot claim ownership.
      owner = hashPassword(password);
      try {
        await atomicJson(file, owner);
      } catch (e) {
        owner = null;
        throw e;
      }
      res.json(issue(res));
    },
    login(req, res) {
      prune();
      const key = req.socket.remoteAddress;
      const attempt = attempts.get(key) ?? {
        count: 0,
        until: Date.now() + 15 * 60000,
      };
      if (attempt.count >= 5)
        return res
          .status(429)
          .json({ error: "尝试次数过多，请 15 分钟后重试" });
      attempt.count++;
      attempts.set(key, attempt);
      const password = req.body?.password;
      if (
        !owner ||
        typeof password !== "string" ||
        password.length > 256 ||
        !timingSafeEqual(
          scryptSync(password, owner.salt, 64),
          Buffer.from(owner.hash, "hex"),
        )
      )
        return res.status(401).json({ error: "密码不正确" });
      attempts.delete(key);
      if (req.ownerSession) sessions.delete(req.ownerSession.token);
      res.json(issue(res));
    },
    logout(req, res) {
      sessions.delete(req.ownerSession.token);
      res.setHeader("Set-Cookie", `${cookieName}=; ${attrs}; Max-Age=0`);
      res.json({ ok: true });
    },
  };
}
