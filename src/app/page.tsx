/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { API_PAYLOAD_TEMPLATES } from "@/constants/schemaTemplates";

// --- ENDPOINT DICTIONARY ---
const endpoints = [
  {
    group: "Authentication",
    path: "/api/auth/login",
    method: "POST",
    isSecure: false,
    desc: "Admin Login (Mobile + Pass)",
  },
  {
    group: "Authentication",
    path: "/api/auth/me",
    method: "GET",
    isSecure: true,
    desc: "Verify current Access Token",
  },
  {
    group: "Authentication",
    path: "/api/auth/refresh",
    method: "POST",
    isSecure: false,
    desc: "Get new Access Token",
  },
  {
    group: "Azan & Prayer",
    path: "/api/azan",
    method: "GET",
    isSecure: false,
    desc: "Get Live Prayer Times (Public)",
  },
  {
    group: "Azan & Prayer",
    path: "/api/azan",
    method: "PUT",
    isSecure: true,
    desc: "Update Live Prayer Times",
  },
  {
    group: "Announcements",
    path: "/api/announcements",
    method: "GET",
    isSecure: false,
    desc: "Get Active Banners",
  },
  {
    group: "Announcements",
    path: "/api/announcements",
    method: "POST",
    isSecure: true,
    desc: "Create new Banner",
  },
  {
    group: "Announcements",
    path: "/api/announcements/[id]",
    method: "PUT",
    isSecure: true,
    desc: "Update a Banner",
  },
  {
    group: "Announcements",
    path: "/api/announcements/[id]",
    method: "DELETE",
    isSecure: true,
    desc: "Delete a Banner",
  },
  {
    group: "Notifications",
    path: "/api/notifications/broadcast",
    method: "POST",
    isSecure: true,
    desc: "Send Firebase Push",
  },
  {
    group: "Notifications",
    path: "/api/notifications/history",
    method: "GET",
    isSecure: true,
    desc: "View Sent History",
  },
  {
    group: "System Config",
    path: "/api/config",
    method: "GET",
    isSecure: false,
    desc: "Get Global App Settings",
  },
  {
    group: "System Config",
    path: "/api/config",
    method: "PUT",
    isSecure: true,
    desc: "Update App Settings",
  },
  {
    group: "Audit Logs",
    path: "/api/audit-logs",
    method: "GET",
    isSecure: true,
    desc: "View Admin Activity Logs",
  },
];

export default function Home() {
  // Login States
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [mobileError, setMobileError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Dual-Token States
  const [accessToken, setAccessToken] = useState("");
  const [refreshToken, setRefreshToken] = useState("");
  const [user, setUser] = useState<{ name?: string; role?: string } | null>(
    null,
  );

  // API Tester States
  const [testMethod, setTestMethod] = useState("GET");
  const [testUrl, setTestUrl] = useState("/api/azan");
  const [testBody, setTestBody] = useState("");
  const [testResponse, setTestResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Payload Builder States
  const [selectedSchema, setSelectedSchema] = useState("");
  const [checkedFields, setCheckedFields] = useState<string[]>([]);

  // Modal State
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    type: "success" | "error";
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  });

  const validateMobile = (input: string) => {
    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(input)) {
      setMobileError("Mobile number must be exactly 10 digits.");
      return false;
    }
    setMobileError("");
    return true;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateMobile(mobile)) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobileNumber: mobile, password }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setAccessToken(data.data.accessToken);
        setRefreshToken(data.data.refreshToken);
        setUser(data.data.user);
        setPassword(""); // Clear password on success

        setModalConfig({
          isOpen: true,
          type: "success",
          title: "Login Successful",
          message: `Welcome back, ${data.data.user?.name || "Admin"}!\n\nTokens acquired successfully.`,
        });
      } else {
        setModalConfig({
          isOpen: true,
          type: "error",
          title: "Login Failed",
          message: JSON.stringify(data, null, 2),
        });
      }
    } catch (err: any) {
      setModalConfig({
        isOpen: true,
        type: "error",
        title: "Network Error",
        message: err.message,
      });
    }
    setIsLoading(false);
  };

  // ✅ NEW: Auto-Refresh Token Logic
  const handleRefreshToken = async () => {
    if (!refreshToken) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setAccessToken(data.data.accessToken);
        setRefreshToken(data.data.refreshToken); // Overwrite old with new
        setModalConfig({
          isOpen: true,
          type: "success",
          title: "Token Refreshed 🔄",
          message: `Your session has been extended successfully. Your new tokens have replaced the old ones.`,
        });
      } else {
        setModalConfig({
          isOpen: true,
          type: "error",
          title: "Refresh Failed",
          message: JSON.stringify(data, null, 2),
        });
      }
    } catch (err: any) {
      setModalConfig({
        isOpen: true,
        type: "error",
        title: "Network Error",
        message: err.message,
      });
    }
    setIsLoading(false);
  };

  // ✅ NEW: Payload Builder Logic
  // ✅ REPLACE your toggleField function with this:
const toggleField = (field: string) => {
  const newCheckedFields = checkedFields.includes(field)
    ? checkedFields.filter((f) => f !== field)
    : [...checkedFields, field];

  setCheckedFields(newCheckedFields);

  // Update JSON body instantly
  if (selectedSchema && API_PAYLOAD_TEMPLATES[selectedSchema]) {
    const template = API_PAYLOAD_TEMPLATES[selectedSchema];
    const builtBody: any = {};
    newCheckedFields.forEach((f) => {
      builtBody[f] = template[f];
    });
    setTestBody(JSON.stringify(builtBody, null, 2));
  }
};

// ✅ REPLACE your selectSchema function with this:
const selectSchema = (schemaKey: string) => {
  if (schemaKey) {
    setSelectedSchema(schemaKey);
    const newCheckedFields = Object.keys(API_PAYLOAD_TEMPLATES[schemaKey]);
    setCheckedFields(newCheckedFields);

    // Update JSON body instantly
    const template = API_PAYLOAD_TEMPLATES[schemaKey];
    const builtBody: any = {};
    newCheckedFields.forEach((f) => {
      builtBody[f] = template[f];
    });
    setTestBody(JSON.stringify(builtBody, null, 2));
  } else {
    setSelectedSchema("");
    setCheckedFields([]);
    setTestBody("");
  }
};

  const handleTestApi = async () => {
    setIsLoading(true);
    setTestResponse("Fetching...");
    try {
      const headers: any = { "Content-Type": "application/json" };
      if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

      const options: any = { method: testMethod, headers };
      if (testMethod !== "GET" && testMethod !== "DELETE" && testBody) {
        options.body = testBody;
      }

      const res = await fetch(testUrl, options);
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        const data = await res.json();
        setTestResponse(JSON.stringify(data, null, 2));
      } else {
        const text = await res.text();
        setTestResponse(
          `HTML/Error Response received:\n\n${text.substring(0, 300)}...`,
        );
      }
    } catch (err: any) {
      setTestResponse("Request Failed: " + err.message);
    }
    setIsLoading(false);
  };

  const loadEndpoint = (path: string, method: string) => {
    setTestUrl(path);
    setTestMethod(method);
    if (method === "GET" || method === "DELETE") setTestBody("");
    else setTestBody("{\n  \n}");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-linear-to-br from-zinc-50 to-zinc-200 dark:from-zinc-950 dark:to-zinc-900 text-zinc-900 dark:text-zinc-100 p-4 md:p-8 font-sans">
      {/* Modal Popup remains exactly the same... */}
      {modalConfig.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">
                {modalConfig.type === "success" ? "✅" : "❌"}
              </span>
              <h3
                className={`text-xl font-extrabold ${modalConfig.type === "success" ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"}`}
              >
                {modalConfig.title}
              </h3>
            </div>
            <div className="bg-zinc-50 dark:bg-black p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 mb-6 max-h-60 overflow-y-auto">
              <pre className="text-sm font-mono whitespace-pre-wrap break-words text-zinc-700 dark:text-zinc-300">
                {modalConfig.message}
              </pre>
            </div>
            <button
              onClick={() => setModalConfig({ ...modalConfig, isOpen: false })}
              className="w-full py-4 bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-black rounded-xl font-bold"
            >
              OK, Got it
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-8 flex-1 w-full">
        {/* Header remains exactly the same... */}
        <header className="flex flex-col md:flex-row justify-between items-center bg-white/50 dark:bg-black/20 backdrop-blur-md p-6 rounded-3xl border border-white/20 shadow-sm">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-blue-600 to-teal-500 dark:from-blue-400 dark:to-teal-300">
              Bilali Masjid API Gateway
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
              Serverless Backend System & Live Tester
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-2">
            <span className="px-3 py-1 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 text-sm font-bold rounded-full border border-green-200 dark:border-green-800">
              v1.2 Pro
            </span>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-6">
            {/* 1. LOGIN WIDGET */}
            <div className="bg-white dark:bg-zinc-900/80 p-6 rounded-3xl shadow-lg border border-zinc-100 dark:border-zinc-800 backdrop-blur-sm">
              <h2 className="text-xl font-bold mb-5 flex items-center gap-2">
                <span className="text-2xl">🔐</span> Admin Authentication
              </h2>
              {!accessToken ? (
                // Login Form remains exactly the same...
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <input
                      type="text"
                      maxLength={10}
                      placeholder="10-Digit Mobile Number"
                      required
                      value={mobile}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, "");
                        setMobile(val);
                        if (mobileError) validateMobile(val);
                      }}
                      className={`w-full p-4 rounded-xl bg-zinc-50 dark:bg-black border ${mobileError ? "border-red-500 ring-1 ring-red-500" : "border-zinc-200 dark:border-zinc-800"} outline-none font-mono text-lg tracking-wider`}
                    />
                    {mobileError && (
                      <p className="text-red-500 text-xs mt-2 ml-1 font-semibold">
                        {mobileError}
                      </p>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full p-4 pr-12 rounded-xl bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
                    >
                      {showPassword ? "👁️" : "🙈"}
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 text-white font-bold py-4 rounded-xl shadow-md"
                  >
                    {isLoading ? "Authenticating..." : "Generate Token 🚀"}
                  </button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-linear-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800/50 rounded-xl flex items-start gap-3">
                    <span className="text-2xl mt-1">✅</span>
                    <div className="w-full">
                      <p className="font-bold text-green-800 dark:text-green-400">
                        Welcome, {user?.name}
                      </p>
                      <p className="text-xs font-semibold text-green-600 dark:text-green-500 mt-1 uppercase tracking-wider">
                        {user?.role}
                      </p>
                      <div className="mt-3 space-y-2">
                        <div className="bg-white/50 dark:bg-black/50 p-2 rounded text-[10px] font-mono break-all text-zinc-500">
                          <span className="font-bold text-zinc-700 dark:text-zinc-300">
                            Access:
                          </span>{" "}
                          {accessToken.substring(0, 20)}...
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ✅ NEW: Refresh Token & Logout Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={handleRefreshToken}
                      disabled={isLoading}
                      className="flex-1 py-3 text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 rounded-xl transition-colors"
                    >
                      🔄 Refresh Session
                    </button>
                    <button
                      onClick={() => {
                        setAccessToken("");
                        setRefreshToken("");
                        setUser(null);
                      }}
                      className="flex-1 py-3 text-sm font-bold text-red-500 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 rounded-xl transition-colors"
                    >
                      Logout ❌
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 2. API TESTER WIDGET */}
            <div className="bg-white dark:bg-zinc-900/80 p-6 rounded-3xl shadow-lg border border-zinc-100 dark:border-zinc-800 backdrop-blur-sm flex flex-col h-175">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <span className="text-2xl">⚡</span> Live HTTP Tester
                </h2>
              </div>

              <div className="flex gap-2 mb-4">
                <select
                  value={testMethod}
                  onChange={(e) => setTestMethod(e.target.value)}
                  className="bg-zinc-100 dark:bg-black p-3 rounded-xl outline-none font-bold border border-zinc-200 dark:border-zinc-800"
                >
                  <option>GET</option>
                  <option>POST</option>
                  <option>PUT</option>
                  <option>DELETE</option>
                </select>
                <input
                  type="text"
                  value={testUrl}
                  onChange={(e) => setTestUrl(e.target.value)}
                  className="flex-1 p-3 rounded-xl bg-zinc-100 dark:bg-black font-mono text-sm outline-none border border-zinc-200 dark:border-zinc-800"
                />
              </div>

              {/* ✅ NEW: PAYLOAD BUILDER CHECKLIST */}
              {(testMethod === "POST" || testMethod === "PUT") && (
                <div className="mb-4">
                  <div className="flex items-center justify-between bg-zinc-100 dark:bg-black px-4 py-2 rounded-t-xl border border-zinc-200 dark:border-zinc-800">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                      🛠️ Payload Builder
                    </span>
                    <select
                      value={selectedSchema}
                      onChange={(e) => selectSchema(e.target.value)}
                      className="bg-transparent text-sm font-bold text-blue-600 dark:text-blue-400 outline-none cursor-pointer"
                    >
                      <option value="">-- Choose Collection --</option>
                      {Object.keys(API_PAYLOAD_TEMPLATES).map((key) => (
                        <option key={key} value={key}>
                          {key}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedSchema && (
                    <div className="p-3 bg-zinc-50 dark:bg-zinc-950/50 border-x border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap gap-2 max-h-32 overflow-y-auto custom-scrollbar">
                      {Object.keys(API_PAYLOAD_TEMPLATES[selectedSchema]).map(
                        (field) => (
                          <label
                            key={field}
                            className="flex items-center gap-1.5 bg-white dark:bg-black px-2 py-1 rounded border border-zinc-200 dark:border-zinc-800 cursor-pointer hover:border-blue-500"
                          >
                            <input
                              type="checkbox"
                              checked={checkedFields.includes(field)}
                              onChange={() => toggleField(field)}
                              className="w-3 h-3 accent-blue-600"
                            />
                            <span className="text-[11px] font-mono text-zinc-700 dark:text-zinc-300">
                              {field}
                            </span>
                          </label>
                        ),
                      )}
                    </div>
                  )}

                  <textarea
                    value={testBody}
                    onChange={(e) => setTestBody(e.target.value)}
                    placeholder="JSON body will appear here..."
                    className={`w-full h-32 p-4 bg-zinc-100 dark:bg-black font-mono text-sm outline-none border-x border-b border-zinc-200 dark:border-zinc-800 resize-none ${!selectedSchema ? "rounded-b-xl border-t" : "rounded-b-xl"}`}
                  />
                </div>
              )}

              <button
                onClick={handleTestApi}
                disabled={isLoading}
                className="w-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black font-bold py-4 rounded-xl mb-4 hover:opacity-90 active:scale-[0.98]"
              >
                Send Request 🚀
              </button>

              <div className="flex-1 bg-zinc-950 rounded-xl p-4 overflow-y-auto border border-zinc-800 relative group custom-scrollbar">
                <span className="absolute top-2 right-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  JSON Response
                </span>
                <pre className="font-mono text-xs text-green-400 whitespace-pre-wrap break-words mt-4">
                  {testResponse || "// Awaiting connection..."}
                </pre>
              </div>
            </div>
          </div>

          {/* Right Column / Directory remains exactly the same as previously formatted */}
          <div className="lg:col-span-7 h-full">
            <div className="bg-white dark:bg-zinc-900/80 p-6 md:p-8 rounded-3xl shadow-lg border border-zinc-100 dark:border-zinc-800 backdrop-blur-sm flex flex-col h-175">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <span className="text-2xl">📚</span> Endpoint Directory
                </h2>
              </div>
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar transition-all">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
                  {endpoints.map((ep, idx) => (
                    <div
                      key={idx}
                      onClick={() => loadEndpoint(ep.path, ep.method)}
                      className="group bg-zinc-50 dark:bg-black/40 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-500 cursor-pointer hover:-translate-y-1"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <span
                          className={`text-[10px] font-black px-2 py-1 rounded-md tracking-wider ${ep.method === "GET" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400" : ep.method === "POST" ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400" : ep.method === "PUT" ? "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400" : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"}`}
                        >
                          {ep.method}
                        </span>
                        {ep.isSecure ? (
                          <span className="text-[9px] font-black flex items-center gap-1 text-zinc-400 border border-zinc-200 dark:border-zinc-800 px-2 py-0.5 rounded-md uppercase">
                            🔒 Private
                          </span>
                        ) : (
                          <span className="text-[9px] font-black flex items-center gap-1 text-blue-500 border border-blue-200 dark:border-blue-900/40 px-2 py-0.5 rounded-md uppercase">
                            🌐 Public
                          </span>
                        )}
                      </div>
                      <p className="font-mono text-[13px] font-bold truncate text-zinc-800 dark:text-zinc-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {ep.path}
                      </p>
                      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-1 italic">
                        {ep.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer remains exactly the same... */}
      </div>
    </div>
  );
}
