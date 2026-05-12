#!/bin/sh

set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
RUNTIME_DIR="$ROOT_DIR/.runtime"
PID_FILE="$RUNTIME_DIR/server.pid"
DISPLAY_PORT=${PORT:-}

resolve_port() {
  if [ -z "$DISPLAY_PORT" ] && [ -f "$ROOT_DIR/.env" ]; then
    DISPLAY_PORT=$(sed -n 's/^PORT=//p' "$ROOT_DIR/.env" | tail -n 1 | tr -d '"' | tr -d "'" | tr -d ' ')
  fi

  if [ -z "$DISPLAY_PORT" ]; then
    DISPLAY_PORT=3000
  fi
}

get_process_cwd() {
  pid="$1"
  lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -n 1
}

is_pid_listening_on_port() {
  pid="$1"
  port="$2"
  if ! command -v lsof >/dev/null 2>&1; then
    return 0
  fi
  lsof -a -p "$pid" -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1
}

is_project_server_pid() {
  pid="$1"
  if [ -z "$pid" ] || ! kill -0 "$pid" 2>/dev/null; then
    return 1
  fi

  command_line=$(ps -p "$pid" -o command= 2>/dev/null | sed 's/^[[:space:]]*//')
  case "$command_line" in
    *"node server.js"*) ;;
    *) return 1 ;;
  esac

  if command -v lsof >/dev/null 2>&1; then
    [ "$(get_process_cwd "$pid")" = "$ROOT_DIR" ]
    return
  fi

  return 0
}

find_project_server_pid() {
  if ! command -v lsof >/dev/null 2>&1; then
    return 1
  fi

  for pid in $(lsof -t -nP -iTCP:"$DISPLAY_PORT" -sTCP:LISTEN 2>/dev/null | sort -u); do
    if is_project_server_pid "$pid"; then
      echo "$pid"
      return 0
    fi
  done

  return 1
}

resolve_port

SERVER_PID=""

if [ -f "$PID_FILE" ]; then
  SERVER_PID=$(cat "$PID_FILE")
fi

if ! is_project_server_pid "$SERVER_PID" || ! is_pid_listening_on_port "$SERVER_PID" "$DISPLAY_PORT"; then
  SERVER_PID=$(find_project_server_pid || true)
fi

if [ -z "$SERVER_PID" ]; then
  rm -f "$PID_FILE"
  echo "未发现运行中的服务。"
  exit 0
fi

echo "正在停止服务，PID: $SERVER_PID"
kill "$SERVER_PID"

WAIT_COUNT=0
while kill -0 "$SERVER_PID" 2>/dev/null; do
  WAIT_COUNT=$((WAIT_COUNT + 1))
  if [ "$WAIT_COUNT" -ge 10 ]; then
    echo "服务未在预期时间内退出，执行强制停止。"
    kill -9 "$SERVER_PID" 2>/dev/null || true
    break
  fi
  sleep 1
done

rm -f "$PID_FILE"
echo "服务已停止。"