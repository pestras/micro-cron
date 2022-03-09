# Pestras Micro Cron Job

Pestras micro plugin for creating cron jobs.

## install

```bash
npm i @pestras/micro @pestras/micro-cron
```

# Plugin

```ts
import { SERVICE, Micro } from '@pestras/micro';
import { MicroCron } from '@pestras/micro-cron';

Micro.plugins(new MicroCron());

@SERVICE()
class TestService {}

Micro.start(TestService);
```

### CRON Decorator

Using **CRON** decorator we can register any methods as a cron job specifing scheduling as the first paramerter.

```ts
import { SERVICE, Micro } from '@pestras/micro';
import { MicroCron, CRON } from '@pestras/micro-cron';

Micro.plugins(new MicroCron());

@SERVICE()
class TestService {

  // My job method will be called daily on 0 and 6 o'clock.
  @CRON({ hours: [0, 12] })
  myJob() {
    console.log('myJob called successfully');
  }
}

Micro.start(TestService);
```

## Schedule

Corn schedule support months, days, days of week, hours asn minutes.

Each of them supports four types of value

- **Interval**: As a nummber.
- **Range**: As a string dash separated range.
- **Multi range**: An array of string dash separated ranges.
- **Specifc**: Values as array of numbers.

```ts
class SomeService {

  @CRON({
    months: 3 // each three months of a year
    // or
    months: '4-7' // Apr - May - Jun - Jul of each year
    // or
    months: ['2-4', '6-8'] // Feb - Mar - Apr and Jun, Jul, Aug of each year
    // or
    months: [1, 5] // Only Feb and May of each year 
  })
  myJob() {
    console.log('myJob called successfully');
  }
} 
```

## Starting Stoping Jobs:

We can deactive jobs and reactivate using the following **MicroCron** static methods.

- **Start**: accepts a job name specified by the neme of the class slash the name of the method lowercased as *'testservice/myjob'*. 
- **Stop**: accepts a job name specified by the neme of the class slash the name of the method lowercased as *'testservice/myjob'*.
- **StopAll**: Stop all jobs untill restarted again.
- **StartAll**: Start all jobs.

***Note***: Stoping and starting are applied to the schedule, not calling the job method it self.

We can specify an initial state for any job as a second paraneter for the **CRON** decorator.

```ts
CRON({ minutes: 1 }, false) // inactive untill start later, default value is true
myJob() {

}
```

## Sub Services:

**CORN** can be called on any class method as long it is started by **Micro.start** method.
