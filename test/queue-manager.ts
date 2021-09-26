import { expect } from 'chai';
import { ValueQueueManager } from '../src/engine/value-queue-manager';

describe('queue manager', () => {
  const queueManager = new ValueQueueManager(['a', 'b', 'c']);

  it('can queue several values', () => {
    queueManager.push('a', 'a1');
    queueManager.push('a', 'a2');
    queueManager.push('a', 'a3');
    queueManager.push('a', 'a4');
    queueManager.push('a', 'a5');
    queueManager.push('b', 'b1');
    queueManager.push('b', 'b2');
    queueManager.push('b', 'b3');
    queueManager.push('c', 'c1');
    queueManager.push('a', 'a6');
    queueManager.push('c', 'c2');
    queueManager.push('c', 'c3');
    queueManager.push('b', 'b4');
  });

  it('cannot queue to unexisting queue', () => {
    let msg = 'No error';
    try {
      queueManager.push('d', 'd1');
    } catch (err) {
      msg = (err as Error).message;
    }
    expect(msg).to.be.eql('Queue name d does not exist in queue manager. Existing queues are: [a, b, c].');
  });

  it('can validate there are no empty queues', () => {
    queueManager.validateAllNonEmpty();
  });

  it('can check there are no empty queues', () => {
    expect(queueManager.allHaveContent()).to.be.eql(true);
  });

  it('can read top preserving values', () => {
    const top1 = queueManager.topAll();
    const top2 = queueManager.topAll();
    const top3 = queueManager.topAll();

    expect(top1).to.eql({ a: 'a1', b: 'b1', c: 'c1' });
    expect(top1).to.eql(top2);
    expect(top1).to.eql(top3);
  });

  it('can pop values', () => {
    const topBefore = queueManager.topAll();
    const removed1 = queueManager.popAll();

    const topAfter1 = queueManager.topAll();
    const removed2 = queueManager.popAll();

    const topAfter2 = queueManager.topAll();
    const removed3 = queueManager.popAll();

    expect(topBefore).to.eql(removed1);
    expect(topAfter1).to.eql(removed2);
    expect(topAfter2).to.eql(removed3);
    expect(topAfter1).to.eql({ a: 'a2', b: 'b2', c: 'c2' });
    expect(topAfter2).to.eql({ a: 'a3', b: 'b3', c: 'c3' });
  });

  it('can detect there are empty queues', () => {
    let msg = 'No error';
    try {
      queueManager.validateAllNonEmpty();
    } catch (err) {
      msg = (err as Error).message;
    }
    expect(msg).to.be.eql('Some of the queues are empty: [c].');
  });

  it('can check there are empty queues', () => {
    expect(queueManager.allHaveContent()).to.be.eql(false);
  });

  it('cannot read top values when at least one queue is empty', () => {
    let msg = 'No error';
    try {
      queueManager.topAll();
    } catch (err) {
      msg = (err as Error).message + ' - try 1';
    }
    expect(msg).to.be.eql('Some of the queues are empty: [c]. - try 1');

    // Try again and get the same error
    try {
      queueManager.topAll();
    } catch (err) {
      msg = (err as Error).message + ' - try 2';
    }
    expect(msg).to.be.eql('Some of the queues are empty: [c]. - try 2');
  });

  it('can get empty queues names', () => {
    expect(queueManager.getEmptyQueueNames()).to.be.eql(['c']);
  });

  it('can serialize and serialize', () => {
    const serialized = JSON.stringify(queueManager.toSerializable());
    const serializedAgain = JSON.stringify(queueManager.toSerializable());

    // Check serializing multiple times gives the same result
    expect(serialized).to.be.eql(serializedAgain);

    const queueManagerClone = ValueQueueManager.fromSerializable(JSON.parse(serialized));

    // Check unserialized manager is equal to original
    expect(queueManagerClone).to.be.eql(queueManager);
  });
});
