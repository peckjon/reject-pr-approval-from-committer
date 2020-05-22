import * as core from '@actions/core';
import * as github from '@actions/github';

const ALLOWED_NAMES = ['dependabot[bot]', 'dependabot-preview[bot]'].reduce(
  (acc, name) => ({ ...acc, [name]: true }),
  {}
);

async function run() {
  try {
    const token = core.getInput('github-token', { required: true });

    const {
      actor,
      payload: { pull_request: pr },
    } = github.context;
    if (!pr) {
      throw new Error('Event payload missing `pull_request`');
    }

    core.info(`PR #${pr.number} opened from ${actor}`);

    if (!ALLOWED_NAMES[actor]) {
      core.info(`PR #${pr.number} is not from an approved source (${actor})`);
      return;
    }

    const client = new github.GitHub(token);
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
