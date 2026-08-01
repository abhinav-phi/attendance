import express from "express";
import cors from "cors";
import { wrapper } from "axios-cookiejar-support";
import { CookieJar } from "tough-cookie";
import axios from "axios";
import * as cheerio from "cheerio";
import { v4 as uuidv4 } from "uuid";
import qs from "qs";
import { parseAttendance } from "./parseAttendance.js";
import dotenv from "dotenv";
dotenv.config();
import fs from "fs";
const app = express();
const PORT = 5000;

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());

const sessionStore = new Map();

const BASE_URL = "https://www.imsnsit.org/imsnsit";

// Minimal headers
const getHeaders = (referer) => ({
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.5",
  Connection: "keep-alive",
  "Upgrade-Insecure-Requests": "1",
  ...(referer && { Referer: referer }),
});

app.get("/", (req, res) => {
  res.send("NSUT Attendance Backend is running.");
});

// --- ROUTE 1: INIT ---
app.get("/api/init", async (req, res) => {
  try {
    const jar = new CookieJar();
    const client = wrapper(
      axios.create({
        jar,
        withCredentials: true,
        maxRedirects: 5,
        timeout: 15000,
      }),
    );

    // Step 1: Hit main page to get PHPSESSID
    await client.get(`${BASE_URL}/`, { headers: getHeaders() });

    // Step 2: Get student login page - try multiple endpoints
    let html = "";
    let hrandNum = null;
    let captchaPath = null;

    // Try student_login110.php first (this is the frame content)
    try {
      const login110Res = await client.get(`${BASE_URL}/student_login110.php`, {
        headers: getHeaders(`${BASE_URL}/student.htm`),
      });
      html = login110Res.data;
    } catch (e) {
      console.log("student_login110.php failed:", e.message);
    }

    // If that's empty, try student_login.php
    if (!html || html.length < 100) {
      try {
        const loginRes = await client.get(`${BASE_URL}/student_login.php`, {
          headers: getHeaders(`${BASE_URL}/`),
        });
        html = loginRes.data;
      } catch (e) {
        console.log("student_login.php failed:", e.message);
      }
    }

    // Try different patterns for HRAND
    const hrandPatterns = [
      /name=["']?HRAND_NUM["']?\s+value=["']?(\d+)["']?/i,
      /value=["']?(\d+)["']?\s+name=["']?HRAND_NUM["']?/i,
      /HRAND_NUM["']?\s+value=["']?(\d+)/i,
    ];

    for (const pattern of hrandPatterns) {
      const match = html.match(pattern);
      if (match) {
        hrandNum = match[1];
        // console.log('Found HRAND:', hrandNum);
        break;
      }
    }

    // Find captcha in HTML
    const captchaMatch = html.match(/images\/captcha\/captcha_\d+\.jpg/i);
    if (captchaMatch) {
      captchaPath = captchaMatch[0];
    }

    // Try refresh endpoint for captcha if not found
    if (!captchaPath) {
      const refreshRes = await client.get(
        `${BASE_URL}/plum5_fw_utils.php?rty=captcha&typ=login`,
        {
          headers: getHeaders(`${BASE_URL}/student_login.php`),
        },
      );
      const refreshMatch = refreshRes.data.match(
        /images\/captcha\/captcha_\d+\.jpg/i,
      );
      if (refreshMatch) {
        captchaPath = refreshMatch[0];
      }
    }

    // Generate fallback HRAND if not found
    if (!hrandNum) {
      hrandNum = String(Math.floor(10000 + Math.random() * 90000));
      // console.log('Generated fallback HRAND:', hrandNum);
    }

    if (!captchaPath) {
      throw new Error("Could not get captcha");
    }

    // console.log('Captcha:', captchaPath, 'HRAND:', hrandNum);

    // Fetch captcha image
    const captchaRes = await client.get(`${BASE_URL}/${captchaPath}`, {
      responseType: "arraybuffer",
      headers: {
        ...getHeaders(`${BASE_URL}/student_login.php`),
        Accept: "image/webp,image/png,image/*,*/*;q=0.8",
      },
    });

    const captchaBase64 = Buffer.from(captchaRes.data).toString("base64");

    // Get PHPSESSID
    const cookies = await jar.getCookies(BASE_URL);
    const phpSessionId = cookies.find((c) => c.key === "PHPSESSID")?.value;
    // console.log('PHPSESSID:', phpSessionId);

    const sessionId = uuidv4();
    sessionStore.set(sessionId, {
      jar,
      hrandNum,
      phpSessionId,
      createdAt: Date.now(),
    });

    // console.log('✅ Session ready:', sessionId);

    res.json({
      sessionId,
      captchaSrc: `data:image/jpeg;base64,${captchaBase64}`,
    });
  } catch (e) {
    console.error("Init error:", e.message);
    res.status(500).json({ error: "Failed to initialize: " + e.message });
  }
});

// --- ROUTE 2: LOGIN ---
app.post("/api/login", async (req, res) => {
  const { sessionId, username, password, captcha } = req.body;

  // console.log('\n=== Login attempt ===');
  // console.log('User:', username, 'Captcha:', captcha);

  if (!sessionStore.has(sessionId)) {
    return res
      .status(400)
      .json({ error: "Session expired. Please refresh the page." });
  }

  const session = sessionStore.get(sessionId);
  const { jar, hrandNum } = session;

  const client = wrapper(
    axios.create({
      jar,
      withCredentials: true,
      maxRedirects: 5,
      timeout: 15000,
    }),
  );

  try {
    const formData = qs.stringify({
      f: "",
      uid: username,
      pwd: password,
      HRAND_NUM: hrandNum,
      fy: "2026-27",
      comp: "NETAJI SUBHAS UNIVERSITY OF TECHNOLOGY",
      cap: captcha,
      logintype: "student",
    });

    // console.log('Sending login with HRAND:', hrandNum);

    const loginRes = await client.post(
      `${BASE_URL}/student_login.php`,
      formData,
      {
        headers: {
          ...getHeaders(`${BASE_URL}/student_login.php`),
          "Content-Type": "application/x-www-form-urlencoded",
          Origin: "https://www.imsnsit.org",
        },
      },
    );

    let loginHtml = loginRes.data;
    // console.log('Login response length:', loginHtml.length);
    // console.log('Login response URL:', loginRes.request?.res?.responseUrl || 'unknown');

    // Check for error messages
    const lowerHtml = loginHtml.toLowerCase();
    if (
      lowerHtml.includes("invalid") ||
      lowerHtml.includes("incorrect") ||
      lowerHtml.includes("wrong captcha")
    ) {
      // console.log('❌ Login failed - error detected in response');
      return res
        .status(401)
        .json({ error: "Invalid credentials or captcha. Please try again." });
    }

    // The login might redirect to a frameset - check for plum_url in response
    const framesetMatch = loginHtml.match(/plum_url\.php\?([^'"&\s]+)/);
    if (framesetMatch) {
      // console.log('Found frameset redirect to plum_url');
    }

    // Check if login was successful (frameset or welcome page)
    if (
      loginHtml.includes("frameset") ||
      loginHtml.includes("plum_url") ||
      loginHtml.includes("Welcome") ||
      loginHtml.includes("Logout") ||
      loginHtml.length > 2000
    ) {
      session.loggedIn = true;
      session.username = username;
      session.loginHtml = loginHtml;
      // console.log('✅ Login successful!');
      // console.log('Login HTML preview:', loginHtml.substring(0, 1000));

      // Try to fetch attendance
      try {
        const attendance = await fetchAttendance(client, username, loginHtml);
        return res.json({
          success: true,
          attendance,
        });
      } catch (attErr) {
        // console.log('Attendance fetch failed:', attErr.message);
        return res.json({
          success: true,
          message: "Logged in but could not fetch attendance",
          error: attErr.message,
        });
      }
    }

    // console.log('Login unclear, first 500 chars:', loginHtml.substring(0, 500));
    return res
      .status(401)
      .json({ error: "Login failed. Please check credentials and captcha." });
  } catch (e) {
    console.error("Login error:", e.message);
    res.status(500).json({ error: "Login failed: " + e.message });
  }
});

// Fetch attendance after login
async function fetchAttendance(client, username, loginResponseHtml) {
  // console.log('\n=== Fetching attendance for:', username, '===');

  const $ = cheerio.load(loginResponseHtml || "");

  // Collect ALL frame sources from login response
  const allFrames = [];

  // Check for frames in the login response
  $("frame, iframe").each((i, el) => {
    const src = $(el).attr("src") || "";
    const name = $(el).attr("name") || `frame_${i}`;
    if (src) {
      const fullUrl = src.startsWith("http") ? src : `${BASE_URL}/${src}`;
      // console.log(`[Login] Frame [${name}]: ${src.substring(0, 80)}`);
      allFrames.push({ name, url: fullUrl, source: "login" });
    }
  });

  // Also look for plum_url links directly in login response
  const plumUrlMatch = loginResponseHtml.match(/plum_url\.php\?[^'"&\s<>]+/g);
  if (plumUrlMatch) {
    // console.log('Found', plumUrlMatch.length, 'plum_url references in login response');
    plumUrlMatch.forEach((url, i) => {
      const fullUrl = `${BASE_URL}/${url}`;
      if (!allFrames.some((f) => f.url === fullUrl)) {
        allFrames.push({ name: `plum_${i}`, url: fullUrl, source: "regex" });
      }
    });
  }

  // console.log('Total frames to explore:', allFrames.length);

  let attendanceUrl = null;
  const visitedUrls = new Set();

  // BFS through frames to find attendance link
  while (allFrames.length > 0 && !attendanceUrl) {
    const frame = allFrames.shift();

    if (visitedUrls.has(frame.url)) continue;
    visitedUrls.add(frame.url);

    try {
      // console.log(`\nFetching [${frame.name}]: ${frame.url.substring(0, 90)}...`);

      const frameRes = await client.get(frame.url, {
        headers: getHeaders(`${BASE_URL}/student_login.php`),
      });

      const frameHtml = frameRes.data;
      // console.log(`  Response length: ${frameHtml.length}`);

      // Check if session expired
      if (
        frameHtml.includes("Session expired") ||
        frameHtml.includes("No Rights")
      ) {
        // console.log('  ⚠️ Session expired message detected');
        continue;
      }

      const $frame = cheerio.load(frameHtml);

      // Look for attendance link
      $frame("a").each((i, el) => {
        const href = $frame(el).attr("href") || "";
        const text = ($frame(el).text() || "").trim();
        const textLower = text.toLowerCase();

        if (href.includes("plum_url")) {
          // console.log(`  Link: "${text}" -> ${href.substring(0, 60)}`);

          // Match attendance-related links
          if (
            textLower.includes("attendance") ||
            textLower.includes("view att") ||
            textLower.includes("att. record")
          ) {
            attendanceUrl = href.startsWith("http")
              ? href
              : `${BASE_URL}/${href}`;
            // console.log('  ✅ FOUND ATTENDANCE LINK!');
          }
        }
      });

      if (attendanceUrl) break;

      // Add nested frames to queue
      $frame("frame, iframe").each((i, el) => {
        const src = $frame(el).attr("src") || "";
        const name = $frame(el).attr("name") || `nested_${i}`;
        if (src && src.includes("plum_url")) {
          const fullUrl = src.startsWith("http") ? src : `${BASE_URL}/${src}`;
          if (!visitedUrls.has(fullUrl)) {
            // console.log(`  Adding nested frame [${name}]`);
            allFrames.push({ name, url: fullUrl, source: "nested" });
          }
        }
      });
    } catch (e) {
      // console.log(`  Error: ${e.message}`);
    }
  }

  if (!attendanceUrl) {
    throw new Error("Attendance link not found after exploring all frames");
  }

  // console.log('\n=== Getting attendance form ===');
  // console.log('URL:', attendanceUrl.substring(0, 100));

  // Step 2: Fetch the attendance form page
  const formRes = await client.get(attendanceUrl, {
    headers: getHeaders(`${BASE_URL}/student_login.php`),
  });

  // console.log('Form page length:', formRes.data.length);

  if (
    formRes.data.includes("Session expired") ||
    formRes.data.includes("No Rights")
  ) {
    throw new Error("Session expired when accessing attendance form");
  }

  // Parse form and extract all fields
  const $form = cheerio.load(formRes.data);
  const formData = {};

  // Get hidden inputs (includes enc_year, enc_sem, etc.)
  $form("input").each((i, el) => {
    const name = $form(el).attr("name");
    const value = $form(el).attr("value") || "";
    if (name) {
      formData[name] = value;
      // console.log(`Form field: ${name} = ${value.substring(0, 60)}`);
    }
  });

  // Get select values - but we'll override year/sem with hardcoded values
  $form("select").each((i, el) => {
    const name = $form(el).attr("name");
    if (name && name !== "year" && name !== "sem") {
      const selected = $form(el).find("option[selected]");
      formData[name] = selected.length
        ? selected.val()
        : $form(el).find("option").first().val();
      // console.log(`Select field: ${name} = ${formData[name]}`);
    }
  });

  // HARDCODED values for year and semester - these MUST override form defaults
  formData.year = "2026-27";
  formData.sem = "5";
  formData.submit = "Submit";
  // Keep recentitycode from form if present, otherwise use username
  formData.recentitycode = formData.recentitycode || username.toUpperCase();

  // console.log('Final form data - year:', formData.year, 'sem:', formData.sem);

  // console.log('\n=== Submitting attendance form ===');

  // Step 3: POST to get attendance
  const attRes = await client.post(attendanceUrl, qs.stringify(formData), {
    headers: {
      ...getHeaders(attendanceUrl),
      "Content-Type": "application/x-www-form-urlencoded",
      Origin: "https://www.imsnsit.org",
    },
  });

  // console.log('Attendance response length:', attRes.data.length);

  if (
    attRes.data.includes("Session expired") ||
    attRes.data.includes("No Rights")
  ) {
    // console.log('Response preview:', attRes.data.substring(0, 300));
    throw new Error("Session expired when fetching attendance data");
  }

  // console.log('Attendance preview:', attRes.data.substring(0, 400));
  // console.log('=== Attendance data fetched ===');
  return parseAttendance(attRes.data);
}

// --- ROUTE 3: ATTENDANCE (separate endpoint if needed) ---
app.post("/api/attendance", async (req, res) => {
  const { sessionId } = req.body;

  if (!sessionStore.has(sessionId)) {
    return res.status(400).json({ error: "Session expired" });
  }

  const session = sessionStore.get(sessionId);
  if (!session.loggedIn) {
    return res.status(401).json({ error: "Not logged in" });
  }

  const client = wrapper(
    axios.create({
      jar: session.jar,
      withCredentials: true,
    }),
  );

  try {
    const attendance = await fetchAttendance(
      client,
      session.username,
      session.loginHtml,
    );
    res.json({ success: true, data: attendance });
  } catch (e) {
    console.error("Attendance error:", e.message);
    res.status(500).json({ error: e.message });
  }
});

// Cleanup old sessions
setInterval(
  () => {
    const now = Date.now();
    for (const [id, session] of sessionStore.entries()) {
      if (now - session.createdAt > 30 * 60 * 1000) {
        sessionStore.delete(id);
      }
    }
  },
  5 * 60 * 1000,
);

app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`),
);
