default:
    @just --list

# Run the tests (node:test, no dependencies).
test:
    npm test

# Serve the demo page at http://localhost:8642.
demo:
    npm run demo

# Release: bump package.json's version (patch, minor or major; an X.Y.Z-SNAPSHOT releases as
# X.Y.Z), point the README's install line at it, commit, tag vX.Y.Z, and push main and the tag
# together. Front ends move to it with their own update (ui-pudl: just update-masthead).
release level="patch":
    #!/usr/bin/env bash
    set -euo pipefail
    level="{{level}}"
    files=(package.json README.md)
    case "$level" in
      patch|minor|major) ;;
      *) echo "release level must be one of: patch, minor, major" >&2; exit 1 ;;
    esac

    if [[ "$(git branch --show-current)" != "main" ]]; then
      echo "Release from main." >&2
      exit 1
    fi
    if [[ -n "$(git status --porcelain)" ]]; then
      echo "The working tree has uncommitted changes (a failed release?). Commit or restore them first." >&2
      exit 1
    fi
    git fetch -q --tags origin
    if [[ -n "$(git rev-list HEAD..origin/main)" ]]; then
      echo "main is behind origin/main. Pull first." >&2
      exit 1
    fi

    current="$(node -p "require('./package.json').version")"
    if [[ "$current" == *-SNAPSHOT ]]; then
      next="${current%-SNAPSHOT}"
    else
      IFS=. read -r major minor patch <<<"$current"
      if [[ -z "${major:-}" || -z "${minor:-}" || -z "${patch:-}" ]]; then
        printf 'current version is not semantic: <%s>\n' "$current" >&2
        exit 1
      fi
      case "$level" in
        patch) next="${major}.${minor}.$((patch + 1))" ;;
        minor) next="${major}.$((minor + 1)).0" ;;
        major) next="$((major + 1)).0.0" ;;
      esac
    fi
    if git rev-parse -q --verify "refs/tags/v$next" >/dev/null; then
      echo "v$next is already tagged." >&2
      exit 1
    fi

    npm test >/dev/null

    echo "Releasing $current -> $next"
    trap 'status=$?; if [[ $status -ne 0 && -z "${committed:-}" ]]; then git checkout -- "${files[@]}"; echo "Release failed; package.json restored to $current." >&2; fi' EXIT
    npm version "$next" --no-git-tag-version >/dev/null
    perl -0pi -e 's#(github:streampack-dev/masthead\#v)[0-9]+\.[0-9]+\.[0-9]+#${1}'"$next"'#g' README.md
    git commit -q -m "updating release version" -- "${files[@]}"
    committed=1
    git tag -a "v$next" -m "masthead $next"
    if ! git push -q --atomic origin main "v$next"; then
      echo "Push failed; main has the release commit and v$next locally. Push both with: git push --atomic origin main v$next" >&2
      exit 1
    fi
    echo "Released $next: pushed main and v$next."
