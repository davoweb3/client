/* eslint-disable react/prop-types */
import React from 'react'
import BN from 'bn.js'
import {
  ClaimDomainScreen,
  KnownAppBadge,
  ReviewScreen,
  TokensScreen,
  VotingScreen,
} from '../kit'

import header from './header.svg'
import icon from './icon.svg'

function completeDomain(domain) {
  return domain ? `${domain}.aragonid.eth` : ''
}

function adjustVotingSettings(support, quorum) {
  // The max value for both support and quorum is 100% - 1
  const onePercent = new BN(10).pow(new BN(16))
  const hundredPercent = onePercent.mul(new BN(100))

  let adjustedSupport = onePercent.mul(new BN(support))
  if (adjustedSupport.eq(hundredPercent)) {
    adjustedSupport = adjustedSupport.sub(new BN(1))
  }

  let adjustedQuorum = onePercent.mul(new BN(quorum))
  if (adjustedQuorum.eq(hundredPercent)) {
    adjustedQuorum = adjustedQuorum.sub(new BN(1))
  }

  return [adjustedSupport.toString(), adjustedQuorum.toString()]
}

export default {
  id: 'membership-template.aragonpm.eth',
  name: 'Membership',
  header,
  icon,
  description: `
    Use a non-transferable token to represent membership. Decisions are
    made based on one-member-one-vote governance.
  `,
  userGuideUrl:
    'https://help.aragon.org/article/34-create-a-new-membership-organization',
  sourceCodeUrl:
    'https://github.com/aragon/dao-templates/tree/templates-membership-v1.0.0/templates/membership',
  registry: 'aragonpm.eth',
  apps: [
    { appName: 'voting.aragonpm.eth', label: 'Votar' },
    { appName: 'token-manager.aragonpm.eth', label: 'Tokens' },
    { appName: 'finance.aragonpm.eth', label: 'Finanzas' },
  ],
  optionalApps: [{ appName: 'agent.aragonpm.eth', label: 'Agent' }],
  screens: [
    [
      data => completeDomain(data.domain) || 'Claim domain',
      props => <ClaimDomainScreen screenProps={props} />,
    ],
    ['Configure template', props => <VotingScreen screenProps={props} />],
    [
      'Configure template',
      props => <TokensScreen screenProps={props} accountStake={1} />,
    ],
    [
      'Review information',
      props => {
        const { domain, voting, tokens } = props.data
        return (
          <ReviewScreen
            screenProps={props}
            items={[
              {
                label: 'General info',
                fields: [
                  ['Organization template', 'Membership'],
                  ['Name', completeDomain(domain)],
                ],
              },
              {
                label: (
                  <KnownAppBadge appName="voting.aragonpm.eth" label="Votar" />
                ),
                fields: VotingScreen.formatReviewFields(voting),
              },
              {
                label: (
                  <KnownAppBadge
                    appName="token-manager.aragonpm.eth"
                    label="Tokens"
                  />
                ),
                fields: TokensScreen.formatReviewFields(tokens),
              },
            ]}
          />
        )
      },
    ],
  ],
  prepareTransactions(createTx, data, networkType) {
    const financePeriod = 0 // default
    const hasPayroll = false

    const { domain, optionalApps = [], tokens, voting } = data
    const useAgentAsVault = optionalApps.includes('agent.aragonpm.eth')

    const { tokenName, tokenSymbol, members } = tokens
    const accounts = members.map(([account]) => account)

    const { support, quorum, duration } = voting
    const [adjustedSupport, adjustedQuorum] = adjustVotingSettings(
      support,
      quorum
    )
    const adjustedDuration = new BN(duration).toString()
    const votingSettings = [adjustedSupport, adjustedQuorum, adjustedDuration]

    if (!hasPayroll) {
      return [
        {
          name: 'Create organization',
          transaction: createTx('newTokenAndInstance', [
            tokenName,
            tokenSymbol,
            domain,
            accounts,
            votingSettings,
            financePeriod,
            useAgentAsVault,
          ]),
        },
      ]
    }

    return [
      {
        name: 'Create token',
        transaction: createTx('newToken', [tokenName, tokenSymbol]),
      },
      {
        name: 'Create organization',
        transaction: createTx('newInstance', [
          domain,
          accounts,
          votingSettings,
          financePeriod,
          useAgentAsVault,
        ]),
      },
    ]
  },
}
