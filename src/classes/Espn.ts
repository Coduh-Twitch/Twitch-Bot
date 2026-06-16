import { EventEmitter } from "stream";
import Socket from "./Socket";
import { get } from "axios";
import { client, reply } from "..";
import { join } from "path";
import JsonStore from "./JsonStore";

let serverBaseUrl = `https://sports.core.api.espn.com`;
let siteBaseUrl = `https://site.api.espn.com/apis/site`;

export enum EspnEvents {
  Ready = "ready",
  SeasonSet = "seasonSet",
  GameStart = "gameStart",
  GameEnd = "gameEnd",
}

enum EspnEndpoints {
  ON_DAYS = "/v2/sports/{sport}/leagues/{league}/seasons/{year}/types/1/calendar/ondays?lang=en&region=us",
  EVENTS = "/v2/sports/{sport}/leagues/{league}/events",
  GET_EVENT = "/v2/sports/{sport}/leagues/{league}/events/{event}",
  GET_COMPETITION = "/v2/sports/{sport}/leagues/{league}/events/{event}/competitions/{competition}",
  GET_COMPETITOR = "/v2/sports/{sport}/leagues/{league}/events/{event}/competitions/{competition}/competitors/{competitor}",
  GET_COMPETITOR_SCORE = "/v2/sports/{sport}/leagues/{league}/events/{event}/competitions/{competition}/competitors/{competitor}/linescores",
}

export interface EspnEventList {
  $meta: {
    parameters: {
      week: string[];
      season: string[];
      seasontypes: string[];
    };
  };
  count: number;
  pageIndex: number;
  pageSize: number;
  pageCount: number;
  items: { $ref: string }[];
}

export interface EspnCompetition {
  $ref: string;
  id: string;
  guid: string;
  uid: string;
  date: string;
  attendance: number;
  type: {
    id: string;
    text: string;
    abbreviation: string;
    slug: string;
    type: string;
  };
  timeValid: boolean;
  dateValid: boolean;
  neutralSite: boolean;
  divisionCompetition: boolean;
  conferenceCompetition: boolean;
  previewAvailable: boolean;
  recapAvailable: boolean;
  boxscoreAvailable: boolean;
  lineupAvailable: boolean;
  gamecastAvailable: boolean;
  playByPlayAvailable: boolean;
  conversationAvailable: boolean;
  commentaryAvailable: boolean;
  pickcenterAvailable: boolean;
  summaryAvailable: boolean;
  liveAvailable: boolean;
  ticketsAvailable: boolean;
  shotChartAvailable: boolean;
  timeoutsAvailable: boolean;
  possessionArrowAvailable: boolean;
  onWatchESPN: boolean;
  recent: boolean;
  bracketAvailable: boolean;
  wallclockAvailable: boolean;
  highlightsAvailable: boolean;
  gameSource: {
    id: string;
    description: string;
    state: string;
  };
  boxscoreSource: {
    id: string;
    description: string;
    state: string;
  };
  playByPlaySource: {
    id: string;
    description: string;
    state: string;
  };
  linescoreSource: {
    id: string;
    description: string;
    state: string;
  };
  statsSource: {
    id: string;
    description: string;
    state: string;
  };
  venue: {
    $ref: string;
    id: string;
    guid: string;
    fullName: string;
    address: {
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    grass: boolean;
    indoor: boolean;
    images: {
      href: string;
      height: number;
      width: number;
      alt: string;
      rel: string[];
    }[];
  };

  competitors: {
    $ref: string;
    id: string;
    uid: string;
    type: string;
    order: number;
    homeAway: string;
    team: { $ref: string };
    score: { $ref: string };
    record: { $ref: string };
  }[];

  notes: string[];
  situation: { $ref: string };
  odds: { $ref: string };
  status: { $ref: string };
  broadcasts: { $ref: string };
  tickets: { $ref: string };

  links: {
    language: string;
    rel: string[];
    href: string;
    text: string;
    shortText: string;
    isExternal: boolean;
    isPremium: boolean;
  }[];
}

export interface EspnCompetitionList {
  $ref: string;
  id: string;
  uid: string;
  date: string;
  name: string;
  shortName: string;
  season: { $ref: string };
  seasonType: { $ref: string };
  week: { $ref: string };
  timeValid: boolean;
  competitions: EspnCompetition[];
}

export interface EspnCompetitor {
  $ref: string;
  id: string;
  uid: string;
  type: string;
  order: number;
  homeAway: string;
  winner: boolean;
  advance: boolean;
}

export interface EspnLineScore {
  $ref: string;
  value: number;
  displayValue: string;
  source: {
    id: string;
    description: string;
  };
}

export interface EspnLineScoreList {
  count: number;
  pageIndex: number;
  pageSize: number;
  pageCount: number;
  items: EspnLineScore[];
}

export interface EspnEventVenue {
  $ref: string;
  id: string;
  guid: string;
  fullName: string;
  address: {
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  grass: boolean;
  indoor: boolean;
  images: {
    href: string;
    width: number;
    height: number;
    alt: string;
    rel: string;
  }[];
}

export interface EspnSeasonEvent {
  $ref: string;
  id: string;
  uid: string;
  date: string;
  name: string;
  shortName: string;
  season: { $ref: string };
  seasonType: { $ref: string };
  week: { $ref: string };
  timeValid: boolean;
  competitions: {
    $ref: string;
    id: string;
    guid: string;
    uid: string;
    date: string;
    attendance: number;
    type: {
      id: string;
      text: string;
      abbreviation: string;
      slug: string;
      type: string;
    };
    timeValid: boolean;
    dateValid: boolean;
    neutralSite: boolean;
    divisionCompetition: boolean;
    conferenceCompetition: boolean;
    previewAvailable: boolean;
    recapAvailable: boolean;
    boxscoreAvailable: boolean;
    lineupAvailable: boolean;
    gamecastAvailable: boolean;
    playByPlayAvailable: boolean;
    conversationAvailable: boolean;
    commentaryAvailable: boolean;
    pickcenterAvailable: boolean;
    summaryAvailable: boolean;
    liveAvailable: boolean;
    ticketsAvailable: boolean;
    shotChartAvailable: boolean;
    timeoutsAvailable: boolean;
    possessionArrowAvailable: boolean;
    onWatchESPN: boolean;
    recent: boolean;
    bracketAvailable: boolean;
    wallclockAvailable: boolean;
    highlightsAvailable: boolean;
    gameSource: { id: string; description: string; state: string };
    boxscoreSource: { id: string; description: string; state: string };
    playByPlaySource: { id: string; description: string; state: string };
    linescoreSource: { id: string; description: string; state: string };
    statsSource: { id: string; description: string; state: string };
    venue: EspnEventVenue;
    competitors: {
      $ref: string;
      id: string;
      uid: string;
      type: string;
      order: number;
      homeAway: string;
      team: { $ref: string };
      score: { $ref: string };
      record: { $ref: string };
    }[];
    notes: any[];
    situation: { $ref: string };
    status: { $ref: string };
    odds: { $ref: string };
    broadcasts: { $ref: string };
    tickets: { $ref: string };
    links: {
      language: string;
      rel: string;
      href: string;
      text: string;
      shortText: string;
      isExternal: boolean;
      isPremium: boolean;
    }[];
    predictor: { $ref: string };
    powerIndexes: { $ref: string };
    format: {
      regulation: {
        periods: number;
        displayName: string;
        slug: string;
        clock: number;
      };
      overtime: {
        periods: number;
        displayName: string;
        slug: string;
        clock: number;
      };
      suddenDeath: { periods: number; clock: number };
    };
    relevancy: { $ref: string };
    drives: { $ref: string };
    hasDefensiveStats: boolean;
  }[];
  links: {
    language: string;
    rel: string;
    href: string;
    text: string;
    shortText: string;
    isExternal: boolean;
    isPremium: boolean;
  }[];
  venues: { $ref: string }[];
  league: { $ref: string };
}

export interface EspnOndayCalendar {
  $ref: string;
  type: string;
  startDate: string;
  endDate: string;
  eventDate: {
    type: "ondays";
    dates: string[];
  };
  sections: {
    label: string;
    value: string;
    startDate: string;
    endDate: string;
    entries: {
      label: string;
      alternateLabel: string;
      detail: string;
      value: string;
      startDate: string;
      endDate: string;
      seasonType: {
        $ref: string;
      };
    }[];
  }[];
}

export enum EspnSeason {
  HOCKEY = "hockey",
  FOOTBALL = "football",
  BASKETBALL = "basketball",
  BASEBALL = "baseball",
  SOCCER = "soccer",
  NONE = "none",
}

const leagues: Record<string, string> = {
  [`${EspnSeason.SOCCER}`]: "fifa.world",
  [`${EspnSeason.BASKETBALL}`]: "nba",
  [`${EspnSeason.FOOTBALL}`]: "nfl",
  [`${EspnSeason.BASEBALL}`]: "mlb",
  [`${EspnSeason.HOCKEY}`]: "nhl",
};

const leaguesReadable: Record<string, string> = {
  [`${EspnSeason.SOCCER}`]: "FIFA World Cup",
  [`${EspnSeason.BASKETBALL}`]: "National Basketball Association",
  [`${EspnSeason.FOOTBALL}`]: "National Football League",
  [`${EspnSeason.BASEBALL}`]: "Major League Baseball",
  [`${EspnSeason.HOCKEY}`]: "National Hockey League",
};

const emojis: Record<string, string> = {
  [`${EspnSeason.SOCCER}`]: "⚽",
  [`${EspnSeason.BASKETBALL}`]: "🏀",
  [`${EspnSeason.FOOTBALL}`]: "🏈",
  [`${EspnSeason.BASEBALL}`]: "⚾",
  [`${EspnSeason.HOCKEY}`]: "🏒",
};

const periodTerms: Record<string, string> = {
  [`${EspnSeason.SOCCER}`]: "Half",
  [`${EspnSeason.BASKETBALL}`]: "Quarter",
  [`${EspnSeason.FOOTBALL}`]: "Quarter",
  [`${EspnSeason.BASEBALL}`]: "Inning",
  [`${EspnSeason.HOCKEY}`]: "Period",
};

interface StoredEspnData {
  season: EspnSeason | null;
  event: EspnSeasonEvent | null;
  competition: EspnCompetition | null;
  venue: EspnEventVenue | null;
  muted: boolean;
}

export default class Espn {
  interval: NodeJS.Timeout;
  eventEmitter: EventEmitter;
  season: EspnSeason;
  event: EspnSeasonEvent;
  competition: EspnCompetition;
  venue: EspnEventVenue;
  homeScore: number;
  awayScore: number;
  homeId: string;
  awayId: string;
  homeTeam: string;
  awayTeam: string;
  timeFormatted: string;
  period: number;
  oldScores: { home: number; away: number };
  updated: boolean;
  checkedSeasons: EspnSeason[];
  store: JsonStore<StoredEspnData>;
  muted: boolean;
  savedClock: string;
  statusText: string;
  savedStatus: string;
  savedPeriod: number;

  constructor(emitter: EventEmitter) {
    this.season = EspnSeason.NONE;
    this.eventEmitter = emitter;
    this.oldScores = { away: 0, home: 0 };
    this.updated = false;
    this.checkedSeasons = [];
    this.store = new JsonStore<StoredEspnData>("sports_store");
    this.muted = false;
  }

  ordinalSuffix(i: number): string {
    let j = i % 10,
      k = i % 100;
    if (j === 1 && k !== 11) {
      return i.toLocaleString() + "st";
    }
    if (j === 2 && k !== 12) {
      return i.toLocaleString() + "nd";
    }
    if (j === 3 && k !== 13) {
      return i.toLocaleString() + "rd";
    }
    return i.toLocaleString() + "th";
  }

  getLeagueReadable(sport: EspnSeason = this.season): string {
    return leaguesReadable[`${sport}`];
  }

  formatGameStart(): string {
    const WEEK_IN_MILLIS = 6.048e8,
      DAY_IN_MILLIS = 8.64e7,
      HOUR_IN_MILLIS = 3.6e6,
      MIN_IN_MILLIS = 6e4,
      SEC_IN_MILLIS = 1e3;

    let currentDate = new Date();
    const getCurrentUTCTime = () =>
      currentDate.getTime() - currentDate.getTimezoneOffset() * 60000;

    const timeFromNow = (date, formatter) => {
      let d = new Date(date);
      const millis =
          typeof date === "string"
            ? d.getTime() - d.getTimezoneOffset() * 60000
            : date.getTime() - date.getTimezoneOffset() * 60000,
        diff = millis - getCurrentUTCTime();
      if (Math.abs(diff) > WEEK_IN_MILLIS)
        return formatter.format(Math.trunc(diff / WEEK_IN_MILLIS), "week");
      else if (Math.abs(diff) > DAY_IN_MILLIS)
        return formatter.format(Math.trunc(diff / DAY_IN_MILLIS), "day");
      else if (Math.abs(diff) > HOUR_IN_MILLIS)
        return formatter.format(
          Math.trunc((diff % DAY_IN_MILLIS) / HOUR_IN_MILLIS),
          "hour",
        );
      else if (Math.abs(diff) > MIN_IN_MILLIS)
        return formatter.format(
          Math.trunc((diff % HOUR_IN_MILLIS) / MIN_IN_MILLIS),
          "minute",
        );
      else
        return formatter.format(
          Math.trunc((diff % MIN_IN_MILLIS) / SEC_IN_MILLIS),
          "second",
        );
    };

    const dateFormatter = new Intl.RelativeTimeFormat("en", { style: "long" });

    return timeFromNow(new Date(this.competition.date), dateFormatter);
  }

  updateStore(): JsonStore<StoredEspnData> {
    this.store.writeJson({
      competition: this.competition,
      event: this.event,
      season: this.season,
      venue: this.venue,
      muted: this.muted,
    });
    return this.store;
  }

  mute(): boolean {
    this.muted = true;
    this.updateStore();
    return this.muted;
  }

  unmute(): boolean {
    this.muted = false;
    this.updated = false;
    this.updateStore();
    return this.muted;
  }

  setSeason(season: EspnSeason): Espn {
    this.season = season;
    this.updateStore();
    return this;
  }

  getSeasonEmoji(season: EspnSeason = this.season): string {
    return emojis[`${season}`];
  }

  getScoreString(
    update: boolean = false,
    time: string = this.timeFormatted,
  ): string {
    if (this.period === 0) {
      return `${emojis[`${this.season}`]} ${this.homeTeam} v ${this.awayTeam} | ${this.period === 0 ? `Game starting ${this.formatGameStart()}` : `Time ${this.season === EspnSeason.SOCCER ? "Elapsed" : "Remaining"}: ${time} | ${this.ordinalSuffix(this.period)} ${periodTerms[`${this.season}`]}`}`;
    } else {
      return `${emojis[`${this.season}`]} ${update ? "Score Update:" : ""} ${this.homeTeam} ${this.homeScore || 0} <> ${this.awayScore || 0} ${this.awayTeam} ${this.period === 0 || (this.season === EspnSeason.BASEBALL && this.statusText !== "in") ? `| Game starting ${this.formatGameStart()}` : `${this.season === EspnSeason.BASEBALL ? `` : `Time ${this.season === EspnSeason.SOCCER ? "Elapsed" : "Remaining"}: ${time}`} | ${this.ordinalSuffix(this.period)} ${periodTerms[`${this.season}`]}`}`;
    }
  }

  resetListeners(): Espn {
    this.season = EspnSeason.NONE;
    this.event = null;
    this.competition = null;
    this.venue = null;
    this.homeScore = undefined;
    this.awayScore = undefined;
    this.updated = false;
    this.period = 0;
    this.statusText = "";
    this.checkedSeasons = [];
    this.updateStore();

    return this;
  }

  async getLeagueOnDays(sport: EspnSeason): Promise<EspnOndayCalendar | null> {
    let res = await get(
      `${serverBaseUrl}${EspnEndpoints.ON_DAYS.replace("{league}", leagues[`${sport}`]).replace("{sport}", sport).replace("{year}", `${new Date().getFullYear()}`)}`,
    );
    if (!res || !res.data) return null;

    return res.data;
  }

  async getCurrentEvent(
    sport: EspnSeason = this.season,
  ): Promise<EspnSeasonEvent | null> {
    let res = await get(
      `${serverBaseUrl}${EspnEndpoints.EVENTS.replace("{league}", leagues[`${sport}`]).replace("{sport}", sport)}`,
    );
    if (!res || !res.data) return null;
    let eventList: EspnEventList = res.data;
    let nearestEvent = null;

    for (const e of eventList.items) {
      // eventList.items?.[0];
      let eventData = await get(e.$ref);
      if (!eventData || !eventData.data) continue;
      let event: EspnSeasonEvent = eventData.data;
      if (new Date(event.date).getDate() <= new Date().getDate())
        nearestEvent = event;
    }

    return nearestEvent;
  }

  async getAllEvents(
    sport: EspnSeason = this.season,
  ): Promise<EspnSeasonEvent[]> {
    let res = await get(
      `${serverBaseUrl}${EspnEndpoints.EVENTS.replace("{league}", leagues[`${sport}`]).replace("{sport}", sport)}`,
    );

    if (!res || !res.data) return [];

    let eventList: EspnEventList = res.data;

    let toReturn: EspnSeasonEvent[] = [];

    for (const apiEvent of eventList.items) {
      let eventData = await get(apiEvent.$ref);
      if (!eventData || !eventData.data) continue;
      let event: EspnSeasonEvent = eventData.data;
      let eventDate = new Date(event.date);

      if (
        eventDate.getTime() >= Date.now() ||
        eventDate.getDate() === new Date().getDate()
      )
        toReturn.push(event);
    }

    return toReturn;
  }

  async getAllCompetitions(
    event: EspnSeasonEvent = this.event,
  ): Promise<EspnCompetition[]> {
    let res = await get(event.$ref);
    if (!res || !res.data) return [];

    let toReturn: EspnCompetition[] = [];

    for (const apiComp of res.data.competitions) {
      let compData = await get(apiComp.$ref);
      if (!compData || !compData.data) continue;
      toReturn.push(compData.data);
    }

    return toReturn;
  }

  async setCompetition(
    sport: EspnSeason,
    event: EspnSeasonEvent = this.event,
    competitionId: string,
  ): Promise<EspnCompetition | null> {
    if (!event) return null;

    let compData = event.competitions.find((c) => c.id === competitionId);
    if (!compData) return null;

    let res = await get(compData.$ref);
    if (!res || !res.data) return null;

    let competition: EspnCompetition = res.data;
    this.resetListeners();
    this.season = sport;
    this.competition = competition;
    this.event = event;
    this.venue = compData.venue;

    this.updateStore();

    return competition;
  }

  async getCompetition(): Promise<EspnCompetition | null> {
    let comp = null;
    for (const c of this.event.competitions.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    )) {
      let res = await get(c.$ref);
      if (!res || !res.data) return null;
      let competition: EspnCompetition = res.data;
      let statusRes = await get(c.status.$ref);
      if (statusRes?.data && statusRes.data?.type) {
        this.venue = c.venue;
        console.log(
          `Competition found @ ${c.venue.fullName} (completed: ${statusRes.data.type.completed})`,
        );
        if (!statusRes.data.type.completed) {
          comp = competition;
          this.statusText = statusRes.data.type.state;
          console.log("STATUS TEXT", this.statusText);
        }
      }
    }

    if (!comp) {
      console.log(`No competitions Found for ${this.season}`);
      // this.resetListeners();
      if (this.checkedSeasons.length === Object.values(EspnSeason).length - 1)
        this.checkedSeasons = [];
      this.checkedSeasons.push(this.season);
      this.event = null;
      this.venue = null;
      this.competition = null;
      this.setSeason(EspnSeason.NONE);
      this.updateStore();
    } else {
      console.log(`Found ${this.season} competition ${comp.id}`, comp);
    }

    return comp;
  }

  async updateCompetitors(): Promise<Espn> {
    for (const competitor of this.competition.competitors) {
      let teamData = await get(competitor.team.$ref);
      if (!teamData || !teamData.data) continue;
      let compData = await get(competitor.$ref);
      if (!compData || !compData.data) continue;

      let team = teamData.data;
      let comp: EspnCompetitor = compData.data;

      if (comp.homeAway === "home") {
        this.homeId = comp.id;
        this.homeTeam = team.displayName;
        let score = await get(competitor.score.$ref);
        if (!score || !score.data) {
          this.homeScore = 0;
          this.oldScores.home = 0;
        } else {
          if (this.homeScore !== this.oldScores.home)
            this.oldScores.home = this.homeScore;
          this.homeScore = score.data.value;
        }
      } else {
        this.awayId = comp.id;
        this.awayTeam = team.displayName;
        let score = await get(competitor.score.$ref);
        if (!score || !score.data) {
          this.awayScore = 0;
          this.oldScores.away = 0;
        } else {
          if (this.awayScore !== this.oldScores.away)
            this.oldScores.away = this.awayScore;
          this.awayScore = score.data.value;
        }
      }

      if (this.awayScore !== undefined && this.homeScore !== undefined) {
        if (this.homeTeam && this.awayTeam)
          await this.sendScoreUpdate(
            this.oldScores.home,
            this.oldScores.away,
            this.timeFormatted,
          );
      }
    }

    return this;
  }

  // async read

  async updateGameClock(): Promise<Espn> {
    let res = await get(this.competition.status.$ref);
    if (!res || !res.data) return this;
    this.savedClock = this.timeFormatted;
    this.timeFormatted = res.data.displayClock;
    this.savedPeriod = this.period;
    this.period = res.data.period;
    if (res.data.type?.state) {
      this.savedStatus = this.statusText;
      this.statusText = res.data.type.state;
    }
    console.log("STATUS TEXT", this.statusText);
    console.log("FROM TIME", this.savedClock);
    console.log("GAME TIME", this.timeFormatted);
    return this;
  }

  // async updateLineScores(): Promise<EspnLineScoreList | null> {
  //   let scores = await get(this.competition.)
  // }

  async startListener(): Promise<Espn> {
    this.interval = setInterval(async () => {
      if (
        this.event &&
        this.competition &&
        this.venue &&
        this.savedPeriod !== undefined &&
        this.timeFormatted
      ) {
        if (this.savedPeriod !== this.period) {
          this.savedPeriod = this.period;
          this.sendScoreUpdate(
            this.homeScore,
            this.awayScore,
            this.timeFormatted,
          );
        }
        //   if (
        //     this.timeFormatted !== undefined &&
        //     this.savedClock !== undefined &&
        //     this.timeFormatted !== this.savedClock
        //   ) {
        //     this.savedClock = this.timeFormatted;
        //     // if (
        //     //   this.season === EspnSeason.BASEBALL &&
        //     //   this.statusText !== undefined &&
        //     //   this.savedStatus !== undefined &&
        //     //   this.statusText === "in" &&
        //     //   this.savedStatus !== "in"
        //     // ) {
        //     //   this.eventEmitter.emit(
        //     //     EspnEvents.GameStart,
        //     //     this.competition,
        //     //     this.venue,
        //     //     this.event,
        //     //   );
        //     // }
        //   }
      }

      // Update JSON Store
      let json = this.store.getJson();
      if (json.competition && json.season && json.event && json.venue) {
        this.season = json.season;
        this.competition = json.competition;
        this.event = json.event;
        this.venue = json.venue;
        this.muted = json.muted;
      }

      if (!this.season || this.season === EspnSeason.NONE) {
        // Season Setter
        for (const sport of Object.values(EspnSeason).filter(
          (v) => !this.checkedSeasons.includes(v),
        )) {
          if (sport !== EspnSeason.NONE) {
            let calendar = await this.getLeagueOnDays(sport);
            let startDate = new Date(calendar.startDate);
            let endDate = new Date(calendar.endDate);
            let finalGame: Date = calendar.eventDate.dates
              .map((a) => new Date(a))
              .sort((a, b) => b.getTime() - a.getTime())[0];
            if (
              startDate.getTime() <= Date.now() &&
              endDate.getTime() > Date.now() &&
              finalGame.getTime() >= Date.now()
            ) {
              let formatter = Intl.DateTimeFormat("en-US", {
                dateStyle: "long",
              });
              console.log(`${sport} start date`, formatter.format(startDate));
              console.log(`${sport} end date`, formatter.format(endDate));

              console.log(
                "FINAL GAME DATE",
                sport,
                formatter.format(finalGame[0]),
              );
              this.season = sport;
            }
          }
        }
      } else {
        let calendar = await this.getLeagueOnDays(this.season);
        let startDate = new Date(calendar.startDate);
        let endDate = new Date(calendar.endDate);
        let finalGame: Date = calendar.eventDate.dates
          .map((a) => new Date(a))
          .sort((a, b) => b.getTime() - a.getTime())[0];
        if (
          !(
            startDate.getTime() <= Date.now() &&
            endDate.getTime() > Date.now() &&
            finalGame.getTime() >= Date.now()
          )
        ) {
          console.log("RESET ESPN SEASON");
          this.season = EspnSeason.NONE;
        }
      }

      console.log("ESPN SEASON", this.season);

      if (
        this.season !== EspnSeason.NONE &&
        (!this.competition ||
          !this.event ||
          new Date(this.event.date).getDate() !== new Date().getDate())
      ) {
        let nearestEvent = await this.getCurrentEvent();
        if (nearestEvent) {
          console.log(`Found ${this.season} event with ID ${nearestEvent.id}`);
          this.event = nearestEvent;
          if (this.event) {
            let competition = await this.getCompetition();
            this.competition = competition;
          }
        } else {
          console.log(`${this.season} event not found`);
        }
      }

      if (this.competition) {
        await this.updateGameClock();
        await this.updateCompetitors();
        if (this.competition?.status) {
          let updatedComp = (await get(this.competition.status.$ref)) || null;
          if (updatedComp && updatedComp.data) {
            if (updatedComp.data.type.completed) {
              this.eventEmitter.emit(
                EspnEvents.GameEnd,
                this.competition,
                this.event,
                this.venue,
                this.homeTeam,
                this.awayTeam,
                this.homeScore,
                this.awayScore,
              );
              // this.sendScoreUpdate(this.homeScore, this.awayScore, this.timeFormatted)
              this.resetListeners();
            }
          }
        }
      }

      this.updateStore();
    }, 2e3);

    return this;
  }

  async sendScoreUpdate(home: number, away: number, time: string) {
    if (this.competition && this.event) {
      if (
        home !== this.homeScore ||
        away !== this.awayScore ||
        (this.savedPeriod !== undefined && this.savedPeriod !== this.period)
      ) {
        if (!this.updated) {
          if (!this.muted) {
            this.updated = true;
            await reply(
              client,
              process.env.CHANNEL,
              this.getScoreString(true, time),
            );
          } else {
            console.log("Alerts are muted, skipping score update");
          }
        } else {
          this.updated = false;
        }
        // setTimeout(() => {
        //   this.updated = false;
        // }, 30e3);
        // } else {
        //   console.log("Skipping score update");
      }
    }
  }

  async init(): Promise<Espn> {
    await this.startListener();
    this.eventEmitter.emit(EspnEvents.Ready, {});
    return this;
  }
}
