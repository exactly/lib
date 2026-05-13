#!/usr/bin/env bash
set -eo pipefail

pnpm changeset version
git commit --all --amend --no-edit
