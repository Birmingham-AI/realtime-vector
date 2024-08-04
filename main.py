import os
import subprocess
from pathlib import Path
from datetime import datetime

import psycopg
from dotenv import load_dotenv

load_dotenv()
DB_URL = os.environ["DB_URL"]
GIT_REPO = os.environ["GIT_REPO"]
WORK_PATH = os.environ["WORK_PATH"]


def git_log() -> list[str]:
    if not Path(WORK_PATH).exists():
        subprocess.run(f"git clone {GIT_REPO} {WORK_PATH}", shell=True, check=True, env=os.environ)
    proc = subprocess.run("git --no-pager log --date=iso-strict --format=medium", cwd=WORK_PATH,
                          shell=True, check=True, env=os.environ, text=True, capture_output=True)
    lines = []
    for line in proc.stdout.splitlines(keepends=True):
        lines.append(line)
    return lines


def find_commit_boundaries(lines: list[str]) -> list[dict[str, any]]:
    commits = []
    for i, line in enumerate(lines):
        if line.startswith("commit"):
            commits.append({"start": i, "commit": line[len("commit "):].strip()})
    for i, commit in enumerate(commits):
        commit["end"] = commits[i+1]["start"] if i+1 < len(commits) else len(lines)
    return commits


def parse_commits(lines: list[str], commits: list[dict[str,any]]) -> list[dict[str, any]]:
    for commit in commits:
        author = lines[commit["start"]+1]
        assert author.startswith("Author: ")
        author = author[len("Author: "):].strip()
        commit["author"] = author
        date = lines[commit["start"]+2]
        assert date.startswith("Date: ")
        date = datetime.fromisoformat(date[len("Date: "):].strip())
        commit["date"] = date
        body = []
        for line in lines[commit["start"]+3:commit["end"]]:
            body.append(line.lstrip())
        commit["body"] = "".join(body).strip()
    return commits


def create_table() -> None:
    with psycopg.connect(DB_URL) as con:
        with con.cursor() as cur:
            cur.execute('''drop table if exists public."commit"''')
            cur.execute('''
                create table public."commit" 
                ( "commit" text not null primary key
                , author text not null
                , "date" timestamptz not null
                , body text not null
                )
                ''')


def load_commits(commits: list[dict[str, str]]) -> None:
    with psycopg.connect(DB_URL) as con:
        with con.cursor(binary=True) as cur:
            with cur.copy('copy public."commit" ("commit", author, "date", body) from stdin (format binary)') as cpy:
                cpy.set_types(['text', 'text', 'timestamptz', 'text'])
                for commit in commits:
                    cpy.write_row((commit["commit"], commit["author"], commit["date"], commit["body"]))


if __name__ == '__main__':
    lines = git_log()
    commits = find_commit_boundaries(lines)
    commits = parse_commits(lines, commits)
    create_table()
    load_commits(commits)
    print("done")
