import { HelixUser } from "@twurple/api";
import { word_game } from "../db/schema";
import {
  createWordGame,
  endWordGame,
  getWordGame,
  letterRevealed,
  setGuesser,
} from "../db/wordgame";
import { ChatUser } from "@twurple/chat";
import { Packets } from "./Socket";
import { client, reply, websocket } from "..";
import { userModel } from "../models/user";

export class WordGame {
  interval: NodeJS.Timeout;
  wordLength: number;
  hiddenLetters: number;
  revealedPart: string;
  word: string;
  dbGame: typeof word_game.$inferInsert;
  broadcast: <T extends keyof Packets>(
    packet: T,
    data: Packets[T],
  ) => Promise<void> | void;

  readonly GAME_LENGTH_MS = 180 * 1000;
  readonly FIRST_HINT_MS = 50 * 1000;
  readonly SUBSEQUENT_HINT_MS = 40 * 1000;
  readonly STARTING_HINT_COUNT = 2;

  constructor(
    word: string | null,
    broadcastFn: <T extends keyof Packets>(
      packet: T,
      data: Packets[T],
    ) => Promise<void> | void,
    initGame: typeof word_game.$inferInsert | null,
  ) {
    this.wordLength = 6;
    this.hiddenLetters = this.wordLength;
    this.revealedPart = initGame ? initGame.revealed_part : "";
    this.word = initGame ? initGame.word : word.toLowerCase().trim();
    this.broadcast = broadcastFn;
    const sockets = websocket.getSockets();
    if (!broadcastFn)
      this.broadcast = (command, data) => {
        try {
          for (const socketId of sockets.keys()) {
            sockets.get(socketId).send(websocket.createPacket(command, data));
          }
        } catch (e) {
          console.log("PACKET BROADCAST FAILED", e);
        }
      };
  }

  getGame() {
    return this.dbGame;
  }

  async startGame() {
    this.dbGame = getWordGame() || createWordGame(this.word);
    this.interval = setInterval(async () => {
      try {
        await this.tick();
      } catch (e) {
        console.log("GAME TICK FAILED", e);
      }
    }, 1000);
  }

  async endGame(winner: ChatUser | null) {
    let game = this.getGame();

    let total_guesses = 0;

    if (winner) {
      setGuesser(winner.userId, winner.displayName);
      this.dbGame = getWordGame();
      game = this.dbGame;
      let word = game.word;
      let revealed = game.revealed_part;
      let points = 0;
      let dbUser = await userModel.findOne({ twitchId: winner.userId });

      let percentage = Math.floor((revealed.length / word.length) * 100);
      if (percentage <= 50) {
        points = Math.max(
          Math.round(Math.random() * 250),
          Math.round(Math.random() * 250),
          Math.round(Math.random() * 250),
        );
      } else if (percentage <= 60) {
        points = Math.max(
          Math.round(Math.random() * 100),
          Math.round(Math.random() * 100),
          Math.round(Math.random() * 100),
        );
      } else
        points = Math.max(
          Math.round(Math.random() * 50),
          Math.round(Math.random() * 50),
        );

      if (points > 0 && dbUser) {
        dbUser.set("points", (dbUser?.points || 0) + points);
      }

      dbUser.set("word_guesses", (dbUser?.word_guesses || 0) + 1);

      dbUser = await dbUser.save();

      total_guesses = dbUser.word_guesses;

      this.broadcast("wordGameEnded", {
        game: getWordGame(),
        winner_total_guesses: total_guesses || 0,
      });

      reply(
        client,
        winner.displayName,
        `@${winner.displayName} guessed "${game.word}" (x${total_guesses}) ${points > 0 ? ` (+${points}pts)` : ""}`,
      );
      endWordGame();
      clearInterval(this.interval);
    } else {
      this.broadcast("wordGameEnded", {
        game: getWordGame(),
        winner_total_guesses: 0,
      });
    }
  }

  revealLetter() {
    const game = getWordGame();
    this.dbGame = game;

    let nextLetter = game.word.slice(game.revealed_part.length).charAt(0);
    letterRevealed(nextLetter);
    this.dbGame = getWordGame();
    this.broadcast("wordGameHint", { game: this.dbGame });
    console.log("REVEAL LETTER", nextLetter);
  }

  handleGuess(user: ChatUser, guess: string) {
    console.log(`GUESS FROM ${user.userName} "${guess}"`);
    const game = this.getGame();
    if (!game) return this.endGame(null);
    if (!game?.guessed && guess.toLowerCase().trim() === game.word) {
      this.endGame(user);
    }
  }

  async tick() {
    const game = getWordGame();
    this.dbGame = game;
    if (!game || !game?.id) {
      this.endGame(null);
      return;
    }

    console.log(`game ${game.id} tick`);
    const elapsed = Date.now() - game.started_at;

    if (elapsed >= this.GAME_LENGTH_MS) {
      console.log("GAME SHOULD END");
      await this.endGame(null);
      return;
    }

    let targetHints = this.STARTING_HINT_COUNT;

    if (elapsed >= this.FIRST_HINT_MS) {
      targetHints +=
        1 +
        Math.floor((elapsed - this.FIRST_HINT_MS) / this.SUBSEQUENT_HINT_MS);
    }

    if (
      game.revealed_part.length < targetHints &&
      game.revealed_part.length < game.word.length - 1
    ) {
      this.revealLetter();
    }

    this.broadcast("wordGameState", { game: this.dbGame });
  }
}
