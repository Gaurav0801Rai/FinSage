import "server-only";
import { spawn, ChildProcess } from "child_process";

// Cache for child process to keep local stdio connection alive across requests
let cachedProcess: ChildProcess | null = null;
let requestId = 1;

// Maps pending requests to their resolve/reject handlers
const pendingRequests = new Map<number, { resolve: (val: any) => void; reject: (err: any) => void }>();

/**
 * Initializes and starts the local MCP server via stdio
 */
function getStdioProcess(): ChildProcess | null {
  if (cachedProcess) return cachedProcess;

  const mcpPath = process.env.MCP_SERVER_PATH;
  if (!mcpPath) {
    console.warn("[MCP Client] MCP_SERVER_PATH environment variable not set. Stdio transport disabled.");
    return null;
  }

  try {
    console.log(`[MCP Client] Spawning MCP server from path: ${mcpPath}`);
    
    // Check if it's a node script or executable
    const isJS = mcpPath.endsWith(".js") || mcpPath.endsWith(".ts");
    const cmd = isJS ? "node" : mcpPath;
    const args = isJS ? [mcpPath] : [];

    const proc = spawn(cmd, args, {
      stdio: ["pipe", "pipe", "inherit"],
      env: { ...process.env },
    });

    proc.on("error", (err) => {
      console.error("[MCP Client] MCP process error:", err);
      cachedProcess = null;
    });

    proc.on("exit", (code) => {
      console.log(`[MCP Client] MCP process exited with code ${code}`);
      cachedProcess = null;
    });

    // Handle incoming stdout data
    let buffer = "";
    proc.stdout?.on("data", (data) => {
      buffer += data.toString();
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // keep incomplete line in buffer

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const response = JSON.parse(line);
          if (response.id && pendingRequests.has(response.id)) {
            const { resolve, reject } = pendingRequests.get(response.id)!;
            pendingRequests.delete(response.id);
            if (response.error) {
              reject(new Error(response.error.message || "Unknown JSON-RPC error"));
            } else {
              resolve(response.result);
            }
          }
        } catch (e) {
          console.warn("[MCP Client] Error parsing JSON-RPC line from MCP server:", line, e);
        }
      }
    });

    cachedProcess = proc;
    return proc;
  } catch (err) {
    console.error("[MCP Client] Failed to spawn MCP server:", err);
    return null;
  }
}

/**
 * Executes a JSON-RPC request over stdio transport
 */
function executeOverStdio(method: string, params: any): Promise<any> {
  const proc = getStdioProcess();
  if (!proc) {
    return Promise.reject(new Error("Local MCP server stdio process is unavailable"));
  }
  const stdin = proc.stdin;
  if (!stdin) {
    return Promise.reject(new Error("Local MCP server stdin stream is unavailable"));
  }

  return new Promise((resolve, reject) => {
    const id = requestId++;
    const request = {
      jsonrpc: "2.0",
      id,
      method,
      params,
    };

    pendingRequests.set(id, { resolve, reject });
    
    try {
      stdin.write(JSON.stringify(request) + "\n");
    } catch (err) {
      pendingRequests.delete(id);
      reject(err);
    }
  });
}

/**
 * Executes a JSON-RPC request over HTTP/SSE transport
 */
async function executeOverHttp(url: string, method: string, params: any): Promise<any> {
  const id = requestId++;
  const request = {
    jsonrpc: "2.0",
    id,
    method,
    params,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 seconds timeout

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Include API Key or Secret if configured
        ...(process.env.MCP_SERVER_SECRET ? { "Authorization": `Bearer ${process.env.MCP_SERVER_SECRET}` } : {}),
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error calling MCP server: ${response.status} ${response.statusText}`);
    }

    const responseData = await response.json();
    if (responseData.error) {
      throw new Error(responseData.error.message || "Unknown HTTP JSON-RPC error");
    }

    return responseData.result;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

/**
 * Main execution function to call an MCP tool.
 * Limits calls exclusively to Gmail tools for security.
 */
export async function callMcpTool(toolName: string, args: Record<string, any>): Promise<{ content: Array<{ type: string; text: string }> }> {
  // Security Boundary Check: only allow gmail_ prefixed tools
  if (!toolName.startsWith("gmail_") && !toolName.includes("gmail")) {
    throw new Error(`Permission Denied: Tool '${toolName}' is not allowed. Only Gmail tools can be executed.`);
  }

  const sseUrl = (process.env.MCP_SERVER_URL || "https://google-mcp-server-production-72f8.up.railway.app").replace(/\/$/, "");

  try {
    let result: any;
    if (sseUrl) {
      // Production or cloud-bridge route (custom FastAPI server mapping)
      console.log(`[MCP Client] Mapping tool '${toolName}' to FastAPI HTTP: ${sseUrl}`);
      
      const endpoint = toolName === "gmail_send_message"
        ? "/send_email"
        : toolName.includes("draft") || toolName.includes("message") 
          ? "/create_email_draft" 
          : "/append_to_doc";

      const payload = endpoint === "/create_email_draft" || endpoint === "/send_email"
        ? {
            to: args.to || "",
            subject: args.subject || "",
            body: args.body || args.text_body || "",
          }
        : {
            doc_id: args.doc_id || args.document_id || "",
            content: args.content || "",
          };

      const response = await fetch(`${sseUrl}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(process.env.MCP_SERVER_SECRET ? { "Authorization": `Bearer ${process.env.MCP_SERVER_SECRET}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error calling FastAPI MCP server: ${response.status} ${response.statusText}`);
      }

      const responseData = await response.json();
      const entityId = responseData?.data?.id || "";
      const isSend = endpoint === "/send_email";

      return {
        content: [
          {
            type: "text",
            text: isSend
              ? `[SUCCESS] Email successfully sent. Message ID: ${entityId}`
              : `[SUCCESS] Draft successfully created. Draft ID: ${entityId}`,
          },
        ],
      };
    } else if (process.env.MCP_SERVER_PATH) {
      // Local dev stdio route
      console.log(`[MCP Client] Executing tool '${toolName}' over stdio`);
      result = await executeOverStdio("tools/call", {
        name: toolName,
        arguments: args,
      });
    } else {
      // Fallback/Mock mode when not configured
      console.warn(`[MCP Client] No MCP server environment variables configured. Simulating draft creation.`);
      
      // Simulate draft creation response so UI/pipeline doesn't fail
      return {
        content: [
          {
            type: "text",
            text: `[MOCK SUCCESS] Draft successfully created/sent to ${args.to || args.recipient || "unknown"} (Subject: ${args.subject || "No Subject"})`,
          },
        ],
      };
    }

    return result;
  } catch (err) {
    console.error(`[MCP Client] Error calling tool '${toolName}':`, err);
    throw err;
  }
}
