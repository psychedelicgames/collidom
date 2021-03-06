/**
 * This class handles the rendering and updating of the leaderboard.
 * @author alvin.lin.dev@gmail.com (Alvin Lin)
 */

/**
 * Constructor for the Leaderboard object.
 * @constructor
 * @param {Element} element The container element of the leaderboard. This
 *   element should be an unordered list.
 */
function Leaderboard(element) {
  this.element = element;

  /**
   * @type {Array<Object>}
   */
  this.players = [];
}

/**
 * Factory method for a Leaderboard object.
 * @param {Element} element The container element of the leaderboard. This
 *   element should be an unordered list.
 * @return {Leaderboard}
 */
Leaderboard.create = function(element) {
  return new Leaderboard(element);
};

/**
 * Updates the leaderboard.
 * @param {Array.<Object>} players A sorted array of the top ten players.
 */
Leaderboard.prototype.update = function(players) {
  this.players = players;

  while (this.element.firstChild) {
    this.element.removeChild(this.element.firstChild);
  }

  for (var i = 0; i < this.players.length; ++i) {
    var playerRow = document.createElement('tr');

    var playerScore = document.createElement('td');
    // playerScore.appendChild(document.createTextNode(this.players[i]['score']));
    playerScore.appendChild(document.createTextNode("#" + i));

    var playerName = document.createElement('td');
    playerName.appendChild(document.createTextNode(this.players[i]['name']));

    var playerKills = document.createElement('td');
    playerKills.appendChild(document.createTextNode(this.players[i]['kills']));

    var playerDeaths = document.createElement('td');
    playerDeaths.appendChild(document.createTextNode(this.players[i]['deaths']));

    var playerBtc = document.createElement('td');
    playerBtc.appendChild(document.createTextNode('btc'));

    playerRow.appendChild(playerScore);
    playerRow.appendChild(playerName);
    playerRow.appendChild(playerKills);
    playerRow.appendChild(playerDeaths);
    playerRow.appendChild(playerBtc);
    this.element.appendChild(playerRow);
  }
};
