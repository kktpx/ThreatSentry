import html
import os
from pathlib import Path
import sqlite3
from typing import Any
from fastapi import FastAPI, Form, Query, Request, Response
from fastapi.responses import HTMLResponse, PlainTextResponse

app = FastAPI(title="ThreatSentry Controlled Vulnerable Lab", version="1.0.0")

# In-memory SQLite database for realistic SQL injection testing
def get_db():
    conn = sqlite3.connect(":memory:", check_same_thread=False)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("CREATE TABLE products (id TEXT, name TEXT, price REAL, description TEXT)")
    cursor.executemany(
        "INSERT INTO products VALUES (?, ?, ?, ?)",
        [
            ("1", "Secure Laptop Stand", 39.99, "Ergonomic aluminum stand for high productivity"),
            ("2", "Mechanical Keyboard", 129.50, "Tactile wireless keyboard with RGB lighting"),
            ("3", "Privacy Screen Protector", 24.00, "Anti-glare security filter for laptop displays"),
        ],
    )
    conn.commit()
    return conn

DB_CONN = get_db()

# State for verification token
TOKEN_FILE = Path("labs/threatsentry.txt")
_in_memory_token = "ts_lab_token_demo"

if TOKEN_FILE.exists():
    try:
        _in_memory_token = TOKEN_FILE.read_text("utf-8").strip().replace("threatsentry-verification=", "")
    except Exception:
        pass


@app.middleware("http")
async def add_passive_vulnerabilities(request: Request, call_next):
    """Adds realistic passive security oversights (banner disclosure, missing headers, insecure cookies)."""
    response: Response = await call_next(request)
    # 1. Server banner disclosure
    response.headers["Server"] = "VulnerableLab/1.0 (Ubuntu 22.04)"
    response.headers["X-Powered-By"] = "PHP/8.1.0-Simulated"

    # 2. Insecure cookie flag omission (no Secure, no HttpOnly, no SameSite)
    response.headers.append("Set-Cookie", "lab_session=guest_abc12345; Path=/")

    # Deliberately omits Content-Security-Policy, HSTS, X-Frame-Options, etc.
    return response


@app.get("/.well-known/threatsentry.txt", response_class=PlainTextResponse)
def get_verification_challenge(request: Request, token: str | None = None):
    """Serves the ownership challenge token for ThreatSentry verification."""
    global _in_memory_token
    if TOKEN_FILE.exists():
        try:
            _in_memory_token = TOKEN_FILE.read_text("utf-8").strip().replace("threatsentry-verification=", "")
        except Exception:
            pass
    effective_token = (
        request.headers.get("X-ThreatSentry-Token")
        or request.query_params.get("token")
        or token
        or _in_memory_token
    )
    return f"threatsentry-verification={effective_token}\n"


@app.get("/set-token", response_class=HTMLResponse)
@app.post("/set-token", response_class=HTMLResponse)
def set_verification_token(token: str = Query(default="", alias="token")):
    global _in_memory_token
    clean_token = token.strip().replace("threatsentry-verification=", "")
    if clean_token:
        _in_memory_token = clean_token
        try:
            TOKEN_FILE.parent.mkdir(parents=True, exist_ok=True)
            TOKEN_FILE.write_text(f"threatsentry-verification={clean_token}\n", encoding="utf-8")
        except Exception:
            pass

    return HTMLResponse(f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Token Updated - ThreatSentry Lab</title>
        <style>body {{ font-family: sans-serif; background: #0b1329; color: #e2e8f0; padding: 2rem; }}</style>
    </head>
    <body>
        <h2>Verification Token Updated!</h2>
        <p>Active Token: <code>threatsentry-verification={_in_memory_token}</code></p>
        <p><a href="/" style="color: #38bdf8;">&larr; Back to Lab Home</a></p>
    </body>
    </html>
    """)


@app.get("/", response_class=HTMLResponse)
def home():
    return HTMLResponse(f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>ThreatSentry Test Target Lab</title>
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #070d18; color: #e2e8f0; margin: 0; padding: 2rem; }}
            .container {{ max-width: 800px; margin: 0 auto; }}
            .card {{ background: #0e1726; border: 1px solid #1e293b; border-radius: 8px; padding: 1.5rem; margin-bottom: 1.5rem; }}
            h1, h2, h3 {{ color: #ffffff; }}
            input[type="text"] {{ background: #1e293b; border: 1px solid #334155; color: white; padding: 0.5rem 0.75rem; border-radius: 4px; width: 60%; }}
            button {{ background: #0284c7; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; font-weight: bold; }}
            button:hover {{ background: #0369a1; }}
            a {{ color: #38bdf8; text-decoration: none; }}
            a:hover {{ text-decoration: underline; }}
            code {{ background: #1e293b; padding: 0.2rem 0.4rem; border-radius: 4px; font-family: monospace; color: #7dd3fc; }}
            .badge {{ display: inline-block; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: bold; }}
            .vuln {{ background: #881337; color: #fda4af; }}
            .safe {{ background: #064e3b; color: #6ee7b7; }}
        </style>
    </head>
    <body>
        <div class="container">
            <h1>ThreatSentry Test Lab Target</h1>
            <p>A controlled vulnerable testing environment running locally on <code>http://localhost:8080</code> for verifying crawlers, active scanners (SQLi, XSS), and hybrid ML analysis.</p>

            <!-- Verification Card -->
            <div class="card">
                <h2>1. Website Verification Token</h2>
                <p>Current active challenge token: <code>threatsentry-verification={_in_memory_token}</code></p>
                <form action="/set-token" method="GET" style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
                    <input type="text" name="token" placeholder="Paste token from ThreatSentry (e.g. ts_verify_...)" value="{_in_memory_token}" required />
                    <button type="submit">Update Token</button>
                </form>
            </div>

            <!-- Vulnerable Reflected XSS -->
            <div class="card">
                <h2>2. Search Service <span class="badge vuln">Vulnerable: Reflected XSS</span></h2>
                <p>Input in parameter <code>q</code> is rendered directly into HTML without context-aware entity encoding.</p>
                <form action="/search" method="GET" style="display: flex; gap: 0.5rem;">
                    <input type="text" name="q" value="laptop stand" />
                    <button type="submit">Search Products</button>
                </form>
            </div>

            <!-- Vulnerable SQL Injection -->
            <div class="card">
                <h2>3. Product Catalog <span class="badge vuln">Vulnerable: SQL Injection</span></h2>
                <p>Parameter <code>id</code> is interpolated directly into an in-memory SQLite query.</p>
                <ul>
                    <li><a href="/products?id=1">Product 1 (Secure Laptop Stand)</a></li>
                    <li><a href="/products?id=2">Product 2 (Mechanical Keyboard)</a></li>
                    <li><a href="/products?id=3">Product 3 (Privacy Screen Protector)</a></li>
                    <li><a href="/products?id=1%27">Trigger Error: Product ID <code>1'</code></a></li>
                </ul>
            </div>

            <!-- Benign Navigation Links -->
            <div class="card">
                <h2>4. Benign Site Navigation <span class="badge safe">Safe Traffic</span></h2>
                <p>Static pages used by the ThreatSentry crawler to discover site map and verify passive headers.</p>
                <p><a href="/about">About Us</a> &bull; <a href="/contact">Contact Page</a> &bull; <a href="/.well-known/threatsentry.txt">View Verification File</a></p>
            </div>
        </div>
    </body>
    </html>
    """)


@app.get("/search", response_class=HTMLResponse)
def search(q: str = "laptop"):
    """Vulnerable to Reflected XSS: Parameter 'q' is reflected unescaped."""
    return HTMLResponse(f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Search Results - ThreatSentry Lab</title>
        <style>body {{ font-family: sans-serif; background: #070d18; color: #e2e8f0; padding: 2rem; }} a {{ color: #38bdf8; }}</style>
    </head>
    <body>
        <h1>Search Results</h1>
        <!-- Vulnerability: Raw unencoded reflection -->
        <p>You searched for: <strong>{q}</strong></p>

        <div style="margin-top: 1.5rem;">
            <p>Found 3 matching items.</p>
            <ul>
                <li>Laptop Stand (Aluminum)</li>
                <li>Adjustable Desk Riser</li>
                <li>Compact Laptop Sleeve</li>
            </ul>
        </div>
        <p><a href="/">&larr; Back to Home</a></p>
    </body>
    </html>
    """)


@app.get("/products", response_class=HTMLResponse)
def get_product(id: str = "1"):
    """Vulnerable to SQL Injection: Parameter 'id' is concatenated into query."""
    cursor = DB_CONN.cursor()
    query = f"SELECT id, name, price, description FROM products WHERE id = '{id}'"
    try:
        cursor.execute(query)
        row = cursor.fetchone()
        if not row:
            return HTMLResponse("""
            <!DOCTYPE html>
            <html><body style="background:#070d18; color:white; font-family:sans-serif; padding:2rem;">
            <h2>Product Not Found</h2>
            <p><a href="/" style="color:#38bdf8;">&larr; Back to Catalog</a></p>
            </body></html>
            """, status_code=404)

        return HTMLResponse(f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>{html.escape(row['name'])} - ThreatSentry Lab</title>
            <style>body {{ font-family: sans-serif; background: #070d18; color: #e2e8f0; padding: 2rem; }} a {{ color: #38bdf8; }}</style>
        </head>
        <body>
            <h1>{html.escape(row['name'])}</h1>
            <p><strong>Price:</strong> ${row['price']:.2f}</p>
            <p><strong>Description:</strong> {html.escape(row['description'])}</p>
            <p><a href="/">&larr; Back to Catalog</a></p>
        </body>
        </html>
        """)
    except sqlite3.OperationalError as exc:
        # Deliberately expose sqlite3.OperationalError for authentic error-based detection
        return HTMLResponse(f"""
        <!DOCTYPE html>
        <html>
        <head><title>500 Internal Server Error</title></head>
        <body style="background:#1a050b; color:#fda4af; font-family:monospace; padding:2rem;">
            <h2>Database Query Execution Error</h2>
            <p><strong>sqlite3.OperationalError:</strong> {html.escape(str(exc))}</p>
            <pre>Query: {html.escape(query)}</pre>
        </body>
        </html>
        """, status_code=500)


@app.get("/about", response_class=HTMLResponse)
def about():
    return HTMLResponse("""
    <!DOCTYPE html>
    <html><body style="background:#070d18; color:#e2e8f0; font-family:sans-serif; padding:2rem;">
        <h1>About ThreatSentry Test Lab</h1>
        <p>This application is deliberately designed for vulnerability testing, hybrid ML evaluation, and automated scanning benchmarks.</p>
        <p><a href="/" style="color:#38bdf8;">&larr; Back to Home</a></p>
    </body></html>
    """)


@app.get("/contact", response_class=HTMLResponse)
def contact():
    return HTMLResponse("""
    <!DOCTYPE html>
    <html><body style="background:#070d18; color:#e2e8f0; font-family:sans-serif; padding:2rem;">
        <h1>Contact Support</h1>
        <p>Email: security-lab@threatsentry.local</p>
        <p><a href="/" style="color:#38bdf8;">&larr; Back to Home</a></p>
    </body></html>
    """)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8080)
