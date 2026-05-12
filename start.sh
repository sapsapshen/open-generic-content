#!/bin/sh

set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
RUNTIME_DIR="$ROOT_DIR/.runtime"
PID_FILE="$RUNTIME_DIR/server.pid"
PORT_FILE="$RUNTIME_DIR/server.port"
LOG_FILE="$RUNTIME_DIR/server.log"
DISPLAY_PORT=${PORT:-}
PORT_SOURCE=""

mkdir -p "$RUNTIME_DIR"

resolve_port() {
  if [ -n "$DISPLAY_PORT" ]; then
    PORT_SOURCE="env"
  fi

  if [ -z "$DISPLAY_PORT" ] && [ -f "$ROOT_DIR/.env" ]; then
    DISPLAY_PORT=$(sed -n 's/^PORT=//p' "$ROOT_DIR/.env" | tail -n 1 | tr -d '"' | tr -d "'" | tr -d ' ')
    if [ -n "$DISPLAY_PORT" ]; then
      PORT_SOURCE="dotenv"
    fi
  fi

  if [ -z "$DISPLAY_PORT" ] && [ -f "$PORT_FILE" ]; then
    DISPLAY_PORT=$(cat "$PORT_FILE" 2>/dev/null | tr -d ' ')
    if [ -n "$DISPLAY_PORT" ]; then
      PORT_SOURCE="portfile"
    fi
  fi

  if [ -z "$DISPLAY_PORT" ] && [ -f "$ROOT_DIR/.env.example" ]; then
    DISPLAY_PORT=$(sed -n 's/^PORT=//p' "$ROOT_DIR/.env.example" | tail -n 1 | tr -d '"' | tr -d "'" | tr -d ' ')
    if [ -n "$DISPLAY_PORT" ]; then
      PORT_SOURCE="example"
    fi
  fi

  if [ -z "$DISPLAY_PORT" ]; then
    DISPLAY_PORT=3000
    PORT_SOURCE="default"
  fi
}

is_port_in_use() {
  port="$1"
  if ! command -v lsof >/dev/null 2>&1; then
    return 1
  fi
  lsof -t -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1
}

select_available_port() {
  preferred_port="$1"

  for candidate in "$preferred_port" 3017 3001 3002 3003 3004 3005 3006 3007 3008 3009 3010 3011 3012 3013 3014 3015 3016 3018 3019 3020; do
    [ -n "$candidate" ] || continue
    if ! is_port_in_use "$candidate"; then
      DISPLAY_PORT="$candidate"
      return 0
    fi
  done

  return 1
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
      echo "$DISPLAY_PORT" > "$PORT_FILE"
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
    echo "$DISPLAY_PORT" > "$PORT_FILE"
    echo "检测到服务已在运行，已写回 PID: $ADOPTED_PID"
    echo "日志文件: $LOG_FILE"
    echo "访问地址: http://localhost:$DISPLAY_PORT"
    exit 0
  fi

  echo "检测到旧版服务实例，正在重启以加载当前配置。"
  terminate_pid "$ADOPTED_PID"
fi

if is_port_in_use "$DISPLAY_PORT"; then
  case "$PORT_SOURCE" in
    env|dotenv)
      print_port_conflict
      exit 1
      ;;
    *)
      ORIGINAL_PORT="$DISPLAY_PORT"
      if ! select_available_port "$DISPLAY_PORT"; then
        print_port_conflict
        exit 1
      fi
      if [ "$DISPLAY_PORT" != "$ORIGINAL_PORT" ]; then
        echo "端口 $ORIGINAL_PORT 已被占用，已自动切换到 $DISPLAY_PORT。"
      fi
      ;;
  esac
fi

cd "$ROOT_DIR"
PORT="$DISPLAY_PORT" nohup node server.js >> "$LOG_FILE" 2>&1 &
SERVER_PID=$!
echo "$SERVER_PID" > "$PID_FILE"

sleep 1

if kill -0 "$SERVER_PID" 2>/dev/null; then
  echo "$DISPLAY_PORT" > "$PORT_FILE"
  echo "服务已启动，PID: $SERVER_PID"
  echo "日志文件: $LOG_FILE"
  echo "访问地址: http://localhost:$DISPLAY_PORT"
  exit 0
fi

echo "服务启动失败，请检查日志: $LOG_FILE" >&2
tail -n 20 "$LOG_FILE" 2>/dev/null || true
rm -f "$PID_FILE"
exit 1