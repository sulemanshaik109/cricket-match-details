const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//Get Players API

app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    SELECT
      *
    FROM
      player_details
    ORDER BY
      player_id;`;
  const playersArray = await db.all(getPlayersQuery);
  const ans = (playersArray) => {
    return {
      playerId: playersArray.player_id,
      playerName: playersArray.player_name,
    };
  };
  response.send(playersArray.map((eachPlayer) => ans(eachPlayer)));
});

//Get Player API

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT
      *
    FROM
      player_details
    WHERE
      player_id = ${playerId};`;
  const player = await db.get(getPlayerQuery);
  const ans = (player) => {
    return {
      playerId: player.player_id,
      playerName: player.player_name,
    };
  };
  response.send(ans(player));
});

//Update player API

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const updatePlayerQuery = `
    UPDATE
      player_details
    SET
      player_name='${playerName}'
    WHERE
      player_id = ${playerId};`;
  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//Get Match API

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    SELECT
      *
    FROM
      match_details
    WHERE
      match_id = ${matchId};`;
  const match = await db.get(getMatchQuery);
  const ans = (match) => {
    return {
      matchId: match.match_id,
      match: match.match,
      year: match.year,
    };
  };
  response.send(ans(match));
});

//Get Specific Player's Matches API

app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getMatchesQuery = `
    SELECT
      *
    FROM
      player_match_score
        NATURAL JOIN match_details
    WHERE
      player_id = ${playerId};`;
  const matchesArray = await db.all(getMatchesQuery);
  const ans = (matchesArray) => {
    return {
      matchId: matchesArray.match_id,
      match: matchesArray.match,
      year: matchesArray.year,
    };
  };
  response.send(matchesArray.map((eachMatch) => ans(eachMatch)));
});

//Get Players of Specific Match API

app.get("/matches/:matchId/players/", async (request, response) => {
  const { matchId } = request.params;
  const getPlayersQuery = `
    SELECT
      *
    FROM
      player_match_score
        NATURAL JOIN player_details
    WHERE
      match_id = ${matchId};`;
  const playersArray = await db.all(getPlayersQuery);
  const ans = (playersArray) => {
    return {
      playerId: playersArray.player_id,
      playerName: playersArray.player_name,
    };
  };
  response.send(playersArray.map((eachPlayer) => ans(eachPlayer)));
});

//Get Statistics of Specific Player API

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerStatsQuery = `
    SELECT
      player_details.player_id AS playerId,
      player_details.player_name AS playerName,
      SUM(player_match_score.score) AS totalScore,
      SUM(player_match_score.fours) AS totalFours,
      SUM(player_match_score.sixes) AS totalSixes 
    FROM 
      player_details 
        INNER JOIN player_match_score ON
        player_details.player_id = player_match_score.player_id
    WHERE 
      player_details.player_id = ${playerId};
    `;
  const playerStats = await db.get(getPlayerStatsQuery);
  response.send(playerStats);
});

module.exports = app;
