import * as core from '@actions/core';
import * as github from '@actions/github';

type GitHub = ReturnType<typeof github.getOctokit>;

async function removeExistingApprovalsIfExist(client: GitHub, pr: any) {
  // Get list of all reviews on a PR
  const { data: listReviews } = await client.rest.pulls.listReviews({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    pull_number: pr.number,
  });

  // Get list of all commits to the PR
  const { data: listCommits } = await client.rest.pulls.listCommits({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    pull_number: pr.number,
  });

  // List logins of all commit authors on the PR
  var commitAuthorLogins = listCommits.map(function (commit) {
    return commit.author?.login;
  });

  // Remove PR approvals by any committer to the PR
  for (let review of listReviews) {
    core.info(`review.user.login: ${review.user?.login}`);
    core.info(`commitAuthorLogins: ${commitAuthorLogins}`);
    if (review.user && commitAuthorLogins.includes(review.user.login)) {
      core.info(
        `Removing an approval from ${review.user?.login} (cannot approve this PR since they committed to it)`
      );
      core.info(`review.body: ${review.body}`);
      if (review.body.length > 0) {
        core.info(
          `Moving review comment to a new comment in order to dismiss review.`
        );
        const { data: submitReview } = await client.rest.pulls.submitReview({
          owner: github.context.repo.owner,
          repo: github.context.repo.repo,
          pull_number: pr.number,
          review_id: review.id,
          body: `Moving review comment by ${review.user?.login} to a new comment in order to dismiss review:\n\nreview.body`,
          event: 'COMMENT',
        });
        core.debug(`submitReview: ${JSON.stringify(submitReview)}`);
        const { data: updateReview } = await client.rest.pulls.updateReview({
          owner: github.context.repo.owner,
          repo: github.context.repo.repo,
          pull_number: pr.number,
          review_id: review.id,
          body: '',
        });
        core.debug(`updateReview: ${JSON.stringify(updateReview)}`);
      }
      const dismissResponse = await client.rest.pulls.dismissReview({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        pull_number: pr.number,
        review_id: review.id,
        message: `${review.user?.login} cannot approve this PR since they committed to it`,
      });
      core.debug(`dismissResponse: ${JSON.stringify(dismissResponse)}`);
      core.setFailed(
        `${review.user?.login} cannot approve this PR since they committed to it`
      );
    }
  }
}

async function run() {
  try {
    const token = core.getInput('github-token', { required: true });

    const { pull_request: pr } = github.context.payload;
    if (!pr) {
      throw new Error(
        'Event payload missing `pull_request` - workflow containing this action is supposed to be triggered by `pull_request` or `pull_request_target` event'
      );
    }

    const client = github.getOctokit(token);

    await removeExistingApprovalsIfExist(client, pr);
  } catch (error) {
    core.setFailed((error as Error).message);
  }
}

run();
