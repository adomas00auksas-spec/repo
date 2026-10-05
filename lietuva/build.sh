#!/bin/sh
# Concatenates src/ into the single playable file index.html.
cd "$(dirname "$0")" && cat src/00-shell.html src/*.js > index.html && echo "built index.html ($(wc -c < index.html) bytes)"
