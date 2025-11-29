








import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import {
  exchangeCodeForSessionToken,
  getOAuthRedirectUrl,
  authMiddleware,
  deleteSession,
  SESSION_TOKEN_COOKIE_NAME,
  sendOTP,
  verifyOTP,
  getCurrentUser,
} from "@hey-boss/users-service/backend";
import { CustomerService } from "../shared/customers-service";
import chatpetsAiRoutes from "./routes/chatpets-ai";

const app = new Hono<{
  Bindings: {
    DB: D1Database;
    ASSETS: Fetcher;
    API_KEY: string;
    USER_ID: string;
    PROJECT_ID: string;
    USER_EMAIL: string;
    AUTH_KEY: string;
  };
}>();

// =================================================================
// == AI-ASSISTANT / DEVELOPER: DO NOT MODIFY THE CODE BELOW      ==
// =================================================================
//
// The following four routes handle critical user authentication logic.
// They are essential for user login, session creation, and logout.
// Any changes to this section can break the entire authentication flow.
//
// PROTECTED ROUTES:
// - GET /api/oauth/google/redirect_url
// - POST /api/sessions
// - GET /api/users/me
// - GET /api/logout
// - POST /api/send-otp
// - POST /api/verify-otp
//
// Please add any new routes AFTER this block.
// =================================================================
const SHOPPING_SERVICE_ENDPOINT = "https://shopping.heybossai.com";

app.get("/api/oauth/google/redirect_url", async (c) => {
  const origin = c.req.query("originUrl") || "";
  const redirectUrl = await getOAuthRedirectUrl("google", {
    originUrl: origin,
  });

  return c.json({ redirectUrl }, 200);
});

app.post("/api/sessions", async (c) => {
  const body = await c.req.json();

  if (!body.code) {
    return c.json({ error: "No authorization code provided" }, 400);
  }

  const sessionToken = await exchangeCodeForSessionToken(
    body.code,
    c.env.PROJECT_ID
  );

  // Get user info and save to customers table
  try {
    const user = await getCurrentUser(sessionToken);
    if (user && user.email) {
      const customerResult = await CustomerService.save(c.env.DB, {
        formData: {
          email: user.email,
          email_verified: true, // Google accounts are verified
          email_consent: true, // Default for authenticated users
        },
        source: "google-oauth",
      });
      console.log("save customer result (Google OAuth)", customerResult);
    }
  } catch (error) {
    // Log error but don't fail the login
    console.error("Failed to save customer after Google login:", error);
  }

  setCookie(c, SESSION_TOKEN_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true,
    maxAge: 1 * 24 * 60 * 60, // 1 days
  });

  return c.json({ success: true }, 200);
});

app.get("/api/users/me", authMiddleware, async (c) => {
  //@ts-ignore
  const user = c.get("user");
  const db = c.env.DB;
  
  // Fetch additional profile info from users table if exists
  const userRecord = await db.prepare("SELECT name, picture FROM users WHERE email = ?").bind(user.email).first();
  
  return c.json({
    ...user,
    name: userRecord?.name || user.name,
    picture: userRecord?.picture || user.picture,
  });
});

app.patch("/api/users/me", authMiddleware, async (c) => {
  const user = c.get("user") as any;
  const body = await c.req.json();
  const db = c.env.DB;
  const { name, picture } = body;

  // Check if user exists in our local DB
  let userRecord = await db.prepare("SELECT id FROM users WHERE email = ?").bind(user.email).first();
  
  if (!userRecord) {
    // Create user if doesn't exist
    const result = await db.prepare(
      "INSERT INTO users (email, name, picture, created_at, updated_at) VALUES (?, ?, ?, ?, ?) RETURNING id"
    ).bind(user.email, name || user.name || "", picture || "", new Date().toISOString(), new Date().toISOString()).first();
    userRecord = result;
  } else {
    // Update existing user
    await db.prepare(
      "UPDATE users SET name = ?, picture = ?, updated_at = ? WHERE email = ?"
    ).bind(name || user.name || "", picture || "", new Date().toISOString(), user.email).run();
  }

  return c.json({ success: true, name, picture });
});

app.get("/api/logout", async (c) => {
  const sessionToken = getCookie(c, SESSION_TOKEN_COOKIE_NAME);

  if (typeof sessionToken === "string") {
    await deleteSession(sessionToken);
  }

  setCookie(c, SESSION_TOKEN_COOKIE_NAME, "", {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true,
    maxAge: 0,
  });

  return c.json({ success: true }, 200);
});

app.post("/api/send-otp", async (c) => {
  const body = await c.req.json();
  const email = body.email;
  if (!email) {
    return c.json({ error: "No email provided" }, 400);
  }
  const data = await sendOTP(email, c.env.PROJECT_ID);
  if (data.error) {
    return c.json({ error: data.error }, 400);
  }
  return c.json({ success: true }, 200);
});

app.post("/api/verify-otp", async (c) => {
  const body = await c.req.json();
  const email = body.email;
  const otp = body.otp;
  if (!email) {
    return c.json({ error: "No email provided" }, 400);
  }
  if (!otp) {
    return c.json({ error: "No otp provided" }, 400);
  }
  const data = await verifyOTP(email, otp);

  const customerResult = await CustomerService.save(c.env.DB, {
    formData: {
      email,
      email_verified: true,
      email_consent: true,
    },
    source: "otp",
  });
  console.log("save customer result", customerResult);

  if (data.error) {
    return c.json({ error: data.error }, 400);
  }
  const sessionToken = data.sessionToken;

  setCookie(c, SESSION_TOKEN_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true,
    maxAge: 1 * 24 * 60 * 60, // 1 day
  });
  return c.json({ success: true, data }, 200);
});

/**
 * 创建支付结账会话接口
 *
 * @description 创建支付结账会话，用于处理商品购买流程
 *
 * @param {Object} body - 请求体
 * @param {ProductDto[]} body.products - 订单商品列表，包含商品ID、数量、价格等信息
 * @param {string} [body.successRouter] - 支付成功后的跳转路由
 * @param {string} [body.cancelRouter] - 支付取消后的跳转路由
 *
 * @returns {Object} 响应数据
 * @returns {string} [response.checkoutUrl] - 支付页面URL，用于重定向用户到支付页面
 * @returns {string} [response.sessionId] - 支付会话ID，用于后续查询支付状态
 * @returns {Object} [response.error] - 错误信息（当请求失败时）
 * @returns {string} [response.error.message] - 错误描述
 * @returns {number} [response.error.code] - 错误代码
 *
 * @example
 * // 请求示例
 * POST /api/create-checkout-session
 * {
 *   "products": [
 *     {
 *       "productId": "prod_123",
 *       "quantity": 2
 *     }
 *   ],
 *   "successRouter": "/success",
 *   "cancelRouter": "/cancel"
 * }
 *
 * // 成功响应示例
 * {
 *   "checkoutUrl": "https://checkout.stripe.com/pay/cs_xxx",
 *   "sessionId": "cs_xxx"
 * }
 *
 * // 错误响应示例
 * {
 *   "message": "商品不存在",
 *   "code": "PRODUCT_NOT_FOUND"
 * }
 */
app.post("/api/create-checkout-session", async (c) => {
  const { products, successRouter, cancelRouter } = await c.req.json();
  let user = null;
  const sessionToken = getCookie(c, SESSION_TOKEN_COOKIE_NAME);
  if (sessionToken) {
    user = await getCurrentUser(sessionToken);
  }

  const url = new URL(c.req.url);

  const response = await fetch(
    `${SHOPPING_SERVICE_ENDPOINT}/api/payment/create-checkout-session`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-worker-origin": url.origin,
        "x-req-id": crypto.randomUUID(),
      },
      body: JSON.stringify({
        projectId: c.env.PROJECT_ID,
        customerEmail: user?.email,
        products,
        successUrl: successRouter,
        cancelUrl: cancelRouter,
      }),
    }
  );

  const data = await response.json();
  if (!response.ok) {
    return c.json(data, 400);
  }
  const customerResult = await CustomerService.save(c.env.DB, {
    formData: {
      email: user?.email,
      email_verified: true,
      email_consent: true,
    },
    source: "checkout",
  });
  console.log("save customer result", customerResult);

  return c.json(data, 200);
});

/**
 * 获取商品列表接口
 *
 * @description 获取已上架的商品列表，用于展示商品列表
 *
 * @returns {Object} 响应数据
 * @returns {ProductDto[]} response - 商品列表数组
 * @returns {string} response[].id - 商品唯一标识符
 * @returns {string} response[].createdAt - 商品创建时间 (ISO 8601格式)
 * @returns {string} response[].updatedAt - 商品最后更新时间 (ISO 8601格式)
 * @returns {string} response[].projectId - 项目ID
 * @returns {string} response[].name - 商品名称
 * @returns {string} response[].description - 商品描述
 * @returns {number} response[].price - 商品价格（以分为单位）
 * @returns {string} response[].currency - 货币类型 (如: "usd")
 * @returns {string} response[].status - 商品状态 (如: "active" 已上架)
 * @returns {string|null} response[].images - 商品图片URL（可能为null）
 * @returns {string} response[].billingType - 商品计费类型 (如: "one_time" 一次性计费, "recurring" 订阅计费)
 * @returns {string} response[].billingCycle - 商品计费周期 (如: "month" 月度计费)
 *
 * @example
 * // 请求示例
 * GET /api/products
 *
 * // 成功响应示例
 * [
 *   {
 *     "id": "63041696-1939-4fea-8965-0bf51effffc7",
 *     "createdAt": "2025-09-09T19:01:02.284Z",
 *     "updatedAt": "2025-09-09T19:01:02.284Z",
 *     "projectId": "689d91ee97820b835370d021",
 *     "name": "dsfds",
 *     "description": "",
 *     "price": 100000,
 *     "currency": "usd",
 *     "billingType": "one_time",
 *     "billingCycle": "month",
 *     "status": "active",
 *     "images": null,
 *   }
 * ]
 *
 * // 错误响应示例
 * {
 *   "message": "获取商品列表失败",
 *   "code": "PRODUCTS_FETCH_ERROR"
 * }
 */
app.get("/api/products", async (c) => {
  const response = await fetch(
    `${SHOPPING_SERVICE_ENDPOINT}/api/products?projectId=${c.env.PROJECT_ID}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-req-id": crypto.randomUUID(),
      },
    }
  );

  const data = await response.json();
  if (!response.ok) {
    return c.json(data, 400);
  }
  return c.json(data, 200);
});

/**
 * 获取商品购买详情接口
 *
 * @description 根据支付会话ID获取商品购买详情，包括商品下载地址等信息
 *
 * @param {string} sessionId - 支付会话ID（通过query参数传入）
 *
 * @returns {Object} 响应数据
 * @returns {string} response.type - 商品类型 ("digital" | "subscription")
 * @returns {string} [response.downloadUrl] - 数字商品的下载地址（当type为"digital"时）
 * @returns {string} [response.expirsAt] - 订阅商品的过期时间（当type为"subscription"时）
 * @returns {string} [response.message] - 错误描述（当请求失败时）
 * @returns {string} [response.code] - 错误代码（当请求失败时）
 *
 * @example
 * // 请求示例
 * GET /api/products/purchase-detail?sessionId=cs_xxx
 *
 * // 数字商品成功响应示例
 * {
 *   "type": "digital",
 *   "downloadUrl": "https://example.com/download/product-file.zip"
 * }
 *
 * // 订阅商品成功响应示例
 * {
 *   "type": "subscription",
 *   "expirsAt": "2025-09-14T10:00:00.000Z"
 * }
 *
 * // 错误响应示例
 * {
 *   "message": "订阅已过期",
 *   "code": "SUBSCRIPTION_EXPIRED"
 * }
 */
app.get("/api/products/purchase-detail", async (c) => {
  const sessionId = c.req.query("sessionId") || "";
  const db = c.env.DB;
  const projectId = c.env.PROJECT_ID || "";
  if (!sessionId) {
    return c.json({ error: "No sessionId provided" }, 400);
  }

  const response = await fetch(
    `${SHOPPING_SERVICE_ENDPOINT}/api/products/purchase-detail`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-req-id": crypto.randomUUID(),
      },
      body: JSON.stringify({
        projectId: c.env.PROJECT_ID,
        sessionId,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    return c.json(data, 400);
  }

  // 查找订阅了 form.submitted 的所有 Zapier webhook
  const webhooksResult = await db
    .prepare(`SELECT * FROM webhooks WHERE event=?1 AND project_id=?2`)
    .bind("order.paid", projectId)
    .all();

  const webhooks = webhooksResult.results || [];

  await Promise.all(
    webhooks.map(async ({ target_url }) => {
      try {
        await fetch(target_url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            order_detail: data,
            project_id: projectId,
            user_email: c.env.USER_EMAIL || "",
          }),
        });
      } catch (err) {
        console.error("Webhook delivery failed:", target_url, err);
      }
    })
  );
  return c.json(data, 200);
});

/**
 * 获取已购商品列表接口
 *
 * @description 获取当前用户已购买的商品列表，用于展示用户的购买历史
 *
 * @returns {Object} 响应数据
 * @returns {PurchasedProductDto[]} response - 已购商品列表数组
 * @returns {string} response[].productId - 商品唯一标识符
 * @returns {string} response[].purchaseDate - 商品购买时间 (ISO 8601格式)
 * @returns {string} response[].name - 商品名称
 * @returns {number} response[].price - 商品价格（以分为单位）
 * @returns {string} response[].currency - 货币类型 (如: "usd")
 * @returns {string} response[].status - 商品状态 (如: "active" 有效)
 * @returns {string} response[].expiresAt - 商品过期时间 (ISO 8601格式)
 * @returns {string} response[].orderId - 订单ID
 *
 *
 * @example
 * // 请求示例
 * GET /api/purchased-products
 *
 * // 成功响应示例
 * [
 *   {
 *     "productId": "96d7243a-b3fe-480d-9290-bc79671176fc",
 *     "purchaseDate": "2025-10-08T21:58:52.981Z",
 *     "name": "电子书创作全套课程",
 *     "price": 14900,
 *     "currency": "usd",
 *     "status": "active",
 *     "expiresAt": "2025-10-08T21:58:52.981Z"  // do not use this field to judge if the product has access
 *   }
 * ]
 *
 * // 错误响应示例
 * {
 *   "error": "failed to get purchased products"
 * }
 */
app.get("/api/purchased-products", authMiddleware, async (c) => {
  try {
    //@ts-ignore
    const user = c.get("user") as any;

    const response = await fetch(
      `${SHOPPING_SERVICE_ENDPOINT}/api/products/purchased`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-req-id": crypto.randomUUID(),
        },
        body: JSON.stringify({
          projectId: c.env.PROJECT_ID,
          email: user.email,
        }),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      return c.json(data, 400);
    }
    return c.json(data, 200);
  } catch (error) {
    return c.json(
      { error: error.message || "failed to get purchased products" },
      500
    );
  }
});

/**
 * 获取已购商品访问权限接口
 *
 * @description 检查当前用户是否具有指定商品的访问权限，用于验证用户购买状态
 *
 * @param {string} productId - 商品ID（通过URL路径参数传入）
 *
 * @returns {Object} 响应数据
 * @returns {boolean} response.hasAccess - 是否具有访问权限
 * @returns {string} response.message - 访问权限说明信息
 *
 * @example
 * // 请求示例
 * GET /api/products/96d7243a-b3fe-480d-9290-bc79671176fc/check-access
 *
 * // 有权限响应示例
 * {
 *   "hasAccess": true,
 *   "message": "您已购买此商品，可以正常访问"
 * }
 *
 * // 无权限响应示例
 * {
 *   "hasAccess": false,
 *   "message": "您尚未购买此商品，请先购买后再访问"
 * }
 *
 * // 错误响应示例
 * {
 *   "error": "No productId provided"
 * }
 */
app.get("/api/products/:productId/check-access", authMiddleware, async (c) => {
  //@ts-ignore
  const user = c.get("user") as any;

  const productId = c.req.param("productId");
  if (!productId) {
    return c.json({ error: "No productId provided" }, 400);
  }

  try {
    const response = await fetch(
      `${SHOPPING_SERVICE_ENDPOINT}/api/products/check-access`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-req-id": crypto.randomUUID(),
        },
        body: JSON.stringify({
          projectId: c.env.PROJECT_ID,
          email: user.email,
          productId,
        }),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      return c.json(data, 400);
    }
    return c.json(data, 200);
  } catch (error) {
    return c.json(
      { error: error.message || "failed to get purchased products" },
      500
    );
  }
});

app.post("/api/webhooks", async (c) => {
  const db = c.env.DB;
  const { event, target_url } = await c.req.json();
  const projectId = c.env.PROJECT_ID || "";
  // 1️⃣ 确保表存在（如果不存在则创建）
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS webhooks (
        id TEXT PRIMARY KEY,
        event TEXT NOT NULL,
        target_url TEXT NOT NULL,
        project_id TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );`
    )
    .run();

  // 检查是否已存在同一条订阅
  const existing = await db
    .prepare(
      `SELECT id FROM webhooks 
       WHERE event=?1 AND project_id=?2 AND target_url=?3`
    )
    .bind(event, projectId, target_url)
    .first();

  if (existing) {
    return c.json({
      success: true,
      subscription_id: existing.id,
      message: "Webhook already exists",
    });
  }

  // 不存在则插入
  const id = crypto.randomUUID();
  await db
    .prepare(
      `INSERT INTO webhooks 
       (id, event, target_url, project_id)
       VALUES (?1, ?2, ?3, ?4)`
    )
    .bind(id, event, target_url, projectId)
    .run();

  return c.json({
    success: true,
    subscription_id: id,
  });
});

app.delete("/api/webhooks", async (c) => {
  const db = c.env.DB;
  const { id } = await c.req.json();

  const result = await db
    .prepare(`DELETE FROM webhooks WHERE id=?1`)
    .bind(id)
    .run();

  return c.json({
    success: result.success,
  });
});

// Mount ChatPets AI routes
app.route("/", chatpetsAiRoutes);

app.post("/api/webhooks/form-submit", async (c) => {
  const db = c.env.DB;
  const projectId = c.env.PROJECT_ID || "";
  const { formData } = await c.req.json();

  // 查找订阅了 form.submitted 的所有 Zapier webhook
  const webhooksResult = await db
    .prepare(`SELECT * FROM webhooks WHERE event=?1 AND project_id=?2`)
    .bind("form.submitted", projectId)
    .all();

  const webhooks = webhooksResult.results || [];

  await Promise.all(
    webhooks.map(async ({ target_url }) => {
      try {
        await fetch(target_url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            formData,
            project_id: projectId,
            user_email: c.env.USER_EMAIL || "",
          }),
        });
      } catch (err) {
        console.error("Webhook delivery failed:", target_url, err);
      }
    })
  );
});

// =================================================================
// == END OF PROTECTED AUTHENTICATION ROUTES                      ==
// =================================================================

// =================================================================
// == FRIENDSHIPS API ROUTES                                      ==
// =================================================================

/**
 * GET /api/friendships/accepted
 * Fetch accepted friends for the current user with their total scores
 */
app.get("/api/friendships/accepted", authMiddleware, async (c) => {
  const user = c.get("user") as any;
  const db = c.env.DB;
  
  const userRecord = await db.prepare("SELECT id FROM users WHERE email = ?").bind(user.email).first();
  if (!userRecord) {
    return c.json([], 200);
  }

  const friendships = await db.prepare(
    `SELECT f.*, 
            CASE 
              WHEN f.user_id = ? THEN f.friend_id 
              ELSE f.user_id 
            END as friend_user_id
     FROM friendships f
     WHERE (f.user_id = ? OR f.friend_id = ?) AND f.status = 'accepted'`
  ).bind(userRecord.id, userRecord.id, userRecord.id).all();

  const friendIds = friendships.results.map((f: any) => f.friend_user_id);
  
  if (friendIds.length === 0) {
    return c.json([], 200);
  }

  const placeholders = friendIds.map(() => '?').join(',');
  const friends = await db.prepare(
    `SELECT u.id, u.email, u.name, u.picture, COALESCE(l.total_score, 0) as total_score
     FROM users u
     LEFT JOIN leaderboard_scores l ON u.id = l.user_id
     WHERE u.id IN (${placeholders})`
  ).bind(...friendIds).all();

  // Map to frontend-friendly format
  const friendsWithMeta = friends.results.map((f: any) => ({
    ...f,
    user_email: f.email,
    user_name: f.name,
    user_picture: f.picture,
  }));

  return c.json(friendsWithMeta || [], 200);
});

/**
 * GET /api/friendships/pending
 * Fetch pending friend requests for the current user
 */
app.get("/api/friendships/pending", authMiddleware, async (c) => {
  const user = c.get("user") as any;
  const db = c.env.DB;
  
  const userRecord = await db.prepare("SELECT id FROM users WHERE email = ?").bind(user.email).first();
  if (!userRecord) {
    return c.json([], 200);
  }

  const pending = await db.prepare(
    "SELECT * FROM friendships WHERE friend_id = ? AND status = 'pending'"
  ).bind(userRecord.id).all();

  return c.json(pending.results || [], 200);
});

/**
 * GET /api/users/search
 * Search users by username or email
 */
app.get("/api/users/search", authMiddleware, async (c) => {
  const query = c.req.query("q") || "";
  const user = c.get("user") as any;
  const db = c.env.DB;
  
  if (!query.trim()) {
    return c.json([], 200);
  }

  const userRecord = await db.prepare("SELECT id FROM users WHERE email = ?").bind(user.email).first();
  
  const results = await db.prepare(
    `SELECT id, email, name 
     FROM users 
     WHERE (email LIKE ? OR name LIKE ?) AND email != ?
     LIMIT 20`
  ).bind(`%${query}%`, `%${query}%`, user.email).all();

  return c.json(results.results || [], 200);
});

/**
 * POST /api/friendships/add
 * Send a friend request
 */
app.post("/api/friendships/add", authMiddleware, async (c) => {
  const user = c.get("user") as any;
  const body = await c.req.json();
  const db = c.env.DB;
  
  const userRecord = await db.prepare("SELECT id FROM users WHERE email = ?").bind(user.email).first();
  if (!userRecord) {
    return c.json({ error: "User not found" }, 404);
  }

  const { friend_id } = body;
  
  // Check if friendship already exists
  const existing = await db.prepare(
    `SELECT id FROM friendships 
     WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)`
  ).bind(userRecord.id, friend_id, friend_id, userRecord.id).first();

  if (existing) {
    return c.json({ error: "Friendship request already exists" }, 400);
  }

  await db.prepare(
    "INSERT INTO friendships (user_id, friend_id, status, created_at, updated_at) VALUES (?, ?, 'pending', ?, ?)"
  ).bind(userRecord.id, friend_id, new Date().toISOString(), new Date().toISOString()).run();

  return c.json({ success: true }, 200);
});

/**
 * POST /api/friendships/accept
 * Accept a friend request
 */
app.post("/api/friendships/accept", authMiddleware, async (c) => {
  const body = await c.req.json();
  const db = c.env.DB;
  const { friendship_id } = body;

  await db.prepare(
    "UPDATE friendships SET status = 'accepted', updated_at = ? WHERE id = ?"
  ).bind(new Date().toISOString(), friendship_id).run();

  return c.json({ success: true }, 200);
});

/**
 * POST /api/friendships/reject
 * Reject a friend request
 */
app.post("/api/friendships/reject", authMiddleware, async (c) => {
  const body = await c.req.json();
  const db = c.env.DB;
  const { friendship_id } = body;

  await db.prepare(
    "UPDATE friendships SET status = 'rejected', updated_at = ? WHERE id = ?"
  ).bind(new Date().toISOString(), friendship_id).run();

  return c.json({ success: true }, 200);
});

// =================================================================
// == LEADERBOARD API ROUTES                                      ==
// =================================================================

/**
 * GET /api/leaderboard
 * Fetch leaderboard scores ordered by total_score DESC
 */
app.get("/api/leaderboard", authMiddleware, async (c) => {
  const user = c.get("user") as any;
  const db = c.env.DB;
  
  const userRecord = await db.prepare("SELECT id FROM users WHERE email = ?").bind(user.email).first();

  const scores = await db.prepare(
    `SELECT l.user_id, l.total_score, u.email as user_email, u.name as user_name
     FROM leaderboard_scores l
     JOIN users u ON l.user_id = u.id
     ORDER BY l.total_score DESC
     LIMIT 50`
  ).all();

  const leaderboard = (scores.results || []).map((entry: any, index: number) => ({
    rank: index + 1,
    user_id: entry.user_id,
    user_email: entry.user_email,
    user_name: entry.user_name,
    total_score: entry.total_score,
    is_current_user: userRecord ? entry.user_id === userRecord.id : false,
  }));

  return c.json(leaderboard, 200);
});

/**
 * Helper function to update user total score in leaderboard
 */
async function updateUserTotalScore(db: D1Database, userId: number) {
  const pets = await db.prepare("SELECT total_xp FROM pets WHERE owner_user_id = ?").bind(userId).all();
  const totalScore = pets.results.reduce((sum: number, pet: any) => sum + (pet.total_xp || 0), 0);

  const existing = await db.prepare("SELECT id FROM leaderboard_scores WHERE user_id = ?").bind(userId).first();

  if (existing) {
    await db.prepare(
      "UPDATE leaderboard_scores SET total_score = ?, last_updated = ?, updated_at = ? WHERE user_id = ?"
    ).bind(totalScore, new Date().toISOString(), new Date().toISOString(), userId).run();
  } else {
    await db.prepare(
      "INSERT INTO leaderboard_scores (user_id, total_score, last_updated, created_at, updated_at) VALUES (?, ?, ?, ?, ?)"
    ).bind(userId, totalScore, new Date().toISOString(), new Date().toISOString(), new Date().toISOString()).run();
  }
}

// =================================================================
// == GAME API ROUTES (Pets, Quests, Challenges)                  ==
// =================================================================

/**
 * GET /api/pets
 * Fetch all pets for the current user
 */
app.get("/api/pets", authMiddleware, async (c) => {
  const user = c.get("user") as any;
  const db = c.env.DB;
  
  // Assuming user.id is the owner_user_id. If user.id is string/uuid and schema expects integer, 
  // we might need to adjust. The schema says owner_user_id is integer. 
  // However, standard auth usually provides string IDs. 
  // For this MVP, we'll assume we can store the string ID or we need to map it.
  // Looking at schema: "owner_user_id": { "type": "integer" ... }
  // If the auth system uses UUIDs, we might have a mismatch. 
  // BUT, for simplicity in this MVP and D1's flexibility, we will try to match based on email or just store it.
  // Actually, let's check the users-schema.json. It has "id": integer.
  // The authMiddleware returns a user object. We should check if we can get the integer ID.
  // If not, we might need to look up the user in the 'users' table by email.
  
  // Let's look up the user ID from the 'users' table using the email from the token
  const userRecord = await db.prepare("SELECT id FROM users WHERE email = ?").bind(user.email).first();
  
  if (!userRecord) {
    // If user doesn't exist in our local DB yet (might happen if they just logged in via OAuth and we haven't synced),
    // we should probably create them or return empty.
    // For now, return empty list.
    return c.json([], 200);
  }

  const pets = await db.prepare("SELECT * FROM pets WHERE owner_user_id = ?").bind(userRecord.id).all();
  return c.json(pets.results || [], 200);
});

/**
 * POST /api/pets
 * Create a new pet
 */
app.post("/api/pets", authMiddleware, async (c) => {
  const user = c.get("user") as any;
  const db = c.env.DB;
  const body = await c.req.json();
  
  // Get user ID
  let userRecord = await db.prepare("SELECT id FROM users WHERE email = ?").bind(user.email).first();
  if (!userRecord) {
     // Auto-create user record if missing (sync)
     const result = await db.prepare("INSERT INTO users (email, name, created_at, updated_at) VALUES (?, ?, ?, ?) RETURNING id")
       .bind(user.email, user.name || "User", new Date().toISOString(), new Date().toISOString())
       .first();
     userRecord = result;
  }

  const { name, avatar_url } = body;
  
  const result = await db.prepare(
    "INSERT INTO pets (name, avatar_url, level, total_xp, coins, owner_user_id, created_at, updated_at) VALUES (?, ?, 1, 0, 0, ?, ?, ?)"
  ).bind(name, avatar_url, userRecord.id, new Date().toISOString(), new Date().toISOString()).run();

  return c.json({ success: true, result }, 200);
});

/**
 * PUT /api/pets/:id
 * Update a pet
 */
app.put("/api/pets/:id", authMiddleware, async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const db = c.env.DB;
  const user = c.get("user") as any;
  
  const { name, avatar_url } = body;
  
  await db.prepare(
    "UPDATE pets SET name = ?, avatar_url = ?, updated_at = ? WHERE id = ?"
  ).bind(name, avatar_url, new Date().toISOString(), id).run();

  // Update leaderboard after pet update
  const pet = await db.prepare("SELECT owner_user_id FROM pets WHERE id = ?").bind(id).first();
  if (pet) {
    await updateUserTotalScore(db, pet.owner_user_id as number);
  }

  return c.json({ success: true }, 200);
});

/**
 * DELETE /api/pets/:id
 * Delete a pet
 */
app.delete("/api/pets/:id", authMiddleware, async (c) => {
  const id = c.req.param("id");
  const db = c.env.DB;
  
  await db.prepare("DELETE FROM pets WHERE id = ?").bind(id).run();
  return c.json({ success: true }, 200);
});

/**
 * GET /api/quests
 * Fetch all quests
 */
app.get("/api/quests", authMiddleware, async (c) => {
  const db = c.env.DB;
  const quests = await db.prepare("SELECT * FROM quests").all();
  return c.json(quests.results || [], 200);
});

/**
 * POST /api/quests
 * Create a new custom quest for users
 */
app.post("/api/quests", authMiddleware, async (c) => {
  const body = await c.req.json();
  const db = c.env.DB;
  const { name, emoji, description, type, xp_value } = body;
  
  const result = await db.prepare(
    "INSERT INTO quests (name, emoji, description, type, xp_value, is_custom, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 1, ?, ?)"
  ).bind(
    name, 
    emoji || "", 
    description || "", 
    type || "daily", 
    xp_value || 10, 
    new Date().toISOString(), 
    new Date().toISOString()
  ).run();

  return c.json({ success: true, result }, 200);
});

/**
 * POST /api/quests/complete
 * Complete a quest for a pet
 */
app.post("/api/quests/complete", authMiddleware, async (c) => {
  const user = c.get("user") as any;
  const body = await c.req.json();
  const db = c.env.DB;
  const { petId, questId } = body;

  // Verify user exists
  const userRecord = await db.prepare("SELECT id FROM users WHERE email = ?").bind(user.email).first();
  if (!userRecord) {
    return c.json({ error: "User not found" }, 404);
  }

  // Verify pet ownership
  const petOwnership = await db.prepare("SELECT id FROM pets WHERE id = ? AND owner_user_id = ?").bind(petId, userRecord.id).first();
  if (!petOwnership) {
    return c.json({ error: "Pet not found or not owned by you" }, 403);
  }
  
  // 1. Get Quest details for XP
  const quest = await db.prepare("SELECT xp_value FROM quests WHERE id = ?").bind(questId).first();
  if (!quest) return c.json({ error: "Quest not found" }, 404);
  
  const xpEarned = quest.xp_value as number;
  
  // 2. Insert Log
  await db.prepare(
    "INSERT INTO quest_logs (pet_id, quest_id, completion_date, status, created_at, updated_at) VALUES (?, ?, ?, 'done', ?, ?)"
  ).bind(petId, questId, new Date().toISOString(), new Date().toISOString(), new Date().toISOString()).run();
  
  // 3. Update Pet XP and Coins (1 XP = 1 Coin for simplicity)
  // Also handle Level Up logic (e.g., Level = 1 + floor(TotalXP / 100))
  const pet = await db.prepare("SELECT total_xp, coins, owner_user_id FROM pets WHERE id = ?").bind(petId).first();
  const newTotalXP = (pet.total_xp as number) + xpEarned;
  const newCoins = (pet.coins as number) + xpEarned;
  const newLevel = 1 + Math.floor(newTotalXP / 100);
  
  await db.prepare(
    "UPDATE pets SET total_xp = ?, coins = ?, level = ?, updated_at = ? WHERE id = ?"
  ).bind(newTotalXP, newCoins, newLevel, new Date().toISOString(), petId).run();

  // Update leaderboard after quest completion
  await updateUserTotalScore(db, pet.owner_user_id as number);

  return c.json({ success: true, xpEarned, newLevel }, 200);
});

/**
 * GET /api/quest-logs
 * Get logs for a specific pet
 */
app.get("/api/quest-logs", authMiddleware, async (c) => {
  const petId = c.req.query("petId");
  const db = c.env.DB;
  
  if (!petId) return c.json({ error: "Pet ID required" }, 400);
  
  const logs = await db.prepare(
    `SELECT ql.*, q.name as quest_name, q.xp_value 
     FROM quest_logs ql 
     JOIN quests q ON ql.quest_id = q.id 
     WHERE ql.pet_id = ? 
     ORDER BY ql.completion_date DESC`
  ).bind(petId).all();
  
  return c.json(logs.results || [], 200);
});

/**
 * GET /api/challenges
 * Fetch all active challenges with date filtering
 */
app.get("/api/challenges", authMiddleware, async (c) => {
  const db = c.env.DB;
  const now = new Date().toISOString();
  const challenges = await db.prepare(
    "SELECT * FROM challenges WHERE is_active = 1 AND start_date <= ? AND end_date >= ? ORDER BY start_date ASC"
  ).bind(now, now).all();
  return c.json(challenges.results || [], 200);
});

/**
 * POST /api/challenge-participations
 * Join a challenge
 */
app.post("/api/challenge-participations", authMiddleware, async (c) => {
  const user = c.get("user") as any;
  const body = await c.req.json();
  const db = c.env.DB;
  const { challenge_id } = body;

  const userRecord = await db.prepare("SELECT id FROM users WHERE email = ?").bind(user.email).first();
  if (!userRecord) {
    return c.json({ error: "User not found" }, 404);
  }

  // Check if already joined
  const existing = await db.prepare(
    "SELECT id FROM challenge_participations WHERE challenge_id = ? AND user_id = ?"
  ).bind(challenge_id, userRecord.id).first();

  if (existing) {
    return c.json({ error: "Already joined this challenge" }, 400);
  }

  const now = new Date().toISOString();
  await db.prepare(
    "INSERT INTO challenge_participations (challenge_id, user_id, progress, status, joined_at, created_at, updated_at) VALUES (?, ?, 0, 'joined', ?, ?, ?)"
  ).bind(challenge_id, userRecord.id, now, now, now).run();

  return c.json({ success: true }, 200);
});

/**
 * GET /api/challenge-participations
 * Fetch user's challenge participations
 */
app.get("/api/challenge-participations", authMiddleware, async (c) => {
  const user = c.get("user") as any;
  const db = c.env.DB;

  const userRecord = await db.prepare("SELECT id FROM users WHERE email = ?").bind(user.email).first();
  if (!userRecord) {
    return c.json([], 200);
  }

  const participations = await db.prepare(
    "SELECT cp.*, c.name as challenge_name FROM challenge_participations cp JOIN challenges c ON cp.challenge_id = c.id WHERE cp.user_id = ?"
  ).bind(userRecord.id).all();

  return c.json(participations.results || [], 200);
});

/**
 * GET /api/challenge-leaderboard/:challengeId
 * Fetch top 10 leaderboard for a specific challenge
 */
app.get("/api/challenge-leaderboard/:challengeId", authMiddleware, async (c) => {
  const challengeId = c.req.param("challengeId");
  const db = c.env.DB;

  const leaderboard = await db.prepare(
    `SELECT cl.*, u.email as user_email, u.name as user_name 
     FROM challenge_leaderboard cl
     JOIN users u ON cl.user_id = u.id
     WHERE cl.challenge_id = ?
     ORDER BY cl.score DESC
     LIMIT 10`
  ).bind(challengeId).all();

  return c.json(leaderboard.results || [], 200);
});

// Import email service and config
import { handleFormSubmissionEmails } from "../shared/email-service";
import allFormConfigs from "../shared/form-configs.json";

// =================================================================
// == FORM SUBMISSION WITH EMAIL CALLBACK                         ==
// =================================================================
// This is a generic template for AI customization
// AI SHOULD Modify this, to include data persistence logic.
// Handles form submissions and sends emails based on configuration

app.post("/api/forms/submit", async (c) => {
  try {
    const body = await c.req.json();
    const { formId, ...formData } = body;

    // Validate required fields
    if (!formId) {
      return c.json({ success: false, message: "Form ID is required" }, 400);
    }

    /**
     * Add data persistence logic here
     */

    // Get email configuration for this form
    const fromConfig = (allFormConfigs as any)[formId];

    if (!fromConfig) {
      // If no config exists for this form, just return success without sending emails
      console.warn(`No configuration found for form: ${formId}`);
      return c.json({
        success: true,
        message: "Form submitted successfully (no config)",
      });
    }

    // save to customers table if we have email from this form
    const customerResult = await CustomerService.save(c.env.DB, {
      formData,
      source: `form:${formId}`,
    });
    console.log("save customer result", customerResult);

    // Send emails using the universal callback
    const emailResult = await handleFormSubmissionEmails(
      formId,
      formData,
      fromConfig,
      {
        API_KEY: c.env.API_KEY || "",
        PROJECT_ID: c.env.PROJECT_ID || "",
        USER_EMAIL: c.env.USER_EMAIL || "",
      }
    );

    if (!emailResult.success) {
      console.error("Email sending errors:", emailResult.errors);
      // Still return success for form submission, but indicate email issues
      return c.json({
        success: true,
        message: "Form submitted but some emails failed",
        emailErrors: emailResult.errors,
      });
    }

    return c.json({
      success: true,
      message: "Form submitted and emails sent successfully",
    });
  } catch (error) {
    console.error("Form submission error:", error);
    return c.json(
      {
        success: false,
        message: "An internal error occurred",
      },
      500
    );
  }
});

// =================================================================
// == ADMIN ENDPOINTS (OWNER-ONLY, STRICT SECURITY)              ==
// =================================================================

/**
 * GET /api/admin/status
 * Check if the current user is an admin
 */
app.get("/api/admin/status", authMiddleware, async (c) => {
  const user = c.get("user") as any;
  const isAdmin = user?.email === c.env.USER_EMAIL;
  return c.json({ isAdmin });
});

/**
 * GET /api/admin/schemas
 * List all schema files in src/shared/schemas/
 */
app.get("/api/admin/schemas", authMiddleware, async (c) => {
  const user = c.get("user") as any;
  if (user?.email !== c.env.USER_EMAIL) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const db = c.env.DB;
  const tables = await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
  const schemaNames = tables.results.map((t: any) => t.name);
  return c.json(schemaNames);
});

/**
 * GET /api/admin/schemas/:tableName
 * Get schema for a specific table
 */
app.get("/api/admin/schemas/:tableName", authMiddleware, async (c) => {
  const user = c.get("user") as any;
  if (user?.email !== c.env.USER_EMAIL) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const tableName = c.req.param("tableName");
  try {
    const schemaModule = await import(`../../shared/schemas/${tableName}-schema.json`);
    return c.json(schemaModule.default);
  } catch (err) {
    return c.json({ error: `Schema not found for ${tableName}` }, 404);
  }
});

/**
 * GET /api/tables/:tableName
 * List rows for a table with pagination, sorting, and filters
 */
app.get("/api/tables/:tableName", authMiddleware, async (c) => {
  const user = c.get("user") as any;
  if (user?.email !== c.env.USER_EMAIL) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const db = c.env.DB;
  const tableName = c.req.param("tableName");
  const page = parseInt(c.req.query("page") || "1");
  const limit = parseInt(c.req.query("limit") || "50");
  const sort = c.req.query("sort");
  const offset = (page - 1) * limit;

  let query = `SELECT * FROM ${tableName}`;
  if (sort) {
    const [field, order] = sort.split(":");
    query += ` ORDER BY ${field} ${order === "desc" ? "DESC" : "ASC"}`;
  }
  query += ` LIMIT ${limit} OFFSET ${offset}`;

  const results = await db.prepare(query).all();
  const countResult = await db.prepare(`SELECT COUNT(*) as total FROM ${tableName}`).first();
  const total = (countResult as any)?.total || 0;

  return c.json({ results: results.results || [], total });
});

/**
 * POST /api/tables/:tableName
 * Create a new row
 */
app.post("/api/tables/:tableName", authMiddleware, async (c) => {
  const user = c.get("user") as any;
  if (user?.email !== c.env.USER_EMAIL) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const db = c.env.DB;
  const tableName = c.req.param("tableName");
  const body = await c.req.json();

  const fields = Object.keys(body).filter((k) => k !== "id");
  const values = fields.map((f) => body[f]);
  const placeholders = fields.map(() => "?").join(", ");

  const now = new Date().toISOString();
  fields.push("created_at", "updated_at");
  values.push(now, now);

  const query = `INSERT INTO ${tableName} (${fields.join(", ")}) VALUES (${placeholders}, ?, ?)`;
  const result = await db.prepare(query).bind(...values).run();

  return c.json({ success: true, result });
});

/**
 * PUT /api/tables/:tableName/:id
 * Update a row
 */
app.put("/api/tables/:tableName/:id", authMiddleware, async (c) => {
  const user = c.get("user") as any;
  if (user?.email !== c.env.USER_EMAIL) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const db = c.env.DB;
  const tableName = c.req.param("tableName");
  const id = c.req.param("id");
  const body = await c.req.json();

  const fields = Object.keys(body).filter((k) => k !== "id" && k !== "created_at");
  const values = fields.map((f) => body[f]);
  const setClause = fields.map((f) => `${f} = ?`).join(", ");

  const now = new Date().toISOString();
  values.push(now, id);

  const query = `UPDATE ${tableName} SET ${setClause}, updated_at = ? WHERE id = ?`;
  const result = await db.prepare(query).bind(...values).run();

  return c.json({ success: true, result });
});

/**
 * DELETE /api/tables/:tableName/:id
 * Delete a row
 */
app.delete("/api/tables/:tableName/:id", authMiddleware, async (c) => {
  const user = c.get("user") as any;
  if (user?.email !== c.env.USER_EMAIL) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const db = c.env.DB;
  const tableName = c.req.param("tableName");
  const id = c.req.param("id");

  const result = await db.prepare(`DELETE FROM ${tableName} WHERE id = ?`).bind(id).run();

  return c.json({ success: true, result });
});

/**
 * GET /api/tables/:tableName/export
 * Export table data to CSV
 */
app.get("/api/tables/:tableName/export", authMiddleware, async (c) => {
  const user = c.get("user") as any;
  if (user?.email !== c.env.USER_EMAIL) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const db = c.env.DB;
  const tableName = c.req.param("tableName");
  const sort = c.req.query("sort");

  let query = `SELECT * FROM ${tableName}`;
  if (sort) {
    const [field, order] = sort.split(":");
    query += ` ORDER BY ${field} ${order === "desc" ? "DESC" : "ASC"}`;
  }

  const results = await db.prepare(query).all();
  const rows = results.results || [];

  if (rows.length === 0) {
    return new Response("No data", { status: 200, headers: { "Content-Type": "text/csv" } });
  }

  const headers = Object.keys(rows[0]);
  const csvRows = [headers.join(",")];

  rows.forEach((row: any) => {
    const values = headers.map((h) => {
      let val = row[h];
      if (typeof val === "string" && val.includes("<")) {
        val = val.replace(/<[^>]*>/g, "");
      }
      if (typeof val === "string" && val.includes(",")) {
        val = `"${val}"`;
      }
      return val || "";
    });
    csvRows.push(values.join(","));
  });

  const csv = csvRows.join("\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${tableName}.csv"`,
    },
  });
});

/**
 * POST /api/upload/media
 * Upload media (placeholder, integrate with R2 if needed)
 */
app.post("/api/upload/media", authMiddleware, async (c) => {
  const user = c.get("user") as any;
  if (user?.email !== c.env.USER_EMAIL) {
    return c.json({ error: "Forbidden" }, 403);
  }

  return c.json({ media_url: "https://via.placeholder.com/150" });
});

app.post("/api/upload/avatar", authMiddleware, async (c) => {
  // For MVP, we'll use a placeholder. In production, integrate with R2 or external storage.
  // For now, accept the file and return a placeholder URL.
  // In a real implementation, you'd upload to R2 and return the public URL.
  return c.json({ url: "https://heyboss.heeyo.ai/gemini-image-b153d19ab7ac46d28ca8137d52a45dc6.png" });
});

/**
 * POST /api/upload/file
 * Upload file (placeholder, integrate with R2 if needed)
 */
app.post("/api/upload/file", authMiddleware, async (c) => {
  const user = c.get("user") as any;
  if (user?.email !== c.env.USER_EMAIL) {
    return c.json({ error: "Forbidden" }, 403);
  }

  return c.json({ file_url: "https://example.com/file.pdf" });
});

/**
 * GET /api/messages
 * Fetch messages between the current user and a friend
 */
app.get("/api/messages", authMiddleware, async (c) => {
  const user = c.get("user") as any;
  const friendId = c.req.query("friend_id");
  const db = c.env.DB;

  if (!friendId) {
    return c.json({ error: "Friend ID required" }, 400);
  }

  const userRecord = await db.prepare("SELECT id FROM users WHERE email = ?").bind(user.email).first();
  if (!userRecord) {
    return c.json([], 200);
  }

  const messages = await db.prepare(
    `SELECT m.*, 
            CASE WHEN m.sender_user_id = ? THEN 1 ELSE 0 END as is_sender
     FROM messages m
     WHERE (m.sender_user_id = ? AND m.receiver_user_id = ?)
        OR (m.sender_user_id = ? AND m.receiver_user_id = ?)
     ORDER BY m.created_at ASC`
  ).bind(userRecord.id, userRecord.id, friendId, friendId, userRecord.id).all();

  return c.json(messages.results || [], 200);
});

/**
 * POST /api/messages/send
 * Send a message to a friend
 */
app.post("/api/messages/send", authMiddleware, async (c) => {
  const user = c.get("user") as any;
  const body = await c.req.json();
  const db = c.env.DB;
  const { receiver_user_id, content } = body;

  if (!receiver_user_id || !content) {
    return c.json({ error: "Receiver ID and content required" }, 400);
  }

  const userRecord = await db.prepare("SELECT id FROM users WHERE email = ?").bind(user.email).first();
  if (!userRecord) {
    return c.json({ error: "User not found" }, 404);
  }

  const now = new Date().toISOString();
  const result = await db.prepare(
    "INSERT INTO messages (sender_user_id, receiver_user_id, content, is_read, created_at, updated_at) VALUES (?, ?, ?, 0, ?, ?)"
  ).bind(userRecord.id, receiver_user_id, content, now, now).run();

  return c.json({ success: true, result }, 200);
});

// =================================================================
// == END OF ADMIN ENDPOINTS                                      ==
// =================================================================

// fallback to serve static assets and SPA index.html
app.use("*", async (c) => {
  let res = await c.env.ASSETS.fetch(c.req.raw);

  if (res.status === 404) {
    const url = new URL(c.req.url);
    const indexReq = new Request(`${url.origin}/index.html`, c.req.raw);
    res = await c.env.ASSETS.fetch(indexReq);
  }

  return res;
});

export default app;









