# New Munro

Create a new satellite project connected to the Northernlights Hub, registered in the ecosystem, and visible on the fleet page.

## Munro Naming

Scottish Munros (mountains over 3,000ft) - pick one that isn't taken:

**Popular choices:**
- ben-nevis (1,345m) - highest in UK
- ben-macdui (1,309m) - second highest
- braeriach (1,296m) - third highest
- cairn-toul (1,291m) - fourth highest
- ben-lawers (1,214m) - tenth highest
- ben-vorlich (943m) - taken
- schiehallion (1,083m) - the "fairy hill"
- buachaille-etive-mor (1,022m) - the shepherd
- liathach (1,055m) - the grey one
- an-teallach (1,062m) - the forge

Full list: https://en.wikipedia.org/wiki/List_of_Munros

## Instructions

### 1. Choose a Munro Name

Ask the user:
- "What should this satellite be called? (Pick a munro name like `schiehallion` or `cairn-toul`)"

### 2. Gather Details

Also ask:
- "What's the purpose of this project?"
- "What stack? (e.g., typescript, rust, python)"

### 3. Detect Host IP

```bash
# Get the current host's IP on VLAN 110
HOST_IP=$(hostname -I | awk '{print $1}')
echo "Host IP: $HOST_IP"
```

### 4. Create Project Directory

```bash
sudo mkdir -p /opt/<munro-name>
sudo chown $USER:$USER /opt/<munro-name>
```

### 5. Clone and Reset

```bash
git clone http://git.theflux.life:3000/hudson/northernlights.git /opt/<munro-name>
cd /opt/<munro-name>
rm -rf .git
git init
git branch -m main
```

### 6. Customize CLAUDE.md

Update `.claude/CLAUDE.md`:
- Change title to `# CLAUDE.md - <Munro Name>`
- Update project overview to describe the satellite's purpose
- Update repository path

### 7. Customize README.md

Update `README.md`:
- Change title to `# <Munro Name>`
- Add munro description and Wikipedia link
- Update quick start paths

### 8. Register with Hub

```bash
curl -X POST \
  -H "X-Hub-Key: $HUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "<munro-name>",
    "description": "<project description>",
    "stack_tags": ["<stack>"],
    "domain_tags": ["<domain>"]
  }' \
  http://northernlights-hub.theflux.life:3100/api/projects
```

Save the returned project ID in README.md and CLAUDE.md.

### 9. Register Ecosystem Node

Register in the ecosystem graph so the satellite appears on the fleet page.

```bash
# Get Hub API key
source /opt/halinova/config-env/nova.env 2>/dev/null || true

# Register ecosystem node
curl -X POST \
  -H "X-Hub-Key: $HUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "<munro-name>",
    "node_type": "satellite",
    "display_name": "<Munro Display Name>",
    "location": "<HOST_IP>",
    "status": "healthy",
    "project_tags": ["<domain-tags>"],
    "metadata": {
      "hub_project_id": "<project-id>",
      "purpose": "<purpose>"
    }
  }' \
  http://northernlights-hub.theflux.life:3100/api/v1/ecosystem/nodes

# Create edges
curl -X POST \
  -H "X-Hub-Key: $HUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"from_node": "<munro-name>", "to_node": "hub", "relation": "depends_on"}' \
  http://northernlights-hub.theflux.life:3100/api/v1/ecosystem/edges
```

### 10. Deploy Springboard Service

Deploy the springboard health monitor so the satellite is visible on the fleet page.

```bash
SPRINGBOARD_DIR="/opt/springboard"

# Create directory if needed
sudo mkdir -p "$SPRINGBOARD_DIR"
sudo chown $USER:$USER "$SPRINGBOARD_DIR"

# Check if already running
if systemctl is-active --quiet springboard 2>/dev/null; then
    echo "Springboard already running, updating config only"
else
    # Create venv and install deps
    python3 -m venv "$SPRINGBOARD_DIR/venv"
    "$SPRINGBOARD_DIR/venv/bin/pip" install --quiet fastapi uvicorn pyyaml httpx pydantic

    # Copy main.py from HALINOVA (if running locally) or from project
    # If on remote satellite, scp from HALINOVA first
    if [ -f /opt/halinova/springboard-service/main.py ]; then
        cp /opt/halinova/springboard-service/main.py "$SPRINGBOARD_DIR/"
    fi

    # Install systemd service
    sudo tee /etc/systemd/system/springboard.service > /dev/null << 'UNIT'
[Unit]
Description=Springboard Health Monitor
After=network.target

[Service]
Type=simple
User=johnthomson
WorkingDirectory=/opt/springboard
ExecStart=/opt/springboard/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8880
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
UNIT
    sudo systemctl daemon-reload
    sudo systemctl enable springboard
fi
```

Write the springboard.yaml config:
```yaml
# /opt/springboard/springboard.yaml
satellite:
  name: <munro-name>
  display_name: <Munro Display Name>
  location: "<HOST_IP>"
  role: "compute"
  project_tags:
    - <domain-tags>

services: []

endpoints:
  - name: SSH
    url: tcp://localhost:22
    type: tcp

containers:
  enabled: true
```

Start (or restart) the service:
```bash
sudo systemctl restart springboard
sleep 2
curl -sf http://localhost:8880/health | python3 -m json.tool
```

### 11. Initial Commit

```bash
git add .
git commit -m "init: <munro-name> satellite project

Connected to Northernlights Hub.
Project ID: <hub-project-id>

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

### 12. Create Remote & Push

Tell the user:
"Create the repo at http://git.theflux.life:3000/repo/create with name `<munro-name>`, then I'll push."

```bash
git remote add origin http://git.theflux.life:3000/hudson/<munro-name>.git
git push -u origin main
```

### 13. Verify

```bash
# Verify springboard responds
curl -sf http://localhost:8880/health | python3 -m json.tool

# Verify ecosystem node exists
curl -sf -H "X-Hub-Key: $HUB_API_KEY" \
  http://northernlights-hub.theflux.life:3100/api/v1/ecosystem/nodes/<munro-name> | python3 -m json.tool
```

## Output

After creation, report:
```
MUNRO CREATED
=============
Name: <munro-name>
Location: /opt/<munro-name>
Hub ID: <project-id>
Remote: http://git.theflux.life:3000/hudson/<munro-name>.git

Stack: <stack-tags>
Domain: <domain-tags>

Ecosystem: ✓ Node registered (<HOST_IP>)
Springboard: ✓ Running (port 8880)
Fleet Page: ✓ Will appear on dashboard

Hub sync: ✓ <N> learnings available

Ready to climb!
```

## Example

```
User: /new-munro

Claude: What should this satellite be called? (Pick a munro name)

User: schiehallion

Claude: What's the purpose of this project?

User: Audio processing experiments

Claude: What stack? (e.g., typescript, rust, python)

User: rust

Claude: [Creates project, registers with hub, registers ecosystem node, deploys springboard]

MUNRO CREATED
=============
Name: schiehallion
Location: /opt/schiehallion
Hub ID: abc123...
Remote: http://git.theflux.life:3000/hudson/schiehallion.git

Stack: rust
Domain: audio, experiments

Ecosystem: ✓ Node registered (10.0.110.25)
Springboard: ✓ Running (port 8880)
Fleet Page: ✓ Will appear on dashboard

Hub sync: ✓ 18 learnings available

Ready to climb!
```
