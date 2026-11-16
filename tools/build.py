"""Build the essay pages, the homepage's essay list, the feed and the sitemap.

Run from anywhere: python3 tools/build.py

Each essay is a fragment in tools/essays/<slug>.html: a JSON comment with its details,
then the body as <section class="chapter"> blocks. SERIES below sets the reading order.
Everything this writes is committed, so the site still deploys as plain static files.
"""

import hashlib
import html
import json
import re
from datetime import date
from pathlib import Path

site = Path(__file__).resolve().parent.parent
src = site / "tools" / "essays"
URL = "https://jameswiesebron.com"
AUTHOR = "James Wiesebron"
OVERVIEW = "intentional-agentic-work"

# Reading order. The overview comes first and every other essay links back to it.
SERIES = [
    OVERVIEW,
    "attention-is-all-you-need-to-protect",
    "give-agents-a-contract",
    "nothing-to-decide-is-a-claim",
    "reseed-dont-compact",
    "agreement-isnt-verification",
    "teams-not-swarms",
    "code-owns-the-clock",
    "stop-telling-agents",
    "connectors-agents-cant-misuse",
]

# Three arrangements of the hero's decorative shapes, used in turn.
# They stay in the right quarter of the hero, clear of the title.
DECO = [
    [("ring", "top: 10%; right: 5vw; width: 13vw"), ("tri", "top: 58%; right: 21vw; width: 4vw"), ("circle", "bottom: 10%; right: 7vw; width: 7vw")],
    [("circle", "top: 12%; right: 9vw; width: 9vw"), ("diamond", "top: 62%; right: 20vw; width: 3.2vw"), ("ring", "bottom: -7vw; right: 4vw; width: 13vw")],
    [("tri", "top: 14%; right: 6vw; width: 8vw"), ("ring", "top: 40%; right: 13vw; width: 9vw"), ("diamond", "bottom: 14%; right: 5vw; width: 4vw")],
]


def version(name):
    """A short content hash, so browsers fetch a file again only when it changes."""
    return hashlib.sha1((site / name).read_bytes()).hexdigest()[:8]


def load(slug):
    text = (src / f"{slug}.html").read_text()
    head = re.match(r"<!--\n(.*?)\n-->\n", text, re.S)
    essay = json.loads(head[1])
    essay["slug"] = slug
    essay["body"] = text[head.end():].strip()
    essay["day"] = date.fromisoformat(essay["date"])
    return essay


def long_date(day):
    return f"{day:%B} {day.day}, {day.year}"


def page(essay, index, essays, v):
    esc = lambda s: html.escape(s, quote=True)
    slug = essay["slug"]
    title = f'{essay["title"]} · {AUTHOR}'
    if slug == OVERVIEW:
        title = f"Runtime alignment and intentional agentic work · {AUTHOR}"
        kicker = "The series · Start here"
    else:
        kicker = f'<a href="{OVERVIEW}.html">Runtime alignment</a> · {essay["kicker"]}'
    deco = "\n".join(
        f'    <span class="deco {shape}" style="{place}; aspect-ratio: 1"></span>' for shape, place in DECO[index % len(DECO)]
    )
    prev_, next_ = (essays[index - 1] if index else None), (essays[index + 1] if index + 1 < len(essays) else None)
    turn = []
    if prev_:
        turn.append(f'    <a class="prev" href="{prev_["slug"]}.html"><span>Previous</span><b>{prev_["title"]}</b></a>')
    if next_:
        turn.append(f'    <a class="next" href="{next_["slug"]}.html"><span>Next</span><b>{next_["title"]}</b></a>')
    series_line = (
        "This is the start of a series on runtime alignment."
        if slug == OVERVIEW
        else f'Part of a series on <a href="{OVERVIEW}.html">runtime alignment</a>.'
    )
    return f"""<!doctype html>
<html lang="en" class="essay-page">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{esc(title)}</title>
  <meta name="description" content="{esc(essay["description"])}">
  <meta name="theme-color" content="#f1ecf7" media="(prefers-color-scheme: light)">
  <meta name="theme-color" content="#251e37" media="(prefers-color-scheme: dark)">
  <link rel="icon" href="../favicon.svg" type="image/svg+xml">
  <link rel="canonical" href="{URL}/writing/{slug}.html">
  <link rel="alternate" type="application/atom+xml" title="{AUTHOR}" href="../feed.xml">
  <meta property="og:type" content="article">
  <meta property="og:title" content="{esc(title)}">
  <meta property="og:description" content="{esc(essay["description"])}">
  <meta property="og:url" content="{URL}/writing/{slug}.html">
  <meta property="og:image" content="{URL}/og-image.png">
  <meta property="article:published_time" content="{essay["date"]}">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Unbounded:wght@400;600;800&family=Schibsted+Grotesk:ital,wght@0,400..800;1,400..600&display=swap">
  <link rel="stylesheet" href="../style.css?v={v["style.css"]}">
  <link rel="stylesheet" href="../essay.css?v={v["essay.css"]}">
  <script src="../theme.js?v={v["theme.js"]}"></script>
</head>
<body>
  <a class="skip" href="#post">Skip to content</a>
  <div class="progress" aria-hidden="true"></div>

  <header class="masthead">
    <a class="home" href="../" aria-label="{AUTHOR}, home">
      <span class="dot d1"></span><span class="dot d2"></span><span class="dot d3"></span><span class="mark-name">{AUTHOR}</span>
    </a>
    <nav aria-label="Site">
      <a href="../#writing">writing</a>
      <a href="../#about">about</a>
      <a href="../#contact">contact</a>
    </nav>
  </header>

  <header class="essay-hero{" tall" if essay.get("tall") else ""}">
{deco}
    <p class="kicker rise">{kicker}</p>
    <h1 class="title rise">{essay["title"]}</h1>
    <p class="dek rise">{essay["dek"]}</p>
    <p class="byline rise">{AUTHOR} · <time datetime="{essay["date"]}">{long_date(essay["day"])}</time> · {essay["examples"]}</p>
  </header>

  <main id="post">

{essay["body"]}

  </main>

  <nav class="series-nav" aria-label="More in this series">
{chr(10).join(turn)}
  </nav>

  <footer class="site-foot">
    <p>{series_line} If you're working through something similar, <a href="mailto:jwiesebron@pm.me">I'd like to hear about it</a>.</p>
    <p><a href="../#writing">All writing</a> · <a href="https://github.com/jwbron">GitHub</a> · <a href="https://www.linkedin.com/in/james-wiesebron/">LinkedIn</a> · <a href="../feed.xml">RSS</a></p>
  </footer>

  <script src="../vendor/gsap.min.js" defer></script>
  <script src="../vendor/ScrollTrigger.min.js" defer></script>
  <script src="../essay.js?v={v["essay.js"]}" defer></script>
</body>
</html>
"""


def home_list(essays):
    items = []
    for essay in essays:
        name = "Runtime alignment and intentional agentic work" if essay["slug"] == OVERVIEW else essay["title"]
        note = " Start here." if essay["slug"] == OVERVIEW else ""
        items.append(
            f'        <li>\n          <a href="writing/{essay["slug"]}.html">{name}</a>\n'
            f'          <p>{essay["dek"]}{note}</p>\n'
            f'          <time datetime="{essay["date"]}">{long_date(essay["day"])}</time>\n        </li>'
        )
    return "\n".join(items)


def feed(essays):
    newest = max(e["day"] for e in essays)
    entries = "".join(
        f"""  <entry>
    <title>{html.escape(e["title"])}</title>
    <link href="{URL}/writing/{e["slug"]}.html"/>
    <id>{URL}/writing/{e["slug"]}.html</id>
    <published>{e["date"]}T00:00:00Z</published>
    <updated>{e["date"]}T00:00:00Z</updated>
    <summary>{html.escape(e["description"])}</summary>
  </entry>
"""
        for e in sorted(essays, key=lambda e: e["day"], reverse=True)
    )
    return f"""<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>{AUTHOR}</title>
  <subtitle>Essays on runtime alignment: keeping AI agents doing what you intended while they run.</subtitle>
  <link href="{URL}/"/>
  <link rel="self" href="{URL}/feed.xml"/>
  <id>{URL}/</id>
  <updated>{newest.isoformat()}T00:00:00Z</updated>
  <author><name>{AUTHOR}</name></author>
{entries}</feed>
"""


def sitemap(essays):
    urls = [f"{URL}/"] + [f'{URL}/writing/{e["slug"]}.html' for e in essays]
    rows = "".join(f"  <url><loc>{u}</loc></url>\n" for u in urls)
    return f'<?xml version="1.0" encoding="utf-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{rows}</urlset>\n'


def main():
    essays = [load(slug) for slug in SERIES]
    v = {name: version(name) for name in ("style.css", "essay.css", "essay.js", "theme.js")}

    for i, essay in enumerate(essays):
        (site / "writing" / f'{essay["slug"]}.html').write_text(page(essay, i, essays, v))

    # The homepage is written by hand. Only its essay list and asset versions are filled in here.
    home = site / "index.html"
    text = home.read_text()
    start, end = "<!-- essays:start -->", "<!-- essays:end -->"
    a, b = text.index(start) + len(start), text.index(end)
    text = text[:a] + "\n" + home_list(essays) + "\n        " + text[b:]
    home.write_text(text)

    for path in (home, site / "river" / "index.html"):
        text = path.read_text()
        for name, digest in v.items():
            text = re.sub(rf"({re.escape(name)})\?v=[0-9a-f]+", rf"\1?v={digest}", text)
        path.write_text(text)

    (site / "feed.xml").write_text(feed(essays))
    (site / "sitemap.xml").write_text(sitemap(essays))
    print(f"built {len(essays)} essays, the homepage list, feed.xml and sitemap.xml")


if __name__ == "__main__":
    main()
