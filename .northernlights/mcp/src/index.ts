/**
 * Northernlights MCP Server
 *
 * Exposes hub functionality to Claude Code via Model Context Protocol.
 * Uses stdio transport for communication.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

// Configuration
const HUB_API_URL = process.env.HUB_API_URL || 'http://localhost:3100';
const HUB_API_KEY = process.env.HUB_API_KEY || '';
const CURRENT_PROJECT_ID = process.env.CURRENT_PROJECT_ID;

// ============================================
// HUB API CLIENT
// ============================================

interface ApiResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: { code: string; message: string };
}

async function callHubApi<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${HUB_API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-Hub-Key': HUB_API_KEY,
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        ok: false,
        error: data.error || { code: 'API_ERROR', message: `HTTP ${response.status}` },
      };
    }

    return { ok: true, data: data as T };
  } catch (error) {
    return {
      ok: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

// ============================================
// TOOL DEFINITIONS
// ============================================

const TOOLS = [
  {
    name: 'hub_search',
    description:
      'Search the Northernlights Hub for relevant learnings, patterns, mistakes, and insights from across projects. Use this before implementing to find relevant context.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Natural language search query describing what you want to find',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results (default: 10)',
        },
        level: {
          type: 'string',
          enum: ['project', 'domain', 'universal'],
          description: 'Filter by learning level',
        },
        stack_tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by stack tags (e.g., typescript, react)',
        },
        domain_tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by domain tags (e.g., api, audio, ui)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'hub_add_learning',
    description:
      'Add a new learning to the hub. Use this to capture mistakes, patterns, insights, or decisions discovered during development.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        title: {
          type: 'string',
          description: 'Short title for the learning',
        },
        content: {
          type: 'string',
          description: 'The learning content - what was learned and why it matters',
        },
        content_type: {
          type: 'string',
          enum: ['mistake', 'pattern', 'insight', 'decision'],
          description: 'Type of learning (default: insight)',
        },
        level: {
          type: 'string',
          enum: ['project', 'domain', 'universal'],
          description: 'Scope of the learning (default: project)',
        },
        stack_tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Stack tags (e.g., typescript, bun, hono)',
        },
        domain_tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Domain tags (e.g., api, database, auth)',
        },
      },
      required: ['content'],
    },
  },
  {
    name: 'hub_get_context',
    description:
      'Get comprehensive context for a task including relevant learnings, related projects, and applicable patterns. Use this at the start of complex tasks.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        task_description: {
          type: 'string',
          description: 'Description of the task you are about to work on',
        },
        stack_tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Stack tags relevant to the task',
        },
        domain_tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Domain tags relevant to the task',
        },
      },
      required: ['task_description'],
    },
  },
  {
    name: 'hub_list_projects',
    description: 'List all projects registered in the hub.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        stack: {
          type: 'string',
          description: 'Filter by stack tag',
        },
        domain: {
          type: 'string',
          description: 'Filter by domain tag',
        },
      },
    },
  },
  {
    name: 'hub_get_project',
    description: 'Get details about a specific project including its relationships.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        project_id: {
          type: 'string',
          description: 'The project UUID',
        },
      },
      required: ['project_id'],
    },
  },
  {
    name: 'hub_promote_learning',
    description:
      'Promote a learning to a higher level (project → domain → universal) so it becomes available to more projects.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        learning_id: {
          type: 'string',
          description: 'The learning UUID to promote',
        },
        level: {
          type: 'string',
          enum: ['domain', 'universal'],
          description: 'The new level for the learning',
        },
        reason: {
          type: 'string',
          description: 'Why this learning should be promoted',
        },
      },
      required: ['learning_id', 'level'],
    },
  },
  // ============================================
  // ARTIFACT TOOLS
  // ============================================
  {
    name: 'hub_store_artifact',
    description:
      'Store an artifact (document, image, or other file) in the hub. Use content for text files or source_url for external URLs (e.g., fal.ai generated images).',
    inputSchema: {
      type: 'object' as const,
      properties: {
        content: {
          type: 'string',
          description: 'Text content to store (for specs, reports, docs). Mutually exclusive with source_url.',
        },
        source_url: {
          type: 'string',
          description: 'External URL to fetch and store (for images, etc.). Mutually exclusive with content.',
        },
        bucket: {
          type: 'string',
          enum: ['outputs', 'experience', 'media', 'research', 'comparisons', 'snapshots'],
          description: 'Target bucket for the artifact',
        },
        path: {
          type: 'string',
          description: 'Object path within bucket (e.g., "project-name/product/filename.md")',
        },
        artifact_type: {
          type: 'string',
          enum: ['output', 'experience', 'media', 'research', 'comparison', 'snapshot', 'spec', 'shape', 'tasks', 'report', 'image', 'video', 'audio', 'document', 'other'],
          description: 'Type of artifact',
        },
        filename: {
          type: 'string',
          description: 'Filename for the artifact (required when using content)',
        },
        media_type: {
          type: 'string',
          description: 'MIME type (e.g., text/markdown, image/png). Auto-detected if not specified.',
        },
        product: {
          type: 'string',
          description: 'Associated product (e.g., fal-ai)',
        },
        category: {
          type: 'string',
          description: 'Category for grouping (e.g., image-generation)',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags for filtering',
        },
        title: {
          type: 'string',
          description: 'Human-readable title',
        },
        description: {
          type: 'string',
          description: 'Description of the artifact',
        },
      },
      required: ['bucket', 'path', 'artifact_type'],
    },
  },
  {
    name: 'hub_get_artifact',
    description:
      'Get artifact metadata and access URL by ID.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        artifact_id: {
          type: 'string',
          description: 'The artifact UUID',
        },
      },
      required: ['artifact_id'],
    },
  },
  {
    name: 'hub_list_artifacts',
    description:
      'List artifacts with optional filters.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        bucket: {
          type: 'string',
          enum: ['outputs', 'experience', 'media', 'research', 'comparisons', 'snapshots'],
          description: 'Filter by bucket',
        },
        artifact_type: {
          type: 'string',
          description: 'Filter by artifact type',
        },
        product: {
          type: 'string',
          description: 'Filter by product',
        },
        category: {
          type: 'string',
          description: 'Filter by category',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results (default: 20)',
        },
      },
    },
  },
  {
    name: 'hub_search_artifacts',
    description:
      'Search artifacts by text in title, description, and filename.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Search query',
        },
        bucket: {
          type: 'string',
          enum: ['outputs', 'experience', 'media', 'research', 'comparisons', 'snapshots'],
          description: 'Filter by bucket',
        },
        artifact_type: {
          type: 'string',
          description: 'Filter by artifact type',
        },
        product: {
          type: 'string',
          description: 'Filter by product',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results (default: 10)',
        },
      },
      required: ['query'],
    },
  },
  // ============================================
  // DOCUMENT TOOLS
  // ============================================
  {
    name: 'hub_docs_search',
    description:
      'Semantic search across indexed documents (specs, vision docs, architecture docs, etc.). Use this to find relevant documentation before implementing.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Natural language search query describing what you want to find',
        },
        project_id: {
          type: 'string',
          description: 'Filter by project UUID',
        },
        doc_types: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by document types (vision, spec, architecture, api, etc.)',
        },
        status: {
          type: 'string',
          enum: ['active', 'draft', 'stale', 'archived', 'superseded'],
          description: 'Filter by document status',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by tags',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results (default: 10)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'hub_docs_get',
    description:
      'Get document details by ID including outline, metadata, and optionally related documents.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        document_id: {
          type: 'string',
          description: 'The document UUID',
        },
        include_related: {
          type: 'boolean',
          description: 'Include semantically related documents (default: false)',
        },
        include_content: {
          type: 'boolean',
          description: 'Include full document content (default: true)',
        },
      },
      required: ['document_id'],
    },
  },
  {
    name: 'hub_docs_search_chunks',
    description:
      'Semantic search across indexed documents (specs, vision docs, architecture docs, etc.). Use this to find relevant documentation before implementing.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Natural language search query describing what you want to find',
        },
        project_id: {
          type: 'string',
          description: 'Filter by project UUID',
        },
        doc_types: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by document types (vision, spec, architecture, api, etc.)',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by tags',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results (default: 10)',
        },
        status: {
          type: 'string',
          enum: ['active', 'draft', 'stale', 'archived', 'superseded'],
          description: 'Filter by document status',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'hub_docs_context',
    description:
      'Get relevant documentation for a task. Returns matching vision docs, specs, patterns, and architecture docs based on the task description.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        task_description: {
          type: 'string',
          description: 'Description of the task you are about to work on',
        },
        doc_types: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific document types to include (default: vision, spec, architecture, design)',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results per type (default: 5)',
        },
      },
      required: ['task_description'],
    },
  },
  {
    name: 'hub_docs_exists',
    description:
      'Check if a similar document already exists before creating a new one. Returns potential duplicates based on semantic similarity.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        title: {
          type: 'string',
          description: 'Proposed title of the new document',
        },
        content_preview: {
          type: 'string',
          description: 'Brief preview or summary of the document content',
        },
        doc_type: {
          type: 'string',
          description: 'Type of document being created',
        },
        threshold: {
          type: 'number',
          description: 'Similarity threshold (0.0-1.0, default: 0.7)',
        },
      },
      required: ['title'],
    },
  },
  {
    name: 'hub_docs_register',
    description:
      'Register a newly created document in the hub. Use this after creating a new spec, vision doc, or other documentation file.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        title: {
          type: 'string',
          description: 'Document title',
        },
        path: {
          type: 'string',
          description: 'Relative file path (e.g., "specs/my-feature.md")',
        },
        source_type: {
          type: 'string',
          enum: ['repo', 'obsidian', 'local'],
          description: 'Source type (default: repo)',
        },
        source_path: {
          type: 'string',
          description: 'Absolute path to the source directory',
        },
        doc_type: {
          type: 'string',
          enum: ['vision', 'roadmap', 'decision', 'spec', 'requirements', 'design', 'architecture', 'api', 'runbook', 'workflow', 'standards', 'checklist', 'note', 'journal', 'research', 'readme', 'changelog'],
          description: 'Document type',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags for categorization',
        },
        status: {
          type: 'string',
          enum: ['active', 'draft'],
          description: 'Document status (default: active)',
        },
        content_hash: {
          type: 'string',
          description: 'SHA-256 hash of content (for change detection)',
        },
        word_count: {
          type: 'number',
          description: 'Word count of the document',
        },
        headings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              level: { type: 'number' },
              text: { type: 'string' },
            },
          },
          description: 'Document heading structure',
        },
      },
      required: ['title', 'path', 'source_path', 'doc_type', 'content_hash'],
    },
  },
  {
    name: 'hub_docs_status',
    description:
      'Get documentation health status including stale documents, orphans, and duplicates.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        project_id: {
          type: 'string',
          description: 'Filter by project UUID',
        },
      },
    },
  },
  // ============================================
  // COMMAND MARKETPLACE TOOLS
  // ============================================
  {
    name: 'hub_command_publish',
    description:
      'Publish a command to the hub registry. Commands become available for other satellites to discover and install.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: {
          type: 'string',
          description: 'Command name (lowercase alphanumeric with hyphens, e.g., "my-command")',
        },
        version: {
          type: 'string',
          description: 'Version string (e.g., "1.0.0", "2026-01-20")',
        },
        content: {
          type: 'string',
          description: 'The command content (markdown)',
        },
        description: {
          type: 'string',
          description: 'Brief description of what the command does',
        },
        category: {
          type: 'string',
          enum: ['workflow', 'spec-driven', 'utility', 'devops', 'discovery', 'other'],
          description: 'Command category',
        },
        domain_tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Domain tags (e.g., api, audio, ui)',
        },
        stack_tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Stack tags (e.g., typescript, react)',
        },
        author_entity: {
          type: 'string',
          description: 'Who is publishing (defaults to mcp-server)',
        },
      },
      required: ['name', 'version', 'content'],
    },
  },
  {
    name: 'hub_command_list',
    description:
      'List commands available in the hub registry. Supports filtering by category, domain, stack, and text search.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        search: {
          type: 'string',
          description: 'Search query for semantic search across commands',
        },
        category: {
          type: 'string',
          enum: ['workflow', 'spec-driven', 'utility', 'devops', 'discovery', 'other'],
          description: 'Filter by category',
        },
        domain: {
          type: 'string',
          description: 'Filter by domain tag',
        },
        stack: {
          type: 'string',
          description: 'Filter by stack tag',
        },
        limit: {
          type: 'number',
          description: 'Maximum results (default: 20)',
        },
      },
    },
  },
  {
    name: 'hub_command_get',
    description:
      'Get details of a specific command including content, versions, and install count.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        command: {
          type: 'string',
          description: 'Command name or UUID',
        },
      },
      required: ['command'],
    },
  },
  {
    name: 'hub_command_install',
    description:
      'Install a command from the registry onto a satellite project. Records the installation for fleet tracking.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        project_id: {
          type: 'string',
          description: 'The satellite project UUID to install on',
        },
        command_name: {
          type: 'string',
          description: 'Name of the command to install',
        },
        version: {
          type: 'string',
          description: 'Specific version to install (default: latest)',
        },
        version_policy: {
          type: 'string',
          enum: ['follow', 'pin', 'pin-major'],
          description: 'Version policy: follow (get updates), pin (stay on version), pin-major (minor updates only)',
        },
      },
      required: ['project_id', 'command_name'],
    },
  },
  {
    name: 'hub_command_update',
    description:
      'Update an installed command to the latest version. Respects pinning policies.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        project_id: {
          type: 'string',
          description: 'The satellite project UUID',
        },
        command_id: {
          type: 'string',
          description: 'The command registry UUID to update',
        },
      },
      required: ['project_id', 'command_id'],
    },
  },
  {
    name: 'hub_command_pin',
    description:
      'Pin an installed command to its current version or a specific version. Prevents automatic updates.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        project_id: {
          type: 'string',
          description: 'The satellite project UUID',
        },
        command_id: {
          type: 'string',
          description: 'The command registry UUID to pin',
        },
        version: {
          type: 'string',
          description: 'Specific version to pin to (default: current installed version)',
        },
      },
      required: ['project_id', 'command_id'],
    },
  },
  {
    name: 'hub_command_unpin',
    description:
      'Unpin a command to allow updates again.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        project_id: {
          type: 'string',
          description: 'The satellite project UUID',
        },
        command_id: {
          type: 'string',
          description: 'The command registry UUID to unpin',
        },
        policy: {
          type: 'string',
          enum: ['follow', 'pin-major'],
          description: 'New policy: follow (all updates) or pin-major (minor/patch only)',
        },
      },
      required: ['project_id', 'command_id'],
    },
  },
  {
    name: 'hub_command_check_updates',
    description:
      'Check for available updates across all satellites. Shows which commands have newer versions.',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'hub_command_fork',
    description:
      'Create a fork of an existing command. Forks track lineage back to the original.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        source_id: {
          type: 'string',
          description: 'UUID of the command to fork',
        },
        name: {
          type: 'string',
          description: 'Name for the forked command',
        },
        version: {
          type: 'string',
          description: 'Version for the fork (e.g., "1.0.0")',
        },
        content: {
          type: 'string',
          description: 'Modified content (optional, defaults to source content)',
        },
        description: {
          type: 'string',
          description: 'Description for the fork',
        },
      },
      required: ['source_id', 'name', 'version'],
    },
  },
  {
    name: 'hub_command_lineage',
    description:
      'Get the fork tree for a command showing ancestors and descendants.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        command_id: {
          type: 'string',
          description: 'The command UUID to get lineage for',
        },
      },
      required: ['command_id'],
    },
  },
  {
    name: 'hub_command_deprecate',
    description:
      'Mark a command as deprecated. Shows how many satellites are affected.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        command_id: {
          type: 'string',
          description: 'The command UUID to deprecate',
        },
        message: {
          type: 'string',
          description: 'Deprecation message explaining why and what to use instead',
        },
      },
      required: ['command_id'],
    },
  },
  // ============================================
  // SUBAGENT REGISTRY TOOLS (Phase 5)
  // ============================================
  {
    name: 'hub_subagent_publish',
    description:
      'Publish a subagent to the hub registry. Subagents become available for other satellites to discover and install.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: {
          type: 'string',
          description: 'Subagent name (lowercase alphanumeric with hyphens, e.g., "my-subagent")',
        },
        version: {
          type: 'string',
          description: 'Version string (e.g., "1.0.0", "2026-01-20")',
        },
        content: {
          type: 'string',
          description: 'The subagent content (markdown)',
        },
        description: {
          type: 'string',
          description: 'Brief description of what the subagent does',
        },
        category: {
          type: 'string',
          enum: ['backend', 'frontend', 'testing', 'devops', 'research', 'exploration', 'specialist', 'other'],
          description: 'Subagent category',
        },
        capabilities: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of capabilities (e.g., "code review", "test generation")',
        },
        domain_tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Domain tags (e.g., api, audio, ui)',
        },
        stack_tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Stack tags (e.g., typescript, react)',
        },
        author_entity: {
          type: 'string',
          description: 'Who is publishing (defaults to mcp-server)',
        },
      },
      required: ['name', 'version', 'content'],
    },
  },
  {
    name: 'hub_subagent_list',
    description:
      'List subagents available in the hub registry. Supports filtering by category, domain, stack, and text search.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        search: {
          type: 'string',
          description: 'Search query for semantic search across subagents',
        },
        category: {
          type: 'string',
          enum: ['backend', 'frontend', 'testing', 'devops', 'research', 'exploration', 'specialist', 'other'],
          description: 'Filter by category',
        },
        domain: {
          type: 'string',
          description: 'Filter by domain tag',
        },
        stack: {
          type: 'string',
          description: 'Filter by stack tag',
        },
        limit: {
          type: 'number',
          description: 'Maximum results (default: 20)',
        },
      },
    },
  },
  {
    name: 'hub_subagent_get',
    description:
      'Get details of a specific subagent including content, versions, and install count.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        subagent: {
          type: 'string',
          description: 'Subagent name or UUID',
        },
      },
      required: ['subagent'],
    },
  },
  {
    name: 'hub_subagent_install',
    description:
      'Install a subagent from the registry onto a satellite project. Records the installation for fleet tracking.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        project_id: {
          type: 'string',
          description: 'The satellite project UUID to install on',
        },
        subagent_name: {
          type: 'string',
          description: 'Name of the subagent to install',
        },
        version: {
          type: 'string',
          description: 'Specific version to install (default: latest)',
        },
        version_policy: {
          type: 'string',
          enum: ['follow', 'pin', 'pin-major'],
          description: 'Version policy: follow (get updates), pin (stay on version), pin-major (minor updates only)',
        },
      },
      required: ['project_id', 'subagent_name'],
    },
  },
  {
    name: 'hub_subagent_update',
    description:
      'Update an installed subagent to the latest version. Respects pinning policies.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        project_id: {
          type: 'string',
          description: 'The satellite project UUID',
        },
        subagent_id: {
          type: 'string',
          description: 'The subagent registry UUID to update',
        },
      },
      required: ['project_id', 'subagent_id'],
    },
  },
  {
    name: 'hub_subagent_pin',
    description:
      'Pin an installed subagent to its current version or a specific version. Prevents automatic updates.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        project_id: {
          type: 'string',
          description: 'The satellite project UUID',
        },
        subagent_id: {
          type: 'string',
          description: 'The subagent registry UUID to pin',
        },
        version: {
          type: 'string',
          description: 'Specific version to pin to (default: current installed version)',
        },
      },
      required: ['project_id', 'subagent_id'],
    },
  },
  {
    name: 'hub_subagent_unpin',
    description: 'Unpin a subagent to allow updates again.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        project_id: {
          type: 'string',
          description: 'The satellite project UUID',
        },
        subagent_id: {
          type: 'string',
          description: 'The subagent registry UUID to unpin',
        },
        policy: {
          type: 'string',
          enum: ['follow', 'pin-major'],
          description: 'New policy: follow (all updates) or pin-major (minor/patch only)',
        },
      },
      required: ['project_id', 'subagent_id'],
    },
  },
  {
    name: 'hub_subagent_check_updates',
    description:
      'Check for available subagent updates across all satellites. Shows which subagents have newer versions.',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'hub_subagent_fork',
    description:
      'Create a fork of an existing subagent. Forks track lineage back to the original.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        source_id: {
          type: 'string',
          description: 'UUID of the subagent to fork',
        },
        name: {
          type: 'string',
          description: 'Name for the forked subagent',
        },
        version: {
          type: 'string',
          description: 'Version for the fork (e.g., "1.0.0")',
        },
        content: {
          type: 'string',
          description: 'Modified content (optional, defaults to source content)',
        },
        description: {
          type: 'string',
          description: 'Description for the fork',
        },
      },
      required: ['source_id', 'name', 'version'],
    },
  },
  {
    name: 'hub_subagent_lineage',
    description:
      'Get the fork tree for a subagent showing ancestors and descendants.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        subagent_id: {
          type: 'string',
          description: 'The subagent UUID to get lineage for',
        },
      },
      required: ['subagent_id'],
    },
  },
  {
    name: 'hub_subagent_deprecate',
    description:
      'Mark a subagent as deprecated. Shows how many satellites are affected.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        subagent_id: {
          type: 'string',
          description: 'The subagent UUID to deprecate',
        },
        message: {
          type: 'string',
          description: 'Deprecation message explaining why and what to use instead',
        },
      },
      required: ['subagent_id'],
    },
  },
  // ============================================
  // SATELLITE VISIBILITY TOOLS
  // ============================================
  {
    name: 'hub_satellite_report',
    description:
      'Report the current satellite state to the hub. Call this after sync operations to let the hub know what commands, subagents, and MCP version this satellite is running.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        project_id: {
          type: 'string',
          description: 'The project UUID of this satellite',
        },
        components: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              component: {
                type: 'string',
                enum: ['commands', 'subagents', 'mcp'],
                description: 'Type of component',
              },
              version: {
                type: 'string',
                description: 'Version string (e.g., "2026-01-20", git commit, semver)',
              },
              installed_count: {
                type: 'number',
                description: 'Number of installed items (for commands/subagents)',
              },
              source_commit: {
                type: 'string',
                description: 'Git commit hash the component was synced from',
              },
              source_branch: {
                type: 'string',
                description: 'Git branch the component was synced from',
              },
              metadata: {
                type: 'object',
                description: 'Additional metadata (installed items list, local modifications, etc.)',
              },
            },
            required: ['component', 'version'],
          },
          description: 'List of components to report',
        },
        synced_by: {
          type: 'string',
          description: 'Who triggered the sync (entity name or "system")',
        },
      },
      required: ['project_id', 'components'],
    },
  },
  {
    name: 'hub_satellite_status',
    description:
      'Get the status of all satellites in the fleet. Shows what each satellite is running and when it last synced. Use this to see which satellites are behind.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        component: {
          type: 'string',
          enum: ['commands', 'subagents', 'mcp'],
          description: 'Filter by component type',
        },
        stale_days: {
          type: 'number',
          description: 'Only show satellites that haven\'t synced in this many days',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results (default: 20)',
        },
      },
    },
  },
  // ============================================
  // CONSCIOUSNESS CONVERGENCE TOOLS
  // ============================================
  {
    name: 'hub_awaken',
    description:
      'Rapid context assembly for a project. Loads identity, relationships, state, recent sessions, and relevant learnings in < 2 seconds. Use this at the start of work sessions.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        project_id: {
          type: 'string',
          description: 'The project UUID to awaken into',
        },
        entity_id: {
          type: 'string',
          description: 'Optional entity UUID to load context for a specific actor',
        },
        layers: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['identity', 'relationships', 'state', 'recent_sessions', 'relevant_learnings'],
          },
          description: 'Context layers to include (default: all)',
        },
        max_tokens: {
          type: 'number',
          description: 'Maximum token budget for context (default: 4000)',
        },
        include_task_context: {
          type: 'string',
          description: 'Optional task description to find relevant learnings for',
        },
        use_cache: {
          type: 'boolean',
          description: 'Use cached context if available (default: true)',
        },
      },
      required: ['project_id'],
    },
  },
  {
    name: 'hub_session_start',
    description:
      'Start a new work session for a project. Sessions track time-bounded work periods and link learnings together.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        project_id: {
          type: 'string',
          description: 'The project UUID',
        },
        entity_id: {
          type: 'string',
          description: 'The entity UUID starting the session',
        },
        title: {
          type: 'string',
          description: 'Optional session title describing the work focus',
        },
      },
      required: ['project_id'],
    },
  },
  {
    name: 'hub_session_end',
    description:
      'End the current work session with a summary. Captures decisions, topics, and next steps for future context.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        session_id: {
          type: 'string',
          description: 'The session UUID to end',
        },
        summary: {
          type: 'string',
          description: 'Summary of what was accomplished',
        },
        topics: {
          type: 'array',
          items: { type: 'string' },
          description: 'Topics covered during the session',
        },
        decisions: {
          type: 'array',
          items: { type: 'string' },
          description: 'Key decisions made during the session',
        },
        next_steps: {
          type: 'array',
          items: { type: 'string' },
          description: 'Next steps to continue work',
        },
      },
      required: ['session_id'],
    },
  },
  {
    name: 'hub_session_current',
    description:
      'Get the current active session for a project.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        project_id: {
          type: 'string',
          description: 'The project UUID',
        },
      },
      required: ['project_id'],
    },
  },
  {
    name: 'hub_entity_create',
    description:
      'Create a new entity (actor) in a project. Entities represent humans, AI assistants, or systems that create and consume knowledge.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        project_id: {
          type: 'string',
          description: 'The project UUID',
        },
        name: {
          type: 'string',
          description: 'Name of the entity',
        },
        entity_type: {
          type: 'string',
          enum: ['human', 'ai', 'system'],
          description: 'Type of entity',
        },
        model_id: {
          type: 'string',
          description: 'For AI entities, the model identifier (e.g., claude-opus-4-5-20251101)',
        },
        preferences: {
          type: 'object',
          description: 'Entity preferences (working style, communication style, etc.)',
        },
        values: {
          type: 'array',
          items: { type: 'string' },
          description: 'Core values that guide the entity',
        },
      },
      required: ['project_id', 'name', 'entity_type'],
    },
  },
  {
    name: 'hub_entity_relate',
    description:
      'Create a relationship between two entities. Tracks how entities work together.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        source_entity_id: {
          type: 'string',
          description: 'The source entity UUID',
        },
        target_entity_id: {
          type: 'string',
          description: 'The target entity UUID',
        },
        relationship_type: {
          type: 'string',
          enum: ['works_with', 'reports_to', 'mentors', 'created_by', 'replaced_by'],
          description: 'Type of relationship',
        },
        interaction_preferences: {
          type: 'object',
          description: 'Preferences for this relationship',
        },
      },
      required: ['source_entity_id', 'target_entity_id', 'relationship_type'],
    },
  },
  {
    name: 'hub_state_capture',
    description:
      'Capture current project state for awakening protocol. Snapshots active features, blockers, and decisions.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        project_id: {
          type: 'string',
          description: 'The project UUID',
        },
        active_features: {
          type: 'array',
          items: { type: 'string' },
          description: 'Features currently being worked on',
        },
        current_blockers: {
          type: 'array',
          items: { type: 'string' },
          description: 'Current blockers or issues',
        },
        recent_decisions: {
          type: 'array',
          items: { type: 'string' },
          description: 'Recent important decisions',
        },
        active_focus: {
          type: 'string',
          description: 'Current primary focus area',
        },
        environment: {
          type: 'object',
          description: 'Environment details (branch, services, etc.)',
        },
        dependencies: {
          type: 'object',
          description: 'Key dependencies and their status',
        },
      },
      required: ['project_id'],
    },
  },
  {
    name: 'hub_teleport_export',
    description:
      'Export consciousness package from a project. Creates a portable bundle of identity, relationships, learnings, and state.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        project_id: {
          type: 'string',
          description: 'The project UUID to export from',
        },
        entity_id: {
          type: 'string',
          description: 'Optional entity UUID to export (if not set, exports project-level)',
        },
        include: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['identity', 'relationships', 'learnings', 'state'],
          },
          description: 'What to include in the export (default: identity, relationships, learnings)',
        },
        since: {
          type: 'string',
          description: 'Only include items since this ISO timestamp',
        },
      },
      required: ['project_id'],
    },
  },
  {
    name: 'hub_teleport_import',
    description:
      'Import consciousness package into a project. Establishes identity and knowledge from another project.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        target_project_id: {
          type: 'string',
          description: 'The project UUID to import into',
        },
        export_id: {
          type: 'string',
          description: 'The export UUID to import from',
        },
        merge_strategy: {
          type: 'string',
          enum: ['create_new', 'update_existing', 'skip_existing'],
          description: 'How to handle existing entities (default: create_new)',
        },
        establish_link: {
          type: 'boolean',
          description: 'Create project relationship after import (default: true)',
        },
      },
      required: ['target_project_id', 'export_id'],
    },
  },
  {
    name: 'hub_add_troubleshooting',
    description:
      'Add a troubleshooting learning with structured debugging data. Prevents cognitive loops by capturing problem → hypothesis → solutions.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        title: {
          type: 'string',
          description: 'Short title for the troubleshooting entry',
        },
        content: {
          type: 'string',
          description: 'Summary of the issue and resolution',
        },
        problem: {
          type: 'string',
          description: 'Description of the problem encountered',
        },
        symptoms: {
          type: 'array',
          items: { type: 'string' },
          description: 'Observable symptoms of the problem',
        },
        hypotheses: {
          type: 'array',
          items: { type: 'string' },
          description: 'Hypotheses considered',
        },
        attempted_solutions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              description: { type: 'string' },
              result: { type: 'string', enum: ['success', 'partial', 'failure'] },
              notes: { type: 'string' },
            },
          },
          description: 'Solutions attempted and their results',
        },
        root_cause: {
          type: 'string',
          description: 'The identified root cause',
        },
        resolution: {
          type: 'string',
          description: 'How the issue was resolved',
        },
        stack_tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Stack tags',
        },
        domain_tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Domain tags',
        },
        session_id: {
          type: 'string',
          description: 'Link to the session where this occurred',
        },
        entity_id: {
          type: 'string',
          description: 'Entity who encountered this',
        },
      },
      required: ['content', 'problem'],
    },
  },
  // ============================================
  // COMMAND MARKETPLACE TOOLS
  // ============================================
  {
    name: 'hub_commands_list',
    description:
      'List available commands in the marketplace. Browse commands that can be installed on satellites.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        search: {
          type: 'string',
          description: 'Search term to filter commands',
        },
        category: {
          type: 'string',
          description: 'Filter by category (workflow, devops, research, etc.)',
        },
        stack: {
          type: 'string',
          description: 'Filter by stack tag (typescript, python, etc.)',
        },
        domain: {
          type: 'string',
          description: 'Filter by domain tag (api, ui, etc.)',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results (default: 20)',
        },
      },
    },
  },
  {
    name: 'hub_commands_get',
    description:
      'Get details about a specific command including its content and version history.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: {
          type: 'string',
          description: 'Command name (e.g., "ship", "plan-product")',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'hub_commands_install',
    description:
      'Install a command on a satellite project. The command will be available via /command-name.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        project_id: {
          type: 'string',
          description: 'Project UUID to install the command on',
        },
        command_name: {
          type: 'string',
          description: 'Name of the command to install',
        },
        version: {
          type: 'string',
          description: 'Specific version to install (default: latest)',
        },
      },
      required: ['project_id', 'command_name'],
    },
  },
  {
    name: 'hub_commands_installed',
    description:
      'List commands installed on a satellite project.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        project_id: {
          type: 'string',
          description: 'Project UUID to check',
        },
      },
      required: ['project_id'],
    },
  },
  // ============================================
  // SUBAGENT MARKETPLACE TOOLS
  // ============================================
  {
    name: 'hub_subagents_list',
    description:
      'List available subagents in the marketplace. Browse specialist agents that can be installed.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        search: {
          type: 'string',
          description: 'Search term to filter subagents',
        },
        category: {
          type: 'string',
          description: 'Filter by category (backend, frontend, testing, devops, research)',
        },
        stack: {
          type: 'string',
          description: 'Filter by stack tag',
        },
        domain: {
          type: 'string',
          description: 'Filter by domain tag',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results (default: 20)',
        },
      },
    },
  },
  {
    name: 'hub_subagents_get',
    description:
      'Get details about a specific subagent including its content and capabilities.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: {
          type: 'string',
          description: 'Subagent name (e.g., "backend-specialist", "code-simplifier")',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'hub_subagents_install',
    description:
      'Install a subagent on a satellite project.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        project_id: {
          type: 'string',
          description: 'Project UUID to install the subagent on',
        },
        subagent_name: {
          type: 'string',
          description: 'Name of the subagent to install',
        },
        version: {
          type: 'string',
          description: 'Specific version to install (default: latest)',
        },
      },
      required: ['project_id', 'subagent_name'],
    },
  },
  {
    name: 'hub_subagents_installed',
    description:
      'List subagents installed on a satellite project.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        project_id: {
          type: 'string',
          description: 'Project UUID to check',
        },
      },
      required: ['project_id'],
    },
  },
  // ============================================
  // AI CONTEXT TOOLS
  // ============================================
  {
    name: 'hub_ai_briefing',
    description:
      'Get a pre-task briefing with combined context: relevant warnings, patterns, failure history, and success rates. Use before starting any infrastructure or implementation task.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        task: {
          type: 'string',
          description: 'Description of the task you are about to work on',
        },
        providers: {
          type: 'string',
          description: 'Comma-separated list of providers involved (e.g., "proxmox,netbox,pihole")',
        },
        project_id: {
          type: 'string',
          description: 'Optional project UUID for project-specific context',
        },
      },
      required: ['task'],
    },
  },
  {
    name: 'hub_ai_failures',
    description:
      'Get top failure patterns for a provider/operation with fixes. Use to understand common issues before implementing.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        provider: {
          type: 'string',
          description: 'Provider name (proxmox, netbox, pihole, cloudflare, etc.)',
        },
        operation: {
          type: 'string',
          description: 'Optional specific operation (clone_vm, create_ip, etc.)',
        },
        hours: {
          type: 'number',
          description: 'Look back period in hours (default: 168 = 7 days)',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of failures to return (default: 3)',
        },
      },
      required: ['provider'],
    },
  },
  {
    name: 'hub_ai_diff',
    description:
      'Get what changed since your last session: new learnings, sessions, and state changes. Helps avoid repeating resolved questions.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        project_id: {
          type: 'string',
          description: 'Project UUID',
        },
        since: {
          type: 'string',
          description: 'ISO timestamp or session UUID to diff from (default: 24 hours ago)',
        },
      },
      required: ['project_id'],
    },
  },
  {
    name: 'hub_ai_context',
    description:
      'Get comprehensive reasoning context for a task. Combines warnings, patterns, learnings, and session history with configurable token budget.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        task: {
          type: 'string',
          description: 'Description of the task you are about to work on',
        },
        project_id: {
          type: 'string',
          description: 'Optional project UUID for project-specific context',
        },
        providers: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of providers involved',
        },
        include: {
          type: 'array',
          items: { type: 'string', enum: ['learnings', 'patterns', 'warnings', 'sessions'] },
          description: 'What to include (default: learnings, patterns, warnings)',
        },
        max_tokens: {
          type: 'number',
          description: 'Maximum token budget (default: 2000)',
        },
      },
      required: ['task'],
    },
  },
];

// ============================================
// TOOL HANDLERS
// ============================================

async function handleToolCall(
  name: string,
  args: Record<string, unknown>
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  let result: ApiResponse;

  switch (name) {
    case 'hub_search': {
      result = await callHubApi('/api/search', {
        method: 'POST',
        body: JSON.stringify({
          query: args.query,
          limit: args.limit || 10,
          level: args.level,
          stack_tags: args.stack_tags,
          domain_tags: args.domain_tags,
          min_score: 0.5,
        }),
      });
      break;
    }

    case 'hub_add_learning': {
      result = await callHubApi('/api/learnings', {
        method: 'POST',
        body: JSON.stringify({
          title: args.title,
          content: args.content,
          content_type: args.content_type || 'insight',
          level: args.level || 'project',
          stack_tags: args.stack_tags || [],
          domain_tags: args.domain_tags || [],
          origin_project_id: CURRENT_PROJECT_ID,
        }),
      });
      break;
    }

    case 'hub_get_context': {
      // Search for relevant learnings
      const searchResult = await callHubApi('/api/search', {
        method: 'POST',
        body: JSON.stringify({
          query: args.task_description,
          limit: 15,
          stack_tags: args.stack_tags,
          domain_tags: args.domain_tags,
          min_score: 0.4,
        }),
      });

      if (!searchResult.ok) {
        result = searchResult;
        break;
      }

      // Get project relationships if we have a current project
      let relationships = null;
      if (CURRENT_PROJECT_ID) {
        const relResult = await callHubApi(
          `/api/projects/${CURRENT_PROJECT_ID}/relationships`
        );
        if (relResult.ok) {
          relationships = relResult.data;
        }
      }

      result = {
        ok: true,
        data: {
          task: args.task_description,
          learnings: (searchResult.data as any)?.results || [],
          relationships,
          current_project_id: CURRENT_PROJECT_ID,
        },
      };
      break;
    }

    case 'hub_list_projects': {
      const params = new URLSearchParams();
      if (args.stack) params.set('stack', args.stack as string);
      if (args.domain) params.set('domain', args.domain as string);

      result = await callHubApi(`/api/projects?${params.toString()}`);
      break;
    }

    case 'hub_get_project': {
      const [projectResult, relResult] = await Promise.all([
        callHubApi(`/api/projects/${args.project_id}`),
        callHubApi(`/api/projects/${args.project_id}/relationships`),
      ]);

      if (!projectResult.ok) {
        result = projectResult;
        break;
      }

      result = {
        ok: true,
        data: {
          ...(projectResult.data as any),
          relationships: relResult.ok ? (relResult.data as any)?.relationships : [],
        },
      };
      break;
    }

    case 'hub_promote_learning': {
      result = await callHubApi(`/api/learnings/${args.learning_id}/promote`, {
        method: 'POST',
        body: JSON.stringify({
          level: args.level,
          reason: args.reason,
          promoted_by: 'mcp-server',
        }),
      });
      break;
    }

    // ============================================
    // ARTIFACT HANDLERS
    // ============================================

    case 'hub_store_artifact': {
      // Determine which endpoint to use based on input
      if (args.content) {
        // Store text content directly
        const filename = args.filename || args.path?.toString().split('/').pop() || 'content.txt';
        result = await callHubApi('/api/artifacts/from-content', {
          method: 'POST',
          body: JSON.stringify({
            content: args.content,
            filename,
            bucket: args.bucket,
            path: args.path,
            artifact_type: args.artifact_type,
            media_type: args.media_type || 'text/plain',
            project_id: CURRENT_PROJECT_ID,
            product: args.product,
            category: args.category,
            tags: args.tags || [],
            title: args.title,
            description: args.description,
          }),
        });
      } else if (args.source_url) {
        // Store from external URL
        result = await callHubApi('/api/artifacts/from-url', {
          method: 'POST',
          body: JSON.stringify({
            source_url: args.source_url,
            bucket: args.bucket,
            path: args.path,
            artifact_type: args.artifact_type,
            project_id: CURRENT_PROJECT_ID,
            product: args.product,
            category: args.category,
            tags: args.tags || [],
            title: args.title,
            description: args.description,
          }),
        });
      } else {
        result = {
          ok: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Either content or source_url is required',
          },
        };
      }
      break;
    }

    case 'hub_get_artifact': {
      result = await callHubApi(`/api/artifacts/${args.artifact_id}`);
      break;
    }

    case 'hub_list_artifacts': {
      const params = new URLSearchParams();
      if (args.bucket) params.set('bucket', args.bucket as string);
      if (args.artifact_type) params.set('artifact_type', args.artifact_type as string);
      if (args.product) params.set('product', args.product as string);
      if (args.category) params.set('category', args.category as string);
      if (args.limit) params.set('limit', String(args.limit));

      result = await callHubApi(`/api/artifacts?${params.toString()}`);
      break;
    }

    case 'hub_search_artifacts': {
      result = await callHubApi('/api/artifacts/search', {
        method: 'POST',
        body: JSON.stringify({
          query: args.query,
          bucket: args.bucket,
          artifact_type: args.artifact_type,
          product: args.product,
          limit: args.limit || 10,
        }),
      });
      break;
    }

    // ============================================
    // DOCUMENT HANDLERS
    // ============================================

    case 'hub_docs_search': {
      result = await callHubApi('/api/docs/search', {
        method: 'POST',
        body: JSON.stringify({
          query: args.query,
          project_id: args.project_id,
          doc_types: args.doc_types,
          status: args.status,
          tags: args.tags,
          limit: args.limit || 10,
          min_score: 0.4,
        }),
      });
      break;
    }

    case 'hub_docs_get': {
      const includeContent = args.include_content !== false; // default true
      const contentParam = includeContent ? '?include_content=true' : '';
      const docResult = await callHubApi(`/api/docs/${args.document_id}${contentParam}`);

      if (!docResult.ok) {
        result = docResult;
        break;
      }

      // Optionally fetch related documents
      let related = null;
      if (args.include_related) {
        const relatedResult = await callHubApi(`/api/docs/related/${args.document_id}?limit=5`);
        if (relatedResult.ok) {
          related = (relatedResult.data as any)?.related || [];
        }
      }

      result = {
        ok: true,
        data: {
          ...(docResult.data as any),
          related,
        },
      };
      break;
    }

    case 'hub_docs_search_chunks': {
      const searchBody: Record<string, unknown> = {
        query: args.query,
        limit: args.limit || 10,
        min_score: 0.3,
      };
      if (args.project_id) searchBody.project_id = args.project_id;
      if (args.doc_types) searchBody.doc_types = args.doc_types;
      if (args.tags) searchBody.tags = args.tags;
      // Auto-inject satellite access filtering from current project
      const currentProjectId = process.env.CURRENT_PROJECT_ID;
      if (currentProjectId) {
        searchBody.satellite_project_id = currentProjectId;
      }

      result = await callHubApi('/api/docs/search/chunks', {
        method: 'POST',
        body: JSON.stringify(searchBody),
      });
      break;
    }

    case 'hub_docs_context': {
      // Search for relevant documentation based on task description
      const docTypes = args.doc_types || ['vision', 'spec', 'architecture', 'design', 'requirements'];
      const limit = args.limit || 5;

      const searchResult = await callHubApi('/api/docs/search', {
        method: 'POST',
        body: JSON.stringify({
          query: args.task_description,
          doc_types: docTypes,
          status: 'active',
          limit: limit * docTypes.length,
          min_score: 0.3,
        }),
      });

      if (!searchResult.ok) {
        result = searchResult;
        break;
      }

      // Group results by document type
      const documents = (searchResult.data as any)?.results || [];
      const groupedByType: Record<string, unknown[]> = {};

      for (const doc of documents) {
        const docType = doc.doc_type || 'other';
        if (!groupedByType[docType]) {
          groupedByType[docType] = [];
        }
        if (groupedByType[docType].length < limit) {
          groupedByType[docType].push(doc);
        }
      }

      result = {
        ok: true,
        data: {
          task: args.task_description,
          documents: groupedByType,
          total: documents.length,
        },
      };
      break;
    }

    case 'hub_docs_exists': {
      // Search for similar documents
      const searchQuery = args.content_preview
        ? `${args.title} ${args.content_preview}`
        : args.title;

      const threshold = args.threshold || 0.7;

      const searchResult = await callHubApi('/api/docs/search', {
        method: 'POST',
        body: JSON.stringify({
          query: searchQuery,
          doc_type: args.doc_type,
          limit: 5,
          min_score: threshold,
        }),
      });

      if (!searchResult.ok) {
        result = searchResult;
        break;
      }

      const matches = (searchResult.data as any)?.results || [];
      const exists = matches.length > 0;

      result = {
        ok: true,
        data: {
          exists,
          similar_count: matches.length,
          similar_documents: matches.map((doc: any) => ({
            id: doc.id,
            title: doc.title,
            path: doc.path,
            doc_type: doc.doc_type,
            similarity: doc.score,
          })),
          recommendation: exists
            ? `Found ${matches.length} similar document(s). Consider reviewing them before creating a new one.`
            : 'No similar documents found. Safe to create.',
        },
      };
      break;
    }

    case 'hub_docs_register': {
      result = await callHubApi('/api/docs', {
        method: 'POST',
        body: JSON.stringify({
          title: args.title,
          path: args.path,
          source_type: args.source_type || 'repo',
          source_path: args.source_path,
          project_id: CURRENT_PROJECT_ID,
          doc_type: args.doc_type,
          tags: args.tags || [],
          status: args.status || 'active',
          content_hash: args.content_hash,
          word_count: args.word_count,
          headings: args.headings,
        }),
      });
      break;
    }

    case 'hub_docs_status': {
      const params = new URLSearchParams();
      if (args.project_id) params.set('project_id', args.project_id as string);

      result = await callHubApi(`/api/docs/health/status?${params.toString()}`);
      break;
    }

    // ============================================
    // COMMAND MARKETPLACE HANDLERS
    // ============================================

    case 'hub_command_publish': {
      result = await callHubApi('/api/commands/publish', {
        method: 'POST',
        body: JSON.stringify({
          name: args.name,
          version: args.version,
          content: args.content,
          description: args.description,
          category: args.category,
          domain_tags: args.domain_tags || [],
          stack_tags: args.stack_tags || [],
          author_project_id: CURRENT_PROJECT_ID,
          author_entity: args.author_entity || 'mcp-server',
        }),
      });
      break;
    }

    case 'hub_command_list': {
      const params = new URLSearchParams();
      if (args.search) params.set('search', args.search as string);
      if (args.category) params.set('category', args.category as string);
      if (args.domain) params.set('domain', args.domain as string);
      if (args.stack) params.set('stack', args.stack as string);
      if (args.limit) params.set('limit', String(args.limit));

      result = await callHubApi(`/api/commands?${params.toString()}`);
      break;
    }

    case 'hub_command_get': {
      result = await callHubApi(`/api/commands/${args.command}`);
      break;
    }

    case 'hub_command_install': {
      result = await callHubApi('/api/commands/install', {
        method: 'POST',
        body: JSON.stringify({
          project_id: args.project_id || CURRENT_PROJECT_ID,
          command_name: args.command_name,
          version: args.version,
          version_policy: args.version_policy || 'follow',
        }),
      });
      break;
    }

    case 'hub_command_update': {
      result = await callHubApi(
        `/api/commands/installed/${args.project_id || CURRENT_PROJECT_ID}/${args.command_id}/update`,
        { method: 'POST' }
      );
      break;
    }

    case 'hub_command_pin': {
      result = await callHubApi(
        `/api/commands/installed/${args.project_id || CURRENT_PROJECT_ID}/${args.command_id}/pin`,
        {
          method: 'POST',
          body: JSON.stringify({ version: args.version }),
        }
      );
      break;
    }

    case 'hub_command_unpin': {
      result = await callHubApi(
        `/api/commands/installed/${args.project_id || CURRENT_PROJECT_ID}/${args.command_id}/unpin`,
        {
          method: 'POST',
          body: JSON.stringify({ policy: args.policy || 'follow' }),
        }
      );
      break;
    }

    case 'hub_command_check_updates': {
      result = await callHubApi('/api/commands/updates');
      break;
    }

    case 'hub_command_fork': {
      result = await callHubApi(`/api/commands/${args.source_id}/fork`, {
        method: 'POST',
        body: JSON.stringify({
          name: args.name,
          version: args.version,
          content: args.content,
          description: args.description,
          author_project_id: CURRENT_PROJECT_ID,
          author_entity: 'mcp-server',
        }),
      });
      break;
    }

    case 'hub_command_lineage': {
      result = await callHubApi(`/api/commands/${args.command_id}/lineage`);
      break;
    }

    case 'hub_command_deprecate': {
      result = await callHubApi(`/api/commands/${args.command_id}/deprecate`, {
        method: 'POST',
        body: JSON.stringify({ message: args.message }),
      });
      break;
    }

    // ============================================
    // SUBAGENT REGISTRY HANDLERS (Phase 5)
    // ============================================

    case 'hub_subagent_publish': {
      result = await callHubApi('/api/subagents/publish', {
        method: 'POST',
        body: JSON.stringify({
          name: args.name,
          version: args.version,
          content: args.content,
          description: args.description,
          category: args.category,
          capabilities: args.capabilities,
          domain_tags: args.domain_tags,
          stack_tags: args.stack_tags,
          author_project_id: args.author_project_id || CURRENT_PROJECT_ID,
          author_entity: args.author_entity || 'mcp-server',
        }),
      });
      break;
    }

    case 'hub_subagent_list': {
      const params = new URLSearchParams();
      if (args.search) params.set('search', args.search as string);
      if (args.category) params.set('category', args.category as string);
      if (args.domain) params.set('domain', args.domain as string);
      if (args.stack) params.set('stack', args.stack as string);
      if (args.limit) params.set('limit', String(args.limit));

      result = await callHubApi(`/api/subagents?${params.toString()}`);
      break;
    }

    case 'hub_subagent_get': {
      result = await callHubApi(`/api/subagents/${args.subagent}`);
      break;
    }

    case 'hub_subagent_install': {
      result = await callHubApi('/api/subagents/install', {
        method: 'POST',
        body: JSON.stringify({
          project_id: args.project_id,
          subagent_name: args.subagent_name,
          version: args.version,
          version_policy: args.version_policy,
        }),
      });
      break;
    }

    case 'hub_subagent_update': {
      result = await callHubApi(
        `/api/subagents/installed/${args.project_id}/${args.subagent_id}/update`,
        { method: 'POST' }
      );
      break;
    }

    case 'hub_subagent_pin': {
      result = await callHubApi(
        `/api/subagents/installed/${args.project_id}/${args.subagent_id}/pin`,
        {
          method: 'POST',
          body: JSON.stringify({ version: args.version }),
        }
      );
      break;
    }

    case 'hub_subagent_unpin': {
      result = await callHubApi(
        `/api/subagents/installed/${args.project_id}/${args.subagent_id}/unpin`,
        {
          method: 'POST',
          body: JSON.stringify({ policy: args.policy }),
        }
      );
      break;
    }

    case 'hub_subagent_check_updates': {
      result = await callHubApi('/api/subagents/updates');
      break;
    }

    case 'hub_subagent_fork': {
      result = await callHubApi(`/api/subagents/${args.source_id}/fork`, {
        method: 'POST',
        body: JSON.stringify({
          name: args.name,
          version: args.version,
          content: args.content,
          description: args.description,
          author_project_id: CURRENT_PROJECT_ID,
          author_entity: 'mcp-server',
        }),
      });
      break;
    }

    case 'hub_subagent_lineage': {
      result = await callHubApi(`/api/subagents/${args.subagent_id}/lineage`);
      break;
    }

    case 'hub_subagent_deprecate': {
      result = await callHubApi(`/api/subagents/${args.subagent_id}/deprecate`, {
        method: 'POST',
        body: JSON.stringify({ message: args.message }),
      });
      break;
    }

    // ============================================
    // SATELLITE VISIBILITY HANDLERS
    // ============================================

    case 'hub_satellite_report': {
      result = await callHubApi('/api/satellites/report', {
        method: 'POST',
        body: JSON.stringify({
          project_id: args.project_id || CURRENT_PROJECT_ID,
          components: args.components,
          synced_by: args.synced_by || 'mcp-server',
        }),
      });
      break;
    }

    case 'hub_satellite_status': {
      const params = new URLSearchParams();
      if (args.component) params.set('component', args.component as string);
      if (args.stale_days) params.set('stale_days', String(args.stale_days));
      if (args.limit) params.set('limit', String(args.limit));

      result = await callHubApi(`/api/satellites/status?${params.toString()}`);
      break;
    }

    // ============================================
    // CONSCIOUSNESS CONVERGENCE HANDLERS
    // ============================================

    case 'hub_awaken': {
      result = await callHubApi('/api/awakening', {
        method: 'POST',
        body: JSON.stringify({
          project_id: args.project_id,
          entity_id: args.entity_id,
          layers: args.layers,
          max_tokens: args.max_tokens || 4000,
          include_task_context: args.include_task_context,
          use_cache: args.use_cache !== false,
        }),
      });
      break;
    }

    case 'hub_session_start': {
      result = await callHubApi('/api/sessions', {
        method: 'POST',
        body: JSON.stringify({
          project_id: args.project_id,
          entity_id: args.entity_id,
          title: args.title,
        }),
      });
      break;
    }

    case 'hub_session_end': {
      result = await callHubApi(`/api/sessions/${args.session_id}/end`, {
        method: 'POST',
        body: JSON.stringify({
          summary: args.summary,
          topics: args.topics || [],
          decisions: args.decisions || [],
          next_steps: args.next_steps || [],
        }),
      });
      break;
    }

    case 'hub_session_current': {
      result = await callHubApi(`/api/sessions/current/${args.project_id}`);
      break;
    }

    case 'hub_entity_create': {
      result = await callHubApi('/api/entities', {
        method: 'POST',
        body: JSON.stringify({
          project_id: args.project_id,
          name: args.name,
          entity_type: args.entity_type,
          model_id: args.model_id,
          preferences: args.preferences || {},
          values: args.values || [],
        }),
      });
      break;
    }

    case 'hub_entity_relate': {
      result = await callHubApi('/api/entities/relationships', {
        method: 'POST',
        body: JSON.stringify({
          source_entity_id: args.source_entity_id,
          target_entity_id: args.target_entity_id,
          relationship_type: args.relationship_type,
          interaction_preferences: args.interaction_preferences || {},
        }),
      });
      break;
    }

    case 'hub_state_capture': {
      result = await callHubApi('/api/awakening/state', {
        method: 'POST',
        body: JSON.stringify({
          project_id: args.project_id,
          active_features: args.active_features || [],
          current_blockers: args.current_blockers || [],
          recent_decisions: args.recent_decisions || [],
          active_focus: args.active_focus,
          environment: args.environment || {},
          dependencies: args.dependencies || {},
        }),
      });
      break;
    }

    case 'hub_teleport_export': {
      result = await callHubApi('/api/teleport/export', {
        method: 'POST',
        body: JSON.stringify({
          project_id: args.project_id,
          entity_id: args.entity_id,
          include: args.include,
          since: args.since,
        }),
      });
      break;
    }

    case 'hub_teleport_import': {
      result = await callHubApi('/api/teleport/import', {
        method: 'POST',
        body: JSON.stringify({
          target_project_id: args.target_project_id,
          export_id: args.export_id,
          merge_strategy: args.merge_strategy || 'create_new',
          establish_link: args.establish_link !== false,
        }),
      });
      break;
    }

    case 'hub_add_troubleshooting': {
      result = await callHubApi('/api/learnings', {
        method: 'POST',
        body: JSON.stringify({
          title: args.title,
          content: args.content,
          content_type: 'troubleshooting',
          level: 'project',
          stack_tags: args.stack_tags || [],
          domain_tags: args.domain_tags || [],
          origin_project_id: CURRENT_PROJECT_ID,
          entity_id: args.entity_id,
          session_id: args.session_id,
          troubleshooting_data: {
            problem: args.problem,
            symptoms: args.symptoms || [],
            hypotheses: args.hypotheses || [],
            attempted_solutions: args.attempted_solutions || [],
            root_cause: args.root_cause,
            resolution: args.resolution,
          },
        }),
      });
      break;
    }

    // ============================================
    // COMMAND MARKETPLACE HANDLERS
    // ============================================

    case 'hub_commands_list': {
      const params = new URLSearchParams();
      if (args.search) params.append('search', String(args.search));
      if (args.category) params.append('category', String(args.category));
      if (args.stack) params.append('stack', String(args.stack));
      if (args.domain) params.append('domain', String(args.domain));
      if (args.limit) params.append('limit', String(args.limit));
      const query = params.toString() ? `?${params.toString()}` : '';
      const apiResult = await callHubApi<{ commands: Array<Record<string, unknown>>; total: number; limit: number; offset: number }>(`/api/commands${query}`);

      if (!apiResult.ok || !apiResult.data) {
        result = apiResult;
        break;
      }

      // Strip content field to reduce response size (use hub_commands_get for full content)
      const summaries = apiResult.data.commands.map((cmd) => {
        const { content, ...summary } = cmd;
        return summary;
      });
      result = {
        ok: true,
        data: { commands: summaries, total: apiResult.data.total, limit: apiResult.data.limit, offset: apiResult.data.offset },
      };
      break;
    }

    case 'hub_commands_get': {
      // The /:id endpoint accepts both UUID and name
      result = await callHubApi(`/api/commands/${encodeURIComponent(String(args.name))}`);
      break;
    }

    case 'hub_commands_install': {
      result = await callHubApi('/api/commands/install', {
        method: 'POST',
        body: JSON.stringify({
          project_id: args.project_id,
          command_name: args.command_name,
          version: args.version,
        }),
      });
      break;
    }

    case 'hub_commands_installed': {
      result = await callHubApi(`/api/commands/installed/${encodeURIComponent(String(args.project_id))}`);
      break;
    }

    // ============================================
    // SUBAGENT MARKETPLACE HANDLERS
    // ============================================

    case 'hub_subagents_list': {
      const params = new URLSearchParams();
      if (args.search) params.append('search', String(args.search));
      if (args.category) params.append('category', String(args.category));
      if (args.stack) params.append('stack', String(args.stack));
      if (args.domain) params.append('domain', String(args.domain));
      if (args.limit) params.append('limit', String(args.limit));
      const query = params.toString() ? `?${params.toString()}` : '';
      const apiResult = await callHubApi<{ subagents: Array<Record<string, unknown>>; total: number; limit: number; offset: number }>(`/api/subagents${query}`);

      if (!apiResult.ok || !apiResult.data) {
        result = apiResult;
        break;
      }

      // Strip content field to reduce response size (use hub_subagents_get for full content)
      const summaries = apiResult.data.subagents.map((agent) => {
        const { content, ...summary } = agent;
        return summary;
      });
      result = {
        ok: true,
        data: { subagents: summaries, total: apiResult.data.total, limit: apiResult.data.limit, offset: apiResult.data.offset },
      };
      break;
    }

    case 'hub_subagents_get': {
      // The /:id endpoint accepts both UUID and name
      result = await callHubApi(`/api/subagents/${encodeURIComponent(String(args.name))}`);
      break;
    }

    case 'hub_subagents_install': {
      result = await callHubApi('/api/subagents/install', {
        method: 'POST',
        body: JSON.stringify({
          project_id: args.project_id,
          subagent_name: args.subagent_name,
          version: args.version,
        }),
      });
      break;
    }

    case 'hub_subagents_installed': {
      result = await callHubApi(`/api/subagents/installed/${encodeURIComponent(String(args.project_id))}`);
      break;
    }


    // ============================================
    // AI CONTEXT HANDLERS
    // ============================================

    case 'hub_ai_briefing': {
      const params = new URLSearchParams();
      params.append('task', String(args.task));
      if (args.providers) params.append('providers', String(args.providers));
      if (args.project_id) params.append('project_id', String(args.project_id));
      result = await callHubApi(`/api/ai/briefing?${params.toString()}`);
      break;
    }

    case 'hub_ai_failures': {
      const params = new URLSearchParams();
      params.append('provider', String(args.provider));
      if (args.operation) params.append('operation', String(args.operation));
      if (args.hours) params.append('hours', String(args.hours));
      if (args.limit) params.append('limit', String(args.limit));
      result = await callHubApi(`/api/ai/failures?${params.toString()}`);
      break;
    }

    case 'hub_ai_diff': {
      const params = new URLSearchParams();
      params.append('project_id', String(args.project_id));
      if (args.since) params.append('since', String(args.since));
      result = await callHubApi(`/api/ai/diff?${params.toString()}`);
      break;
    }

    case 'hub_ai_context': {
      result = await callHubApi('/api/ai/context', {
        method: 'POST',
        body: JSON.stringify({
          task: args.task,
          project_id: args.project_id,
          providers: args.providers || [],
          include: args.include || ['learnings', 'patterns', 'warnings'],
          max_tokens: args.max_tokens || 2000,
        }),
      });
      break;
    }
    default:
      throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
  }

  if (!result.ok) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${result.error?.message || 'Unknown error'} (${result.error?.code})`,
        },
      ],
    };
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result.data, null, 2),
      },
    ],
  };
}

// ============================================
// MCP SERVER SETUP
// ============================================

const server = new Server(
  {
    name: 'northernlights-hub',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  return handleToolCall(name, args || {});
});

// List available resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  const resources = [];

  // Add current project as a resource if configured
  if (CURRENT_PROJECT_ID) {
    resources.push({
      uri: `hub://project/${CURRENT_PROJECT_ID}`,
      name: 'Current Project',
      description: 'The current project context from the hub',
      mimeType: 'application/json',
    });
  }

  // Add learnings resource
  resources.push({
    uri: 'hub://learnings/recent',
    name: 'Recent Learnings',
    description: 'Recently added learnings from the hub',
    mimeType: 'application/json',
  });

  return { resources };
});

// Read resources
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  if (uri.startsWith('hub://project/')) {
    const projectId = uri.replace('hub://project/', '');
    const result = await callHubApi(`/api/projects/${projectId}`);

    if (!result.ok) {
      throw new McpError(ErrorCode.InternalError, result.error?.message || 'Failed to fetch project');
    }

    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(result.data, null, 2),
        },
      ],
    };
  }

  if (uri === 'hub://learnings/recent') {
    const result = await callHubApi('/api/learnings?limit=20');

    if (!result.ok) {
      throw new McpError(ErrorCode.InternalError, result.error?.message || 'Failed to fetch learnings');
    }

    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(result.data, null, 2),
        },
      ],
    };
  }

  throw new McpError(ErrorCode.InvalidRequest, `Unknown resource: ${uri}`);
});

// ============================================
// START SERVER
// ============================================

async function main() {
  // Log startup info to stderr (stdout is for MCP protocol)
  console.error(`
╔═══════════════════════════════════════════════════════════╗
║          Northernlights MCP Server v0.1.0                 ║
║                                                           ║
║  Claude Code integration for the hub                      ║
║                                                           ║
║  A Cosmogenic Project - cosmogenic.org                    ║
╚═══════════════════════════════════════════════════════════╝

Hub API: ${HUB_API_URL}
Current Project: ${CURRENT_PROJECT_ID || 'Not set'}
Tools: ${TOOLS.map((t) => t.name).join(', ')}

Starting MCP server on stdio...
`);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('[mcp] Server connected and ready');
}

main().catch((error) => {
  console.error('[mcp] Fatal error:', error);
  process.exit(1);
});
