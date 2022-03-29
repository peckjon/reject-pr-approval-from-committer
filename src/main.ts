import * as core from '@actions/core';
import * as github from '@actions/github';

async function all_committers_allowed(config, client: any, pr: any) {
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
    // Check if there are committers other than those in trustedCommitters
    if (!config.trustedCommitters[commit.author.login]) {
      core.info(
        `Commit ${commit.sha} made by ${commit.author.login} is not from trusted committers (${JSON.stringify(Object.keys(config.trustedCommitters))})`
      );
      // Remove approvals by dependabot if any
      await remove_dependabot_approvals(config, client, pr);
      return false;
    }
  }
  return true;
}

async function remove_dependabot_approvals(config, client: any, pr: any) {
  // Get list of all reviews on a PR
  const { data: listReviews } = await client.pulls.listReviews({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    pull_number: pr.number,
  });

  // Check if there is an approval by those in manageApprovalsForRevewers
  for (let review of listReviews) {
    if (config.manageApprovalsForRevewers[review.user.login] && review.state === `APPROVED`) {
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

    const config = {
      trustedCommitters: core.getInput('trusted-committers').split(/,\s*/).reduce(
        (acc, name) => ({ ...acc, [name]: true }),
        {}
      ),
      manageApprovalsForRevewers: core.getInput('manage-approvals-for-reviewers').split(/,\s*/).reduce(
        (acc, name) => ({ ...acc, [name]: true }),
        {}
      ),
    };

    const { pull_request: pr } = github.context.payload;
    if (!pr) {
      throw new Error('Event payload missing `pull_request`');
    }

    const client = new github.GitHub(token);

    if (!(await all_committers_allowed(config, client, pr))) return;

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
