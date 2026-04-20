import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) { }

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const cacheKey = `${request.method}:${request.url}`;

    // Try to get cached data
    const cachedData = await this.cacheManager.get(cacheKey);

    if (cachedData) {
      console.log(`🔄 Cache hit for ${cacheKey}`);
      return of(cachedData);
    }

    console.log(`💾 Cache miss for ${cacheKey}`);

    return next.handle().pipe(
      tap(async (data) => {
        // Cache the response for 5 minutes
        await this.cacheManager.set(cacheKey, data, 300000);
      }),
    );
  }
}
