#!/bin/sh

set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
RUNTIME_DIR="$ROOT_DIR/.runtime"
PID_FILE="$RUNTIME_DIR/server.pid"
LOG_FILE="$RUNTIME_DIR/server.log"
DISPLAY_PORT=${PORT:-}

mkdir -p "$RUNTIME_DIR"

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

read_health_payload() {
  curl -fsS --max-time 2 "http://localhost:$DISPLAY_PORT/api/health" 2>/dev/null || true
}

is_legacy_health_payload() {
  printf "%s" "$1" | node -e 'let raw=""; process.stdin.on("data", (chunk) => raw += chunk); process.stdin.on("end", () => { try { const payload = JSON.parse(raw); const legacy = !payload.textProvider || !payload.imageProvider || /OPENAI_API_KEY/.test(String(payload.message || "")); process.exit(legacy ? 0 : 1); } catch { process.exit(0); } });'
}

terminate_pid() {
  pid="$1"
  if [ -z "$pid" ] || ! kill -0 "$pid" 2>/dev/null; then
    return 0
  fi

  kill "$pid" 2>/dev/null || true
  wait_count=0
  while kill -0 "$pid" 2>/dev/null; do
    wait_count=$((wait_count + 1))
    if [ "$wait_count" -ge 10 ]; then
      kill -9 "$pid" 2>/dev/null || true
      break
    fi
    sleep 1
  done
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

print_port_conflict() {
  echo "端口 $DISPLAY_PORT 已被其他进程占用，请先释放该端口或改用其他 PORT。" >&2
  if command -v lsof >/dev/null 2>&1; then
    lsof -nP -iTCP:"$DISPLAY_PORT" -sTCP:LISTEN 2>/dev/null >&2 || true
  fi
}

resolve_port

if ! command -v node >/dev/null 2>&1; then
  echo "未找到 node，请先安装 Node.js。" >&2
  exit 1
fi

if [ -f "$PID_FILE" ]; then
  EXISTING_PID=$(cat "$PID_FILE")
  if is_project_server_pid "$EXISTING_PID" && is_pid_listening_on_port "$EXISTING_PID" "$DISPLAY_PORT"; then
    HEALTH_PAYLOAD=$(read_health_payload)
    if [ -n "$HEALTH_PAYLOAD" ] && ! is_legacy_health_payload "$HEALTH_PAYLOAD"; then
      echo "服务已在运行，PID: $EXISTING_PID"
      echo "日志文件: $LOG_FILE"
      echo "访问地址: http://localhost:$DISPLAY_PORT"
      exit 0
    fi

    echo "检测到旧版服务实例，正在重启以加载当前配置。"
    terminate_pid "$EXISTING_PID"
  fi
  rm -f "$PID_FILE"
fi

ADOPTED_PID=$(find_project_server_pid || true)
if [ -n "$ADOPTED_PID" ]; then
  HEALTH_PAYLOAD=$(read_health_payload)
  if [ -n "$HEALTH_PAYLOAD" ] && ! is_legacy_health_payload "$HEALTH_PAYLOAD"; then
    echo "$ADOPTED_PID" > "$PID_FILE"
    echo "检测到服务已在运行，已写回 PID: $ADOPTED_PID"
    echo "日志文件: $LOG_FILE"
    echo "访问地址: http://localhost:$DISPLAY_PORT"
    exit 0
  fi

  echo "检测到旧版服务实例，正在重启以加载当前配置。"
  terminate_pid "$ADOPTED_PID"
fi

if command -v lsof >/dev/null 2>&1 && lsof -t -nP -iTCP:"$DISPLAY_PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  print_port_conflict
  exit 1
fi

cd "$ROOT_DIR"
nohup node server.js >> "$LOG_FILE" 2>&1 &
SERVER_PID=$!
echo "$SERVER_PID" > "$PID_FILE"

sleep 1

if kill -0 "$SERVER_PID" 2>/dev/null; then
  echo "服务已启动，PID: $SERVER_PID"
  echo "日志文件: $LOG_FILE"
  echo "访问地址: http://localhost:$DISPLAY_PORT"
  exit 0
fi

echo "服务启动失败，请检查日志: $LOG_FILE" >&2
tail -n 20 "$LOG_FILE" 2>/dev/null || true
rm -f "$PID_FILE"
exit 1