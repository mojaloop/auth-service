import deferredJob, { JobInitiator, JobListener } from '~/shared/deferred-job'
import { Message } from "~/shared/pub-sub"

jest.mock('~/shared/deferred-job')

export function mockDeferredJobWithCallbackMessage(channel: string, message: Message) {
  // @ts-ignore
  deferredJob.mockImplementationOnce(() => ({
    init: jest.fn((jobInitiator: JobInitiator) => ({
      job: jest.fn((jobListener: JobListener) => ({
        wait: jest.fn(async () => {
          // simulate calling the jobInitiator
          await jobInitiator(channel, 1234)
          // simulate calling the jobListener
          await jobListener(message)
        })
      }))
    })),
    trigger: jest.fn()
  }))
}