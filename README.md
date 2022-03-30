# GitHub Action: Conditionally approve the PR if all commits are made by trusted committers

**Name:** `handy-common-utils/conditionally-approve-pr-from-trusted-committers`

(This is a fork of `cognitedata/auto-approve-dependabot-action` which is in turn a fork of `hmarr/auto-approve-action`.)

Approve GitHub pull request if all commits in the PR are made by users on a configurable whitelist of trusted committers.
When used together with auto-merge feature, fully automated CI/CD could be easily achieved.

PRs with only commits made by trusted committers would be automatically approved by this action.
List of trusted committers can be specified in `trusted-committers`.

PRs with commits made by committers not on the whitelist would be automatically unapproved by this action if there is an existing approval.
List of reviewers that this action is allowed to unapprove on behalf of can be specified in `manage-approvals-for-reviewers`.

The `GITHUB_TOKEN` secret or a PAT must be provided as the `github-token` input for the action to work.
Since GitHub does not allow an user approving his/her own PRs,
you need to make sure that the credential used by this action is not the same as the credential used for opening the PR.

## Usage instructions

Create a workflow file (e.g. `.github/workflows/auto-approve.yml`) that contains a step 
that has `uses: handy-common-utils/conditionally-approve-pr-from-trusted-committers`.

Here's an example workflow file:

```yaml
name: Auto approve trusted PR

on:
  pull_request_target:
    branches:    
      - master
      - main
      - develop

jobs:
  autoapprove:
    name: Auto approve trusted PR
    runs-on: ubuntu-latest
    steps:
      - name: Auto approve
        uses: handy-common-utils/conditionally-approve-pr-from-trusted-committers@master
        if: github.actor == 'dependabot[bot]' || github.actor == 'dependabot-preview[bot]' # this is optional
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }} # required, feel free to use another PAT
          trusted-committers: dependabot[bot], github-actions[bot], james-hu  # optional, default to "dependabot[bot],dependabot-preview[bot]"
          manage-approvals-for-reviewers: github-actions[bot]  # optional, default to "github-actions[bot]"
```

## Why?

GitHub lets you prevent merges of unapproved pull requests. However, it's occasionally useful to selectively circumvent this restriction - for instance, some people want Dependabot's automated pull requests to not require manual approval.

Also, in some repos, there are workflows creating PRs with credentials different from `dependabot[bot]`.
It would be convenient to have the capability of specifying which committers are trusted for auto approval.
