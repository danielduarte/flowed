// @todo Check if this could be the same as ValueMap
import { AnyValue, ValueMap } from '../types';

export type ValueQueue = AnyValue[];

export interface ValueQueueMap {
  [name: string]: ValueQueue;
}

// Everything needed to create a ValueQueueManager restoring a previous state
export type SerializableValueQueueManager = ValueQueueMap;

export class ValueQueueManager {
  public static fromSerializable(serializable: SerializableValueQueueManager): ValueQueueManager {
    const queueNames = Object.keys(serializable);
    const instance = new ValueQueueManager(queueNames);
    instance.queues = serializable;
    instance.nonEmptyQueues = queueNames.reduce((acc, name) => {
      if (instance.queues[name].length > 0) {
        acc.add(name);
      }
      return acc;
    }, new Set<string>());
    return instance;
  }

  protected queues: ValueQueueMap;

  // This field can be calculated from this.queues
  protected queueNames: string[]; // List of queue names

  // This field can be calculated from this.queues
  protected nonEmptyQueues: Set<string>; // List of queue names

  public constructor(queueNames: string[]) {
    this.nonEmptyQueues = new Set();
    this.queueNames = [...queueNames];
    this.queues = queueNames.reduce((acc: ValueQueueMap, name) => {
      acc[name] = [];
      return acc;
    }, {});
  }

  public push(queueName: string, value: AnyValue) {
    if (!this.queueNames.includes(queueName)) {
      throw new Error(`Queue name ${queueName} does not exist in queue manager. Existing queues are: [${this.queueNames.join(', ')}].`);
    }

    this.nonEmptyQueues.add(queueName);
    this.queues[queueName].push(value);
  }

  public getEmptyQueueNames() {
    return this.queueNames.reduce((acc: string[], name: string) => {
      if (this.queues[name].length === 0) {
        acc.push(name);
      }
      return acc;
    }, []);
  }

  public popAll(): ValueMap {
    this.validateAllNonEmpty();

    return this.queueNames.reduce((acc: ValueMap, name: string) => {
      acc[name] = this.queues[name].shift();
      if (this.queues[name].length === 0) {
        this.nonEmptyQueues.delete(name);
      }
      return acc;
    }, {});
  }

  public topAll(): ValueMap {
    this.validateAllNonEmpty();

    return this.queueNames.reduce((acc: ValueMap, name: string) => {
      acc[name] = this.queues[name][0];
      return acc;
    }, {});
  }

  // For this to work, all user values must be serializable to JSON
  public toSerializable(): SerializableValueQueueManager {
    return JSON.parse(JSON.stringify(this.queues));
  }

  public validateAllNonEmpty() {
    if (!this.allHaveContent()) {
      throw new Error(`Some of the queues are empty: [${this.getEmptyQueueNames().join(', ')}].`);
    }
  }

  public allHaveContent() {
    return this.nonEmptyQueues.size === this.queueNames.length;
  }
}
