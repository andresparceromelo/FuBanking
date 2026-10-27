import { Task } from '@serenity-js/core';
import { Navigate } from '@serenity-js/web';

export const OpenFuBanking = {
  at: (targetUrl: string) =>
    Task.where(
      `#actor abre FuBanking en "${targetUrl}"`,
      Navigate.to(targetUrl),
    ),
};
