#!/usr/bin/env python3
"""
Reconstructs the {home, projects, experience} shape the old assets/i18n/en.json
used to provide — but reads it straight from the static English markup in
index.html / projects.html, which is the real (and only) source of truth for
English now. Nothing duplicates it in a JSON file; this is read once, here,
by the test/validation scripts that need an English baseline to compare other
locales against.
"""
import html
import os
import re
from html.parser import HTMLParser

STATIC_HTML_FILES = ["index.html", "projects.html"]

VOID_ELEMENTS = {
    "area", "base", "br", "col", "embed", "hr", "img", "input",
    "link", "meta", "param", "source", "track", "wbr",
}


def set_nested(obj, path, value):
    parts = path.split(".")
    node = obj
    for part in parts[:-1]:
        node = node.setdefault(part, {})
    node[parts[-1]] = value


def clean_text(value):
    return html.unescape(re.sub(r"\s+", " ", value)).strip()


class HomeI18nExtractor(HTMLParser):
    """
    Walks one HTML document, mirroring what script.js's updatePageText() /
    captureEnglishSourceFromDom() read at runtime: any element carrying
    data-i18n (innerHTML), data-i18n-placeholder (its placeholder attribute),
    or data-i18n-tooltip (its data-tooltip attribute), keyed by the dotted
    path in that attribute.
    """

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.home = {}
        self.stack = []
        self.captures = []

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        raw = self.get_starttag_text()
        for cap in self.captures:
            cap["buffer"].append(raw)

        if tag not in VOID_ELEMENTS:
            self.stack.append(tag)

        if "data-i18n-placeholder" in attrs_dict:
            set_nested(self.home, attrs_dict["data-i18n-placeholder"], attrs_dict.get("placeholder", ""))
        if "data-i18n-tooltip" in attrs_dict:
            set_nested(self.home, attrs_dict["data-i18n-tooltip"], attrs_dict.get("data-tooltip", ""))
        if "data-i18n" in attrs_dict and tag not in VOID_ELEMENTS:
            self.captures.append({"stack_len": len(self.stack), "path": attrs_dict["data-i18n"], "buffer": []})

    def handle_startendtag(self, tag, attrs):
        attrs_dict = dict(attrs)
        raw = self.get_starttag_text()
        for cap in self.captures:
            cap["buffer"].append(raw)
        if "data-i18n-placeholder" in attrs_dict:
            set_nested(self.home, attrs_dict["data-i18n-placeholder"], attrs_dict.get("placeholder", ""))
        if "data-i18n-tooltip" in attrs_dict:
            set_nested(self.home, attrs_dict["data-i18n-tooltip"], attrs_dict.get("data-tooltip", ""))

    def handle_endtag(self, tag):
        if self.stack and self.stack[-1] == tag:
            self.stack.pop()

        still_open = []
        closing = None
        for cap in self.captures:
            if cap["stack_len"] == len(self.stack) + 1:
                closing = cap
            else:
                cap["buffer"].append(f"</{tag}>")
                still_open.append(cap)
        self.captures = still_open

        if closing is not None:
            set_nested(self.home, closing["path"], clean_text("".join(closing["buffer"])))

    def handle_data(self, data):
        for cap in self.captures:
            cap["buffer"].append(data)


def extract_home(markup):
    parser = HomeI18nExtractor()
    parser.feed(markup)
    return parser.home


# A handful of strings are never marked up with data-i18n at all: script.js
# sets them imperatively (aria-label/data-tooltip on specific elements,
# looked up via getLocalizedText(path, fallback)), not via a generic
# attribute walk. Each entry here is a regex whose first captured group is
# the English text baked as that element's static attribute value.
STATIC_ONLY_PATTERNS = {
    "accessibility.navigation": r'id="site-navigation"[^>]*aria-label="([^"]+)"',
    "accessibility.theme_to_light": r'id="theme-toggle"[^>]*aria-label="([^"]+)"',
    "accessibility.open_menu": r'class="menu-toggle"[^>]*aria-label="([^"]+)"',
    "accessibility.scroll_to_projects": r'id="scroll-projects-link"[^>]*aria-label="([^"]+)"',
    "accessibility.download_cv": r'id="download-cv-link"[^>]*aria-label="([^"]+)"',
    "accessibility.all_projects": r'id="view-all-projects-link"[^>]*aria-label="([^"]+)"',
    "accessibility.contact_shortcut": r'id="hero-contact-link"[^>]*aria-label="([^"]+)"',
    "accessibility.open_github": r'data-social="github"[^>]*aria-label="([^"]+)"',
    "accessibility.open_linkedin": r'data-social="linkedin"[^>]*aria-label="([^"]+)"',
    "accessibility.open_x": r'data-social="x"[^>]*aria-label="([^"]+)"',
    "accessibility.open_instagram": r'data-social="instagram"[^>]*aria-label="([^"]+)"',
}

# The rest genuinely have no static form to read: they're only ever shown
# for a transient state (menu open, light theme, "view less" after
# expanding) or as a one-off announcement/status message, so there's nothing
# in the default-rendered HTML that could hold them. Their only remaining
# canonical English text is the fallback string literal passed to
# getLocalizedText(...) in script.js — same pattern any i18n setup uses for
# dynamic strings, not a duplicated data file. Structural checks should not
# flag other locales for having keys that simply can't appear in this
# baseline.
DYNAMIC_ONLY_KEYS = {
    "hero.cta",  # unused leftover key, not referenced by any markup or script.js call
    "accessibility.close_menu",
    "accessibility.theme_to_dark",
    "accessibility.language_to_english",
    "accessibility.language_to_spanish",
    "accessibility.opens_new_tab",
    "accessibility.theme_enabled_dark",
    "accessibility.theme_enabled_light",
    "accessibility.language_changed_english",
    "accessibility.language_changed_spanish",
    "accessibility.menu_expanded",
    "accessibility.menu_collapsed",
    "accessibility.skills_marquee",
    "skills_section.view_less",
    "skills_section.view_less_tooltip",
    "contact_section.success_msg",
    "contact_section.error_msg",
    "common.coming_soon_title",  # the "coming soon" empty state was removed once every project list had real entries
    "common.coming_soon",
}


# These carry an entity name after the label ("Open live project in a new
# tab: Banca Remota — Cuba") — take the fixed prefix before ": " from the
# first match, same idea as STATIC_ONLY_PATTERNS but needs splitting.
PREFIXED_STATIC_ONLY_PATTERNS = {
    "accessibility.view_live_project": r'class="project-btn project-btn--primary" aria-label="([^:]+): ',
    "accessibility.view_repository": r'class="project-btn project-btn--secondary" aria-label="([^:]+): ',
    "accessibility.technologies_used": r'class="project-tags" aria-label="([^:]+): ',
    "accessibility.view_company_site": r'class="timeline-link" aria-label="([^:]+): ',
}

SPAN_STATIC_ONLY_PATTERNS = {
    "common.view_project": r'class="project-btn project-btn--primary".*?class="project-btn-label">([^<]+)</span>',
    "common.repository": r'class="project-btn project-btn--secondary".*?class="project-btn-label">([^<]+)</span>',
}


def extract_static_only_home_strings(markup):
    home = {}
    for path, pattern in STATIC_ONLY_PATTERNS.items():
        match = re.search(pattern, markup)
        if match:
            set_nested(home, path, clean_text(match.group(1)))
    for path, pattern in PREFIXED_STATIC_ONLY_PATTERNS.items():
        match = re.search(pattern, markup)
        if match:
            set_nested(home, path, clean_text(match.group(1)))
    for path, pattern in SPAN_STATIC_ONLY_PATTERNS.items():
        match = re.search(pattern, markup, re.S)
        if match:
            set_nested(home, path, clean_text(match.group(1)))
    return home


def merge_home(a, b):
    for key, value in b.items():
        if isinstance(value, dict) and isinstance(a.get(key), dict):
            merge_home(a[key], value)
        else:
            a[key] = value
    return a


PROJECT_CARD_RE = re.compile(
    r'<article class="project-card" aria-labelledby="project-title-(\d+)"[^>]*>(.*?)</article>',
    re.S,
)
PROJECT_IMG_RE = re.compile(r'<img src="([^"]+)"[^>]*class="project-img"')
PROJECT_TITLE_RE = re.compile(r'<h3 class="project-title"[^>]*>(.*?)</h3>', re.S)
PROJECT_DESC_RE = re.compile(r'<p class="project-desc"[^>]*>(.*?)</p>', re.S)
PROJECT_TAG_RE = re.compile(r'<span class="tag">([^<]*)</span>')
PROJECT_LIVE_HREF_RE = re.compile(r'<a href="([^"]+)"[^>]*class="project-btn project-btn--primary"')
PROJECT_REPO_HREF_RE = re.compile(r'<a href="([^"]+)"[^>]*class="project-btn project-btn--secondary"')


def extract_projects(markup):
    projects = {}
    for match in PROJECT_CARD_RE.finditer(markup):
        proj_id = int(match.group(1))
        block = match.group(2)
        img = PROJECT_IMG_RE.search(block)
        title = PROJECT_TITLE_RE.search(block)
        desc = PROJECT_DESC_RE.search(block)
        live = PROJECT_LIVE_HREF_RE.search(block)
        repo = PROJECT_REPO_HREF_RE.search(block)
        projects[proj_id] = {
            "id": proj_id,
            "title": clean_text(title.group(1)) if title else "",
            "description": clean_text(desc.group(1)) if desc else "",
            "image": img.group(1) if img else "",
            "tags": [clean_text(t) for t in PROJECT_TAG_RE.findall(block)],
            "githubUrl": repo.group(1) if repo else "",
            "liveUrl": live.group(1) if live else "",
        }
    return projects


TIMELINE_ITEM_RE = re.compile(
    r'<article class="timeline-item" aria-labelledby="timeline-title-(\d+)"[^>]*>(.*?)</article>',
    re.S,
)
TIMELINE_DATE_RE = re.compile(r'<div class="timeline-date">([^<]*)</div>')
TIMELINE_LOGO_RE = re.compile(r'<div class="(timeline-logo-frame[^"]*)"[^>]*>\s*<img src="([^"]+)"')
TIMELINE_TITLE_RE = re.compile(r'<h3 id="timeline-title-\d+">(.*?)</h3>', re.S)
TIMELINE_DESC_RE = re.compile(r'<p id="timeline-desc-\d+">(.*?)</p>', re.S)
TIMELINE_LINK_RE = re.compile(
    r'<a href="([^"]+)"[^>]*class="timeline-link"[^>]*>.*?<span>([^<]*)</span>\s*</a>',
    re.S,
)


def extract_experience(markup):
    experience = []
    for match in TIMELINE_ITEM_RE.finditer(markup):
        block = match.group(2)
        date = TIMELINE_DATE_RE.search(block)
        logo = TIMELINE_LOGO_RE.search(block)
        title = TIMELINE_TITLE_RE.search(block)
        desc = TIMELINE_DESC_RE.search(block)
        logo_classes = logo.group(1).split() if logo else []
        entry = {
            "date": clean_text(date.group(1)) if date else "",
            "title": clean_text(title.group(1)) if title else "",
            "desc": clean_text(desc.group(1)) if desc else "",
            "logo": logo.group(2) if logo else "",
        }
        # Match the original i18n JSON convention: these keys are present
        # only when true, not written as explicit false.
        if "is-wide" in logo_classes:
            entry["logoWide"] = True
        if "is-dark" in logo_classes:
            entry["logoDark"] = True
        if "is-light" in logo_classes:
            entry["logoLight"] = True
        entry["links"] = [
            {"url": url, "label": clean_text(label)}
            for url, label in TIMELINE_LINK_RE.findall(block)
        ]
        experience.append(entry)
    return experience


def build_baseline_from_html(root_dir):
    """Returns the {home, projects, experience} baseline, read live from the
    static English HTML in index.html/projects.html (root_dir-relative).

    Project order matters: the other locale JSON files' 'projects' arrays are
    still in the original array order, and test_structure.py compares arrays
    positionally — so this must preserve that same order, not re-sort by id.
    projects.html always lists every project (index.html only the featured
    subset), so projects.html is the canonical order; index.html is used
    only to determine which ids are featured.
    """
    wrapped_home = {}
    markups = {}
    for f_name in STATIC_HTML_FILES:
        with open(os.path.join(root_dir, f_name), "r", encoding="utf-8") as f:
            markups[f_name] = f.read()
        merge_home(wrapped_home, extract_home(markups[f_name]))
    # Every data-i18n path starts with "home." (e.g. "home.nav.projects"), so
    # extract_home() naturally builds {"home": {...}} already — unwrap it.
    home = wrapped_home.get("home", {})
    for f_name in STATIC_HTML_FILES:
        merge_home(home, extract_static_only_home_strings(markups[f_name]))

    featured_ids = set(extract_projects(markups["index.html"]).keys())

    projects = []
    for proj_id, proj in extract_projects(markups["projects.html"]).items():
        proj = dict(proj)
        proj["featured"] = proj_id in featured_ids
        projects.append(proj)

    experience = extract_experience(markups["index.html"])

    return {"home": home, "projects": projects, "experience": experience}
