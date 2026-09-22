#!/bin/sh
# Managed by Domo AI Dev Kit — supplies the active endpoint token from the
# macOS Keychain so it never has to be stored in settings.json.
# Matched by service name only. Claude Code may run this helper from an exec
# environment with no logged-in account variable set (GUI/launchd-spawned
# shells); an account-scoped lookup would then silently return an empty
# token and auth would fail with a 401.
security find-generic-password -s "domo-ai-devkit-snowflake-pat" -w
