Meteor.subscribe('lobby_players')
Meteor.subscribe('proposal')

Template.lobby.onCreated(function() {
  let stream_register = new LobbyStreamRegister()
  stream_register.register()
})
Template.lobby.onRendered(trackProposalStatus)

Template.lobby.helpers({
  lobby_players: function () {
    return Meteor.users.find({_id: {$ne: Meteor.userId()}})
  },
  proposal: function () {
    return Proposals.findOne({}, {
      transform: function(proposal) {
        proposal.is_proposer = proposal.proposer.id == Meteor.userId()
        return proposal
      }
    })
  }
})

Template.lobby.events({
  "submit #chat": sendMessage,
  "submit #lobby": proposeGame,
  "click #decline-proposal": declineProposal
})

function trackProposalStatus() {
  Tracker.autorun(function () {
    let proposal = Proposals.findOne()
    if (proposal) {
      $('#proposal-message').empty()
      $('#propose-game').hide()
    } else {
      $('#propose-game').show()
    }
  })
}

function sendMessage(event) {
  event.preventDefault()
  Streamy.broadcast('lobby_message', {
    username: Meteor.user().username,
    message: event.target.message.value
  })
  event.target.message.value = ''
}

function proposeGame(event) {
  event.preventDefault()

  player_ids = $('.lobby-player:checked').map(function() {
    return $(this).val()
  }).get()

  if (player_ids.count > 3)
    alert('Game can not have more than 4 players.')

  Meteor.call('proposeGame', player_ids)
}

function declineProposal(event) {
  event.preventDefault()
  Meteor.call('declineProposal', $('#proposal_id').val())
}
