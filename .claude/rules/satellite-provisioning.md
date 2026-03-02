# Satellite Provisioning Guide

Standard process for deploying new satellites in the Northernlights network.

## Prerequisites

- Proxmox template with Ubuntu 24.04 + cloud-init (template 9001)
- Hub API key from northernlights-hub
- SSH key configured in template

## Minimum Specs

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| RAM | 2GB | 4GB |
| CPU | 2 cores | 4 cores |
| Disk | 20GB | 50GB |

**Note:** 512MB RAM causes Claude Code crashes - minimum 2GB required.

## Step-by-Step Process

### 1. Provision VM via Proxmox

```bash
# Clone from template (DON'T start yet)
# VMID: next available > 132 (9000+ reserved for templates)
# VLAN: 110 for compute, 25 for infra

# Steps:
# 1. Clone template 9001
# 2. Set VLAN tag on net0
# 3. Configure cloud-init: ipconfig0=ip=10.0.X.Y/24,gw=10.0.X.1
# 4. Regenerate cloud-init image (PUT /cloudinit)
# 5. Start VM
```

### 2. Base Setup

```bash
ssh johnthomson@<IP>

# Docker
sudo apt update && sudo apt install -y docker.io
sudo usermod -aG docker $USER
newgrp docker

# docker-compose (Ubuntu docker.io doesn't include it)
sudo curl -SL https://github.com/docker/compose/releases/download/v2.24.5/docker-compose-linux-x86_64 -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Bun
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
```

### 3. Install Claude Code

```bash
npm install -g @anthropic-ai/claude-code
claude  # Interactive login
```

### 4. Clone Project Repos

```bash
sudo mkdir -p /opt/<satellite-name>
sudo chown $USER:$USER /opt/<satellite-name>
cd /opt/<satellite-name>
git clone <repo-url>
```

### 5. Create Springboard Config

```bash
mkdir -p /opt/<satellite-name>/config
cat > /opt/<satellite-name>/config/springboard.yaml << 'EOF'
satellite:
  name: <satellite-name>
  display_name: <Display Name>

services: []

endpoints:
  - name: PostgreSQL
    url: tcp://localhost:5432
    type: tcp

providers: []

containers:
  enabled: true
EOF
```

### 6. Register with Hub

```bash
# On Hub host (northernlights-hub)
cd /opt/northernlights-hub
bun run src/cli.ts projects add

# Note the project_id returned
```

### 7. Setup MCP Server

```bash
mkdir -p /opt/<satellite-name>/.northernlights
cp -r /opt/halinova/.northernlights/mcp /opt/<satellite-name>/.northernlights/

cd /opt/<satellite-name>/.northernlights/mcp
bun install

# MUST use this command (not manual .mcp.json)
claude mcp add-json northernlights-hub '{
  "command": "/home/johnthomson/.bun/bin/bun",
  "args": ["run", "/opt/<satellite-name>/.northernlights/mcp/src/index.ts"],
  "env": {
    "HUB_API_URL": "http://northernlights-hub.theflux.life:3100",
    "HUB_API_KEY": "<hub-api-key>",
    "CURRENT_PROJECT_ID": "<project-id>"
  }
}' --scope user
```

### 8. Verify

```bash
claude
/mcp  # Check tools available
# Test: hub_awaken or hub_search
```

## Current Satellites

| Name | VMID | IP | VLAN | Hub Project ID |
|------|------|-----|------|----------------|
| HALINOVA | 116 | 10.0.110.16 | 110 | 052b00dc-... |
| satellite-test | 133 | 10.0.110.4 | 110 | 05ab5d9a-... |

## Key Learnings

- **MCP Setup**: Use `claude mcp add-json --scope user`, not manual files
- **Hub Registration**: Use Hub CLI (`projects add`), not raw API
- **Cloud-init**: Only change what's different from template
- **VM sequence**: Configure BEFORE first boot, regenerate cloud-init image
