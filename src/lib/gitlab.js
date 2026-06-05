/**
 * Minimal GitLab REST API client.
 *
 * Docs: https://docs.gitlab.com/ee/api/pipelines.html
 *
 * Only read-only endpoints are used. The personal access token only needs
 * the `read_api` scope — do not grant anything wider.
 */

const DEFAULT_PER_PAGE = 20;

/**
 * @typedef {Object} GitLabConfig
 * @property {string} baseUrl  e.g. "https://gitlab.com" or your self-hosted host
 * @property {string} token    personal access token with `read_api` scope
 */

/**
 * Read stored config from chrome.storage.local.
 * @returns {Promise<GitLabConfig & { projectIds: number[] }>}
 */
export async function getConfig() {
  const { baseUrl, token, projectIds } = await chrome.storage.local.get([
    "baseUrl",
    "token",
    "projectIds",
  ]);
  return {
    baseUrl: (baseUrl || "https://gitlab.com").replace(/\/$/, ""),
    token: token || "",
    projectIds: Array.isArray(projectIds) ? projectIds : [],
  };
}

/**
 * Low-level fetch wrapper. Never logs the token.
 * @param {GitLabConfig} cfg
 * @param {string} path  API path beginning with /api/v4/...
 * @param {Record<string, string|number>} [params]
 */
async function apiGet(cfg, path, params = {}) {
  const url = new URL(`${cfg.baseUrl}/api/v4${path}`);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, String(v));
  }

  const res = await fetch(url, {
    headers: { "PRIVATE-TOKEN": cfg.token },
  });

  if (!res.ok) {
    // Surface a useful message without leaking the token or full URL params.
    throw new Error(`GitLab API ${res.status} ${res.statusText} on ${path}`);
  }
  return res.json();
}

/**
 * List recent pipelines for a project, optionally filtered by status.
 * @param {GitLabConfig} cfg
 * @param {number} projectId
 * @param {{ status?: "failed"|"success"|"running"|"canceled", perPage?: number }} [opts]
 */
export async function listPipelines(cfg, projectId, opts = {}) {
  const params = {
    per_page: opts.perPage ?? DEFAULT_PER_PAGE,
    order_by: "updated_at",
    sort: "desc",
  };
  if (opts.status) params.status = opts.status;
  return apiGet(cfg, `/projects/${projectId}/pipelines`, params);
}

/**
 * Fetch the jobs of a pipeline (handy for showing *which* stage broke).
 * @param {GitLabConfig} cfg
 * @param {number} projectId
 * @param {number} pipelineId
 */
export async function listPipelineJobs(cfg, projectId, pipelineId) {
  return apiGet(cfg, `/projects/${projectId}/pipelines/${pipelineId}/jobs`, {
    per_page: 100,
  });
}

/**
 * Resolve basic project metadata (name, web_url) for display.
 * @param {GitLabConfig} cfg
 * @param {number} projectId
 */
export async function getProject(cfg, projectId) {
  return apiGet(cfg, `/projects/${projectId}`);
}

/**
 * Convenience: fetch the latest failed pipelines across all configured projects.
 * Returns a flat array enriched with the project name.
 * @param {GitLabConfig & { projectIds: number[] }} cfg
 */
export async function getFailuresAcrossProjects(cfg) {
  const results = await Promise.allSettled(
    cfg.projectIds.map(async (projectId) => {
      const [project, pipelines] = await Promise.all([
        getProject(cfg, projectId),
        listPipelines(cfg, projectId, { status: "failed", perPage: 5 }),
      ]);
      return pipelines.map((p) => ({
        projectId,
        projectName: project.name_with_namespace ?? project.name,
        ...p,
      }));
    })
  );

  return results
    .filter((r) => r.status === "fulfilled")
    .flatMap((r) => r.value);
}
