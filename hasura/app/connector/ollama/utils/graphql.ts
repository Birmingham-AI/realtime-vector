import { GRAPHQL_ENDPOINT } from "./constants";

export const ALL_COMMITS_IN_PR = `
  query ALL_COMMITS_IN_PR($prId: App_ObjectId!) {
    app_pullRequestsById(id: $prId) {
      commits {
        message
        description
      }
    }
  }
`;

export const COMMITS_BY_DEV = `
  query COMMITS_BY_DEV($developerEmail: App_Text!) {
  app_developerByEmail(email: $developerEmail) {
    commits {
      createdAt
      message
      description
      repository {
        name
      }
    }
  }
}
`;

export async function fetchCommits(prId: string) {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: ALL_COMMITS_IN_PR,
      variables: {
        prId,
      },
    }),
  });

  const jsonResponse: any = await response.json();
  return jsonResponse.data.app_pullRequestsById.commits;
}

export async function fetchMyCommits(developerEmail: string) {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: COMMITS_BY_DEV,
      variables: {
        developerEmail,
      },
    }),
  });

  const jsonResponse: any = await response.json();
  return jsonResponse.data.app_developerByEmail.commits;
}
