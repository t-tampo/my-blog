import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PostsResolver } from './post.resolvers';

@Module({
  providers: [PostsResolver, ConfigService],
})
export class PostsModule {}
