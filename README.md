# Auto Approve GitHub Dependabot Action

**Name:** `cognitedata/auto-approve-dependabot-action`

This is a fork of `hmarr/auto-approve-action`.

Automatically approve GitHub pull requests. The `GITHUB_TOKEN` secret must be provided as the `github-token` input for the action to work.

## Usage instructions

Create a workflow file (e.g. `.github/workflows/auto-approve.yml`) that contains a step that `uses: cognitedata/auto-approve-dependabot-action@v3.0.1`. Here's an example workflow file:

```yaml
name: Auto approve PRs by dependabot

# Trigger the workflow on pull request
on: pull_request_target

jobs:
  autoapprove:
    name: Auto-Approve a PR by dependabot
    runs-on: ubuntu-latest
    steps:
      - name: Auto approve
        uses: cognitedata/auto-approve-dependabot-action@v3.0.1
        if: github.actor == 'dependabot[bot]' || github.actor == 'dependabot-preview[bot]'
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

## Why?

GitHub lets you prevent merges of unapproved pull requests. However, it's occasionally useful to selectively circumvent this restriction - for instance, some people want Dependabot's automated pull requests to not require approval.

[dependabot]: https://github.com/marketplace/dependabot
