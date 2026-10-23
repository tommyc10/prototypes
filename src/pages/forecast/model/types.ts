/* The shape of the forecast: what the next few weeks should hold, built from the hindcast's
 * tickets and patterns (src/pages/hindcast/model). Every number on the page comes from
 * model/forecast.ts. */

import type { CauseKey, Horizon, Lookback, PatternEvidence } from '../../hindcast/model/types';


export interface ForecastScope {
  serviceId: string;
  weeks: Lookback;
  horizon: Horizon;
}

export interface HistoryPoint {
  start: string;
  actual: number;
  /** What the forecast said a week before, for the weeks it was tried on. */
  predicted: number | null;
}

export interface AheadPoint {
  start: string;
  expected: number;
  low: number;
  high: number;
}

export interface ServiceRisk {
  id: string;
  name: string;
  expected: number;
  low: number;
  high: number;
  /** Tickets in the same number of weeks just gone. */
  previous: number;
}

export interface DayRisk {
  date: string;
  expected: number;
  /** 0 to 4: how busy the day should be, against the others shown. */
  level: number;
  /** Ids of the predictions due that day. */
  predictions: string[];
}

export interface Prediction {
  id: string;
  evidence: PatternEvidence;
  /** The first day it's due, ISO date. */
  next: string;
  /** Every day it's due in the horizon. */
  dates: string[];
  likelihood: number;
  /** Tickets it should raise across the horizon. */
  expectedTickets: number;
  /** Likely to become an incident, not just a ticket. */
  likelyIncident: boolean;
}

export interface CauseOutlook {
  key: CauseKey;
  label: string;
  last: number;
  next: number;
}

export interface Forecast {
  scope: ForecastScope;
  history: HistoryPoint[];
  ahead: AheadPoint[];
  /** One minus the mean error of the one-week-ahead forecasts tried on recent weeks. */
  accuracy: number;
  totals: {
    expected: number;
    low: number;
    high: number;
    incidents: number;
    /** Tickets in the same number of weeks just gone. */
    previous: number;
    previousIncidents: number;
  };
  services: ServiceRisk[];
  days: DayRisk[];
  peak: DayRisk;
  predictions: Prediction[];
  causes: CauseOutlook[];
}
