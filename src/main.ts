import * as core from '@actions/core';
import * as github from '@actions/github';

let ALLOWED_COMMITTERS = {};

let ALLOWED_REVIEWERS = {};

async function all_committers_allowed(client: any, pr: any) {
  // Get a pull request
  const { data: pullRequest } = await client.pulls.get({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    pull_number: pr.number,
  });

  // Get creator of PR
  const pr_user = pullRequest.user.login;

  core.info(`PR #${pr.number} opened from ${pr_user}`);

  // Get list of commits on a PR
  const { data: listCommits } = await client.pulls.listCommits({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    pull_number: pr.number,
  });

  // Get all committers on a PR
  for (let commit of listCommits) {
    // Check if there are committers other than ALLOWED_COMMITTERS
    if (!ALLOWED_COMMITTERS[commit.author.login]) {
      core.info(
        `Commit ${commit.sha} is not from an approved source (${commit.author.login})`
      );
      // Remove approvals by dependabot if any
      await remove_dependabot_approvals(client, pr);
      return false;
    }
  }
  return true;
}

async function remove_dependabot_approvals(client: any, pr: any) {
  // Get list of all reviews on a PR
  const { data: listReviews } = await client.pulls.listReviews({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    pull_number: pr.number,
  });

  // Check if there is an approval by ALLOWED_REVIEWERS
  for (let review of listReviews) {
    if (ALLOWED_REVIEWERS[review.user.login] && review.state === `APPROVED`) {
      core.info(`Removing an approval from ${review.user.login}`);
      await client.pulls.dismissReview({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        pull_number: pr.number,
        review_id: review.id,
        message: `A commit was added after a dependabot approval`,
      });
    }
  }
}

async function run() {
  try {
    const token = core.getInput('github-token', { required: true });

    ALLOWED_COMMITTERS = core.getInput('trusted-committers').split(/, */).reduce(
      (acc, name) => ({ ...acc, [name]: true }),
      {}
    );
    ALLOWED_REVIEWERS = core.getInput('manage-approvals-for-reviewers').split(/, */).reduce(
      (acc, name) => ({ ...acc, [name]: true }),
      {}
    );

    const { pull_request: pr } = github.context.payload;
    if (!pr) {
      throw new Error('Event payload missing `pull_request`');
    }

    const client = new github.GitHub(token);

    if (!(await all_committers_allowed(client, pr))) return;

    core.debug(`Creating approving review for pull request #${pr.number}`);
    await client.pulls.createReview({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      pull_number: pr.number,
      event: 'APPROVE',
    });
    core.info(`Approved pull request #${pr.number}`);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
