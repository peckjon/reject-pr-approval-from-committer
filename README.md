# Auto Approve By Committers GitHub Action

**Name:** `james-hu/auto-approve-by-committers-action`

This is a fork of `cognitedata/auto-approve-dependabot-action` which is in turn a fork of `hmarr/auto-approve-action`.

Automatically approve GitHub pull requests based on a whitelist of trusted committers.

PRs with only commits from trusted committers would be automatically approved by this action.
List of trusted committers can be specified in `trusted-committers`.

PRs with commits from non-trusted committers would be automatically unapproved by this action if there is an existing approval.
List of reviewers that this action is allowed to unapprove on behalf of can be specified in `manage-approvals-for-reviewers`.

The `GITHUB_TOKEN` secret must be provided as the `github-token` input for the action to work.

## Usage instructions

Create a workflow file (e.g. `.github/workflows/auto-approve.yml`) that contains a step that `uses: james-hu/auto-approve-by-committers-action@master`.
Here's an example workflow file:

```yaml
name: Auto approve PRs

# Trigger the workflow on pull request
on: pull_request_target

jobs:
  autoapprove:
    name: Auto-Approve a PR by dependabot
    runs-on: ubuntu-latest
    steps:
      - name: Auto approve
        uses: james-hu/auto-approve-by-committers-action@master
        if: github.actor == 'dependabot[bot]' || github.actor == 'dependabot-preview[bot]' # this is optional
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          trusted-committers: dependabot[bot], github-actions[bot], james-hu  # optional, default to "dependabot[bot],dependabot-preview[bot]"
          manage-approvals-for-reviewers: dependabot[bot]  # optional, default to "github-actions[bot]"
```

## Why?

GitHub lets you prevent merges of unapproved pull requests. However, it's occasionally useful to selectively circumvent this restriction - for instance, some people want Dependabot's automated pull requests to not require approval.

Also, in some repos, there are workflows creating PRs with different credentials.
It would be convenient to specify which committers are trusted for auto approval.
