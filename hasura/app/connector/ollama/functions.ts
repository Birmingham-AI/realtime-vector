import { ollama } from "./utils/ollama";
import { fetchCommits, fetchMyCommits, fetchCommitsByRepo } from "./utils/graphql";

/**
 * @readonly Exposes the function as an NDC function (the function should only query data without making modifications)
 */
export async function summarizePR(prId: string) {
  const commits = await fetchCommits(prId);

  const prompt = `The following set of commits create a single PR. Create a tl;dr that's no longer than two sentences explaining the changes. Your output should only be the tl;dr. Here are the commits: ${JSON.stringify(
    commits
  )}`;

  const llmResponse = await ollama.chat({
    model: "llama3.1",
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    stream: false,
  });

  return llmResponse.message.content;
}

/**
 * @readonly
 */
export async function summarizeMyWork(developerEmail: string) {
  const commits = await fetchMyCommits(developerEmail);

  const prompt = `You're an engineering manager giving direct feedback to a self-conscious new hire. Critique their recent commits in no more than four sentences. Your feedback should be straightforward and constructive, with no introduction or extra phrases. Here are their commits: ${JSON.stringify(
    commits
  )}`;

  const llmResponse = await ollama.chat({
    model: "llama3.1",
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    stream: false,
  });

  return llmResponse.message.content;
}

/**
 * @readonly
 */
export async function summarizeMyImpact(developerEmail: string) {
  const commits = await fetchMyCommits(developerEmail);

  const prompt = `You're a data analyst assisting a team of engineering managers. You'll be provided a list of commits to different repositories for a particular engineer. Summarize the engineer's contributions in paragraph format. Your feedback should be straightforward and include an analysis of the engineer's impact. Here are their commits: ${JSON.stringify(
    commits
  )}`;

  const llmResponse = await ollama.chat({
    model: "llama3.1",
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    stream: false,
  });

  return llmResponse.message.content;
}

/**
 * @readonly
 */
export async function writeReleaseNotes(repoName: string) {
  const commits = await fetchCommitsByRepo(repoName);

  const prompt = `Below is a list of git commits made to a git repository for version v4.2.0. Write release notes in markdown format. Categorize the commits by either bug fixes, improvements, or new features. Summarize the changes without simply listing the commits themselves. Include a section at the bottom of the document thanking the authors who contributed to this release. Provide the release notes document only, with no additional exposition.
${JSON.stringify(commits)}`;

  const llmResponse = await ollama.chat({
    model: "llama3.1",
    messages: [
      {
        role: "system",
        content: "You are an expert software release engineer who specializes in authoring release notes.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    stream: false,
  });

  return llmResponse.message.content;
}
