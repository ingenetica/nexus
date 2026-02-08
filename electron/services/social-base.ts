export interface PublishResult {
  success: boolean
  externalId?: string
  error?: string
}

export interface SocialComment {
  id: string
  authorName: string
  authorUrl: string
  content: string
  createdAt: string
}

export abstract class SocialPlatform {
  abstract get name(): string
  abstract isConnected(): boolean
  abstract connect(): Promise<void>
  abstract disconnect(): Promise<void>
  abstract publish(content: string): Promise<PublishResult>
  abstract getComments(postExternalId: string): Promise<SocialComment[]>
  abstract replyToComment(commentId: string, text: string): Promise<PublishResult>
}
