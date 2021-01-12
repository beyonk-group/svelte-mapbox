import Queue from 'fastq'

export class EventQueue {
  constructor (worker) {
    this.queue = new Queue(this, worker, 1)
    this.queue.pause()
  }

  send (command, params = []) {
    if (!command) { return }
    this.queue.push([ command, params ])
  }

  start () {
    this.queue.resume()
  }

  stop () {
    this.queue.kill()
  }
}
