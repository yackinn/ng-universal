import { Logger }                         from '@nestjs/common';
import * as express                       from 'express';
import 'reflect-metadata';
import 'zone.js/dist/zone-node';
import { CacheKeyByOriginalUrlGenerator } from '../cache/cache-key-by-original-url.generator';
import { AngularUniversalOptions }        from '../interfaces/angular-universal-options.interface';
import { CacheStorage }                   from '../interfaces/cache-storage.interface';

const DEFAULT_CACHE_EXPIRATION_TIME = 60000; // 60 seconds

export function setupUniversal(
  app: any,
  ngOptions: AngularUniversalOptions,
  ngStorageProvider: CacheStorage
) {
  const logger       = new Logger('AngularUniversalModule');
  const cacheOptions = getCacheOptions(ngOptions);

  app.engine('html', async (_, options, callback) => {
    let cacheKey;
    if (cacheOptions.isEnabled) {
      const cacheKeyGenerator = cacheOptions.keyGenerator;
      cacheKey                = cacheKeyGenerator.generateCacheKey(options.req);
      const cacheHtml         = await ngStorageProvider.get(cacheKey, options.req);
      if (cacheHtml) {
        return callback(null, cacheHtml);
      }
    }

    const { AppSsrModule, ngExpressEngine } = await ngOptions.bootstrap();

    ngExpressEngine({
      bootstrap: AppSsrModule || ngOptions.bootstrap,
      inlineCriticalCss: ngOptions.inlineCriticalCss,
      providers: [
        {
          provide: 'serverUrl',
          useValue: `${options.req.protocol}://${options.req.get('host')}`
        },
        ...(ngOptions.extraProviders || [])
      ]
    })(_, options, (err, html) => {
      if (err && ngOptions.errorHandler) {
        return ngOptions.errorHandler({ err, html, renderCallback: callback });
      }

      if (err) {
        logger.error(err);
        return callback(err);
      }

      if (cacheOptions.isEnabled && cacheKey) {
        html = ngStorageProvider.set(cacheKey, html, options.req, cacheOptions.expiresIn) || html;
      }
      callback(null, html);
    });
  });

  app.set('view engine', 'html');
  app.set('views', ngOptions.viewsPath);

  // Serve static files
  app.get(
    ngOptions.rootStaticPath,
    express.static(ngOptions.viewsPath, {
      maxAge: 600,
      setHeaders: ngOptions.staticAssetsHeaders
    })
  );
}

export function getCacheOptions(ngOptions: AngularUniversalOptions) {
  if (!ngOptions.cache) {
    return {
      isEnabled: false
    };
  }
  if (typeof ngOptions.cache !== 'object') {
    return {
      isEnabled: true,
      expiresIn: DEFAULT_CACHE_EXPIRATION_TIME,
      keyGenerator: new CacheKeyByOriginalUrlGenerator()
    };
  }
  return {
    isEnabled: true,
    expiresIn: ngOptions.cache.expiresIn || DEFAULT_CACHE_EXPIRATION_TIME,
    keyGenerator:
      ngOptions.cache.keyGenerator || new CacheKeyByOriginalUrlGenerator()
  };
}
