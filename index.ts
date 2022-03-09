// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { Micro, MicroPlugin } from '@pestras/micro';

/**
 * number for intervals,
 * string form range,
 * array for specific values 
 */
export interface Schedule {
  months?: number | `${number}-${number}` | number[];
  days?: number | `${number}-${number}` | number[];
  daysOfWeek?: number | `${number}-${number}` | number[];
  hours?: number | `${number}-${number}` | number[];
  minutes?: number | `${number}-${number}` | number[];
}

const timeRangeList: Schedule = {
  months: [1, 12],
  days: [1, 31],
  daysOfWeek: [1, 7],
  hours: [0, 24],
  minutes: [0, 60]
}

export interface Job {
  name: string,
  service: any;
  method: string;
  schedule: Schedule;
  active: boolean;
}

const jobs: Job[] = [];

function parseSchedule(s: Schedule) {
  const result: Schedule = {};

  for (const prop in s) {
    const value = s[prop as keyof Schedule]
    if (!value)
      continue;

    if (Array.isArray(value))
      result[prop as keyof Schedule] = value;

    if (typeof value === 'string') {
      const range: number[] = [];
      const pairs = value.split('-').map(v => +v);

      for (let i = pairs[0]; i <= pairs[1]; i++)
        range.push(i);

      result[prop as keyof Schedule] = range;
      continue;
    }

    if (typeof value === 'number') {
      const values: number[] = [];
      for (let i = value; i <= (timeRangeList[prop as keyof Schedule] as number[])[1]; i += value)
        values.push(i);

      if (prop === 'hours') {
        let indexOf24 = values.indexOf(24);
        if (indexOf24 > -1)
          values.splice(indexOf24, 1, 0);
      } else if (prop == 'minutes') {
        let indexOf60 = values.indexOf(60);
        if (indexOf60 > -1)
          values.splice(indexOf60, 1, 0);
      }
      result[prop as keyof Schedule] = values;
    }
  }

  return result;
}

function parseDate(date: Date = new Date()) {
  return {
    months: date.getMonth() + 1,
    days: date.getDate(),
    daysOfWeek: date.getDay() + 1,
    hours: date.getHours(),
    minutes: date.getMinutes()
  } as Schedule
};

export function CRON(schedule: Schedule, active = true) {
  return (target: any, key: string) => {
    jobs.push({
      name: `${(target.constructor.name as string).toLowerCase()}/${key}`,
      service: target.constructor,
      method: key,
      schedule: parseSchedule(schedule),
      active
    });
  }
}

let activeCount = 0;

export class MicroCron extends MicroPlugin {
  private static _instance: MicroCron;

  constructor() {
    super();

    if (MicroCron._instance)
      return MicroCron._instance;

    MicroCron._instance = this;
  }

  init() {
    activeCount = jobs.filter(j => j.active).length;
    Micro.logger.info(`found ${activeCount} active cron jobs`);

    this.ready = true;
    this.live = true;

    this.start();
  }

  start() {
    setInterval(() => {
      if (activeCount === 0)
        return;

      for (const job of jobs)
        if (job.active)
          this.checkJob(job);

    }, 60000);
  }

  private checkJob(job: Job) {
    const date = parseDate();

    for (const prop in job.schedule) {
      if ((job.schedule[prop as keyof Schedule] as number[]).indexOf(date[prop as keyof Schedule] as number) === -1)
        return;
    }

    const service: any = Micro.getCurrentService(job.service)

    if (!service || typeof service[job.method] !== "function")
      return;

    Micro.logger.info(`running corn job '${job.name}'`);
    service[job.method]();
  }

  static StopAll() {
    Micro.logger.warn(`stoping all cron jobs`);
    jobs.forEach(j => j.active = false);
    Micro.logger.info(`number of current active cron jobs: ${activeCount}`);
  }

  static StartAll() {
    Micro.logger.info(`starting all cron jobs`);
    jobs.forEach(j => j.active = true);
    Micro.logger.info(`number of current active cron jobs: ${activeCount}`);
  }

  static Stop(name: string) {
    Micro.logger.info(`stoping cron job '${name}'`);
    const job = jobs.find(j => j.name === name);
    job.active = false;
    activeCount = jobs.filter(j => j.active).length;
    Micro.logger.info(`number of current active cron jobs: ${activeCount}`);
  }
  
  static Start(name: string) {
    Micro.logger.info(`starting cron job '${name}'`);
    const job = jobs.find(j => j.name === name)
    job.active = true;
    activeCount = jobs.filter(j => j.active).length;
    Micro.logger.info(`number of current active cron jobs: ${activeCount}`);
  }
}