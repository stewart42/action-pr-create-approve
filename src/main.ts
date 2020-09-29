import * as core from '@actions/core'
import {context, getOctokit} from '@actions/github'

async function run(): Promise<void> {
  try {
    core.info('Validating')

    const token = core.getInput('GITHUB_TOKEN', {required: true})
    const title = core.getInput('title', {required: true})
    const head = core.getInput('head', {required: true})
    const base = core.getInput('base', {required: true})

    const {owner, repo} = context.repo
    core.debug(`owner: ${owner} repo: ${repo}`)

    const octokit = getOctokit(token)
    const response = await octokit.pulls.create({
      owner,
      repo,
      title,
      head,
      base
    })

    const pull_number = response.data.id
    core.info(`Created PR: ${pull_number}`)

    await octokit.pulls.createReview({
      owner,
      repo,
      pull_number,
      event: 'APPROVE'
    })

    core.info(`Approved PR: ${pull_number}`)

    if (response.data.mergeable) {
      await octokit.pulls.merge({
        owner,
        repo,
        pull_number,
        merge_method: 'squash'
      })
    }

    core.setOutput('pull_number', pull_number.toString())
  } catch (error) {
    core.debug(error)
    core.setFailed(error.message)
  }
}

run()
