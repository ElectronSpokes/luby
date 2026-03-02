# Architecture Decisions

Key decisions that shaped HALINOVA's architecture.

## Core Architecture

- **Hybrid architecture** (2026-01-22): Native systemd services (nova-api, nova-worker, hali-agent, matrix-bot) + Docker infrastructure (DBs, Redis, Vault, StackStorm) - enables faster dev iteration with --reload and easier debugging

- **HALI agent in host network mode** (2026-01-19): Required for SNMP/LLDP discovery - can't use Docker bridge network

- **NOVA Orchestrator as AI-native trust gate** (2026-01-19): StackStorm becomes one execution backend, not central automation

## Execution Backends

- **Ansible as first-class backend** (2026-01-20): Alongside StackStorm - use for bulk operations, legacy devices, playbook-based automation

- **GEMS runs BEFORE Trust Gate** (2026-01-24): Provides risk data for policy decisions, not after

- **Hybrid risk assessment** (2026-01-24): Rule-based core + optional AI enhancement - AI is additive, not required

## Data & Credentials

- **Vault as source of truth** (2026-01-22): All provider credentials fetched via ProviderFactory when VAULT_TOKEN is set

- **Centralized Vault** (2026-01-22): On VLAN 25 (10.0.25.2), serves all products (HALINOVA, FAWB, DaChief) with path-based isolation

- **NetBox as inventory source of truth** (2026-01-23): Sync VLANs/Prefixes from OPNsense, VMs from Proxmox, IPs from OPNsense ARP/DHCP

## Infrastructure

- **VM provisioning via templates** (2026-01-26): Clone from template ensures working cloud-init, network, SSH - no scratch builds

- **Config-driven Springboard** (2026-01-28): Each satellite defines monitoring in YAML, same code works across all satellites

- **Cached ProviderFactory singleton** (2026-01-28): Reuse for 5 minutes to prevent API session exhaustion (Pi-hole 429 errors)

## Ecosystem Graph

- **Explicit edges for visualization** (2026-01-29): parent_id field alone doesn't render connections in vis-network; must create edge records with `relation: depends_on`
