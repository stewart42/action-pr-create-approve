import * as core from '@actions/core'
import {context, getOctokit} from '@actions/github'
import {inspect} from 'util'

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

    const pullsListResponse = await octokit.pulls.list({
      owner,
      repo,
      state: 'open'
    })

    const existingPull = pullsListResponse.data.find(
      pull => pull.title === title
    )

    let pr: {
      number: number
      mergeable?: boolean
    }

    if (existingPull) {
      core.info(`Existing PR : ${existingPull.number}`)
      pr = existingPull
    } else {
      const response = await octokit.pulls.create({
        owner,
        repo,
        title,
        head,
        base
      })

      pr = response.data
      core.info(`Created PR: ${pr.number}`)
    }

    await octokit.pulls.createReview({
      owner,
      repo,
      pull_number: pr.number,
      event: 'APPROVE',
      commit_id: context.sha
    })

    core.info(`Approved PR: ${pr.number}`)

    if (pr.mergeable) {
      await octokit.pulls.merge({
        owner,
        repo,
        pull_number: pr.number,
        merge_method: 'squash'
      })
    }

    core.setOutput('pull_number', pr.number.toString())
  } catch (error) {
    core.setFailed(error.message)
    core.info(inspect(error))
  }
}

run()
