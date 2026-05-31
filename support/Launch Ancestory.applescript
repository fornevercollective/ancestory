-- Source for ../Launch Ancestory.app — double-click the .app in the project root to run.
-- Rebuild from repo root: osacompile -o "Launch Ancestory.app" "support/Launch Ancestory.applescript"

on run
tell application "Finder"
set projectFolder to container of (path to me as alias) as alias
set projectPath to POSIX path of projectFolder
end tell
set cmd to "cd " & quoted form of projectPath & " && exec ./start.sh"
tell application "Terminal"
activate
do script cmd
end tell
end run
