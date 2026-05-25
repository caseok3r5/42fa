#!/usr/bin/env bash
set -euo pipefail

REPO_URL="https://github.com/caseok3r5/42fa.git"

cd "$(dirname "$0")/.."

printf "GitHub username [caseok3r5]: "
read -r GITHUB_USER
GITHUB_USER="${GITHUB_USER:-caseok3r5}"

printf "Paste GitHub token for %s: " "$GITHUB_USER"
read -rs GITHUB_TOKEN
printf "\n"

ASKPASS_FILE="$(mktemp)"
trap 'rm -f "$ASKPASS_FILE"; unset GITHUB_TOKEN GITHUB_USER' EXIT

cat > "$ASKPASS_FILE" <<'EOF'
#!/usr/bin/env bash
case "$1" in
  *Username*) printf "%s" "$GITHUB_USER" ;;
  *Password*) printf "%s" "$GITHUB_TOKEN" ;;
  *) printf "%s" "$GITHUB_TOKEN" ;;
esac
EOF
chmod 700 "$ASKPASS_FILE"

git remote set-url origin "$REPO_URL"
GIT_TERMINAL_PROMPT=0 GIT_ASKPASS="$ASKPASS_FILE" git push -u origin main
