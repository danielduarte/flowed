export type UserValue = any;

// @todo Check if this could be the same as GenericValueMap
export interface UserValueMap {
  [name: string]: UserValue;
}

export type UserValueQueue = UserValue[];

export interface UserValueQueueMap {
  [name: string]: UserValueQueue;
}

// Everything needed to create a UserValueQueueManager restoring a previous state
export type SerializableUserValueQueueManager = UserValueQueueMap;

export class UserValueQueueManager {
  public static fromSerializable(serializable: SerializableUserValueQueueManager): UserValueQueueManager {
    const queueNames = Object.keys(serializable);
    const instance = new UserValueQueueManager(queueNames);
    instance.queues = serializable;
    instance.nonEmptyQueues = queueNames.reduce((acc, name) => {
      if (instance.queues[name].length > 0) {
        acc.add(name);
      }
      return acc;
    }, new Set<string>());
    return instance;
  }

  protected queues: UserValueQueueMap;

  // This field can be calculated from this.queues
  protected queueNames: string[]; // List of queue names

  // This field can be calculated from this.queues
  protected nonEmptyQueues: Set<string>; // List of queue names

  public constructor(queueNames: string[]) {
    this.nonEmptyQueues = new Set();
    this.queueNames = [...queueNames];
    this.queues = queueNames.reduce((acc: UserValueQueueMap, name) => {
      acc[name] = [];
      return acc;
    }, {});
  }

  public push(queueName: string, value: UserValue) {
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

  public popAll(): UserValueMap {
    this.validateAllNonEmpty();

    return this.queueNames.reduce((acc: UserValueMap, name: string) => {
      acc[name] = this.queues[name].shift();
      if (this.queues[name].length === 0) {
        this.nonEmptyQueues.delete(name);
      }
      return acc;
    }, {});
  }

  public topAll(): UserValueMap {
    this.validateAllNonEmpty();

    return this.queueNames.reduce((acc: UserValueMap, name: string) => {
      acc[name] = this.queues[name][0];
      return acc;
    }, {});
  }

  // For this to work, all user values must be serializable to JSON
  public toSerializable(): SerializableUserValueQueueManager {
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
