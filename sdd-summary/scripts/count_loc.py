#!/usr/bin/env python3
"""Count AI vs human code lines from git history.

A commit counts as AI-developed if its message matches the agent marker
(default: a `Co-Authored-By: Agent` trailer). Otherwise it is human code.
Lines = insertions from `git log --no-merges --numstat` over the given range.

Usage:
  python count_loc.py [--repo PATH] [--start SHA] [--agent-regex REGEX] [--out FILE]

Output (JSON to stdout, or --out file):
  {"ai_loc": int, "human_loc": int, "total": int,
   "ai_commits": int, "human_commits": int, "range": str}
"""
import argparse
import json
import re
import subprocess
import sys

DEFAULT_AGENT_REGEX = r"Co-Authored-By:\s*Agent"

NUMSTAT_RE = re.compile(r"^(\d+|-)\t(\d+|-)\t")


def run_git(args, repo):
    result = subprocess.run(
        ["git", "-C", repo] + args,
        capture_output=True,
        encoding="utf-8",
        errors="replace",
        check=True,
    )
    return result.stdout


def parse_log(stdout):
    """Yield (is_ai, insertions) per commit from `git log --numstat` output."""
    # Record separator: \x1e marks the start of each commit's formatted block.
    for chunk in stdout.split("\x1e"):
        chunk = chunk.strip("\n")
        if not chunk:
            continue
        # hash \x1f body \n numstat-lines...
        if "\x1f" in chunk:
            _hash, rest = chunk.split("\x1f", 1)
        else:
            rest = chunk
        lines = rest.split("\n")
        # body = lines until the first numstat line; numstat = the rest
        body_end = 0
        for i, ln in enumerate(lines):
            if NUMSTAT_RE.match(ln):
                body_end = i
                break
        else:
            body_end = len(lines)
        body = "\n".join(lines[:body_end])
        numstat = lines[body_end:]

        is_ai = bool(_AGENT_RE.search(body)) if _AGENT_RE else False
        ins = 0
        for ln in numstat:
            m = NUMSTAT_RE.match(ln)
            if not m:
                continue
            added = m.group(1)
            if added.isdigit():
                ins += int(added)
        yield is_ai, ins


def main():
    global _AGENT_RE
    ap = argparse.ArgumentParser(description="Count AI vs human code lines from git.")
    ap.add_argument("--repo", default=".", help="git repo path (default cwd)")
    ap.add_argument("--start", default=None, help="start SHA; range becomes <start>..HEAD")
    ap.add_argument(
        "--agent-regex",
        default=DEFAULT_AGENT_REGEX,
        help=f"regex marking an AI commit (default: '{DEFAULT_AGENT_REGEX}')",
    )
    ap.add_argument("--out", default=None, help="write JSON to this file (UTF-8)")
    args = ap.parse_args()

    _AGENT_RE = re.compile(args.agent_regex, re.IGNORECASE)

    rng = f"{args.start}..HEAD" if args.start else "HEAD"
    fmt = "\x1e%H\x1f%B"
    out = run_git(["log", "--no-merges", "--numstat", f"--format={fmt}", rng], args.repo)

    ai_loc = human_loc = 0
    ai_commits = human_commits = 0
    for is_ai, ins in parse_log(out):
        if is_ai:
            ai_loc += ins
            ai_commits += 1
        else:
            human_loc += ins
            human_commits += 1

    result = {
        "ai_loc": ai_loc,
        "human_loc": human_loc,
        "total": ai_loc + human_loc,
        "ai_commits": ai_commits,
        "human_commits": human_commits,
        "range": rng,
    }
    text = json.dumps(result, ensure_ascii=False, indent=2)
    if args.out:
        with open(args.out, "w", encoding="utf-8") as f:
            f.write(text + "\n")
    else:
        sys.stdout.reconfigure(encoding="utf-8")
        print(text)


if __name__ == "__main__":
    main()
