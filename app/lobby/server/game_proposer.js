GameProposer = class GameProposer {

  constructor(player_ids, exclusions) {
    this.players = this.find_players(player_ids)
    this.exclusions = exclusions
  }

  propose() {
    this.select_cards()
    this.proposal_id = this.create_proposal()
    this.update_players()
    this.set_proposal_timeout()
  }

  create_proposal(proposal_cards) {
    return ProposalModel.insert({
      proposer: {
        id: Meteor.userId(),
        username: Meteor.user().username
      },
      players: this.players,
      cards: this.cards,
      exclusions: this.exclusions
    })
  }

  select_cards() {
    card_list = new CardList(this.exclusions)
    // this.cards = card_list.pull_set()
    this.cards = card_list.pull_from_history('qT4SmZifZJnSLQXyn')
  }

  update_players() {
    _.each(this.players, function(player) {
      Meteor.users.update(player._id, {
        $set: {has_proposal: true},
        $unset: {declined_proposal: ''}
      })
    })
  }

  set_proposal_timeout() {
    Meteor.setTimeout(() => {
      if (ProposalModel.findOne(this.proposal_id)) {
        let proposal_decliner = new ProposalDecliner(this.proposal_id)
        proposal_decliner.timeout_decline()
      }
    }, 30000)
  }

  find_players(player_ids) {
    player_ids.push(Meteor.userId())
    return Meteor.users.find({_id: {$in: player_ids}}).fetch()
  }
}
