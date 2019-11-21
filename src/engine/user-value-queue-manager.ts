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
  protected queues: UserValueQueueMap;

  // This field can be calculated from this.queues
  protected queueNames: string[]; // List of queue names

  public constructor(queueNames: string[]) {
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
    return this.queues;
  }

  public fromSerializable(serializable: SerializableUserValueQueueManager) {
    this.queues = serializable;
    this.queueNames = Object.keys(serializable);
  }

  public validateAllNonEmpty() {
    const emptyQueues = this.getEmptyQueueNames();
    if (emptyQueues.length > 0) {
      throw new Error(`Some of the queues are empty: [${emptyQueues.join(', ')}].`);
    }
  }
}
